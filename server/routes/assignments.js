import express from 'express';
import { runQuery, getQuery, allQuery } from '../database.js';

const router = express.Router();

// GET /api/assignments - Get all assignments
router.get('/', async (req, res) => {
  try {
    const assignments = await allQuery(`
      SELECT 
        a.id,
        a.checkoutDate,
          a.guiaNumber,
        a.checkoutNotes,
        a.checkinDate,
        a.status,
        a.checkinNotes,
        a.toolConditions,
        a.return_guide,
        w.id as workerId,
        w.name as workerName,
        w.employeeId as workerEmployeeId,
        p.id as projectId,
        p.name as projectName
      FROM assignments a
      JOIN workers w ON a.workerId = w.id
      JOIN projects p ON a.projectId = p.id
      ORDER BY a.checkoutDate DESC
    `);

    // Get tools for each assignment
    const assignmentsWithTools = await Promise.all(
      assignments.map(async (assignment) => {
        const tools = await allQuery(`
          SELECT 
            t.id,
            t.name,
            t.category,
            t.status,
            t.isCalibrable,
            t.calibrationDue,
            t.certificateNumber,
            t.quantity as availableQuantity,
            at.quantity as assignedQuantity,
            t.image,
            t.customAttributes
          FROM assignment_tools at
          JOIN tools t ON at.toolId = t.id
          WHERE at.assignmentId = ?
        `, [assignment.id]);

        const parsedTools = tools.map(tool => ({
          ...tool,
          isCalibrable: Boolean(tool.isCalibrable),
          customAttributes: tool.customAttributes ? JSON.parse(tool.customAttributes) : {},
          quantity: tool.assignedQuantity
        }));

        return {
          id: assignment.id,
          guiaNumber: assignment.guiaNumber,
          checkoutDate: assignment.checkoutDate,
          checkoutNotes: assignment.checkoutNotes,
          checkinDate: assignment.checkinDate,
          status: assignment.status,
          checkinNotes: assignment.checkinNotes,
          return_guide: assignment.return_guide || null,
          toolConditions: assignment.toolConditions ? JSON.parse(assignment.toolConditions) : {},
          worker: {
            id: assignment.workerId,
            name: assignment.workerName,
            employeeId: assignment.workerEmployeeId
          },
          project: {
            id: assignment.projectId,
            name: assignment.projectName
          },
          tools: parsedTools
        };
      })
    );

    res.json(assignmentsWithTools);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST /api/assignments - Create new assignment (quantity-aware)
router.post('/', async (req, res) => {
  try {
    const { checkoutDate, checkoutNotes, workerId, projectId, tools, guiaNumber } = req.body;

    if (!checkoutDate || !workerId || !projectId || !tools || !Array.isArray(tools)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate tools format: [{ toolId, quantity }]
    for (const t of tools) {
      if (!t.toolId || typeof t.quantity !== 'number' || t.quantity < 1) {
        return res.status(400).json({ error: 'Invalid tools payload' });
      }
    }

    // Start transaction for atomic checkout
    await runQuery('BEGIN TRANSACTION');
    let assignmentId;
    try {
      // Create assignment
      const result = await runQuery(`
        INSERT INTO assignments (checkoutDate, checkoutNotes, guiaNumber, workerId, projectId, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `, [checkoutDate, checkoutNotes || null, guiaNumber || null, workerId, projectId]);

      assignmentId = result.id;

      // Process each tool: ensure enough quantity, insert assignment_tools with quantity
      for (const t of tools) {
        // Check available quantity against total stock minus active assignments
        const toolRow = await getQuery(`SELECT id, name, quantity FROM tools WHERE id = ?`, [t.toolId]);
        if (!toolRow) {
          await runQuery('ROLLBACK');
          return res.status(400).json({ error: `Tool with ID ${t.toolId} not found.` });
        }
        const totalStock = toolRow.quantity || 0;

        const assignedRow = await getQuery(`
          SELECT SUM(at.quantity) as totalAssigned
          FROM assignment_tools at
          JOIN assignments a ON at.assignmentId = a.id
          WHERE at.toolId = ? AND a.status = 'active'
        `, [t.toolId]);
        const totalAssigned = assignedRow ? (assignedRow.totalAssigned || 0) : 0;

        const available = totalStock - totalAssigned;

        if (available < t.quantity) {
          await runQuery('ROLLBACK');
          return res.status(400).json({ 
            error: `Not enough stock for "${toolRow.name}". Available: ${available}, Requested: ${t.quantity}.` 
          });
        }

        await runQuery(`
          INSERT INTO assignment_tools (assignmentId, toolId, quantity)
          VALUES (?, ?, ?)
        `, [assignmentId, t.toolId, t.quantity]);

        // Mark as In Use. DO NOT decrement total quantity.
        await runQuery(`UPDATE tools SET status = 'In Use' WHERE id = ?`, [t.toolId]);
      }

      await runQuery('COMMIT');
    } catch (err) {
      console.error('Error during assignment transaction:', err);
      try { await runQuery('ROLLBACK'); } catch (e) { console.error('Rollback failed:', e); }
      return res.status(500).json({ error: 'Failed to create assignment' });
    }

    // Fetch the complete assignment
    const assignment = await getQuery(`
      SELECT 
        a.id,
        a.guiaNumber,
        a.checkoutDate,
        a.checkoutNotes,
        a.checkinDate,
        a.status,
        a.checkinNotes,
        a.toolConditions,
        w.id as workerId,
        w.name as workerName,
        w.employeeId as workerEmployeeId,
        p.id as projectId,
        p.name as projectName
      FROM assignments a
      JOIN workers w ON a.workerId = w.id
      JOIN projects p ON a.projectId = p.id
      WHERE a.id = ?
    `, [assignmentId]);

    const toolsRows = await allQuery(`
      SELECT 
        t.id,
        t.name,
        t.category,
        t.status,
        t.isCalibrable,
        t.calibrationDue,
        t.certificateNumber,
        t.quantity as availableQuantity,
        at.quantity as assignedQuantity,
        t.image,
        t.customAttributes
      FROM assignment_tools at
      JOIN tools t ON at.toolId = t.id
      WHERE at.assignmentId = ?
    `, [assignmentId]);

    const parsedTools = toolsRows.map(tool => ({
      ...tool,
      isCalibrable: Boolean(tool.isCalibrable),
      customAttributes: tool.customAttributes ? JSON.parse(tool.customAttributes) : {},
      quantity: tool.assignedQuantity
    }));

    const completeAssignment = {
      id: assignment.id,
      checkoutDate: assignment.checkoutDate,
      guiaNumber: assignment.guiaNumber,
      checkoutNotes: assignment.checkoutNotes,
      checkinDate: assignment.checkinDate,
      status: assignment.status,
      checkinNotes: assignment.checkinNotes,
      return_guide: assignment.return_guide || null,
      toolConditions: assignment.toolConditions ? JSON.parse(assignment.toolConditions) : {},
      worker: {
        id: assignment.workerId,
        name: assignment.workerName,
        employeeId: assignment.workerEmployeeId
      },
      project: {
        id: assignment.projectId,
        name: assignment.projectName
      },
      tools: parsedTools
    };

    res.status(201).json(completeAssignment);
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// PUT /api/assignments/:id/checkin - Check in assignment
router.put('/:id/checkin', async (req, res) => {
  try {
    const { checkinDate, checkinNotes, toolConditions, return_guide } = req.body;
    const finalCheckinDate = checkinDate || new Date().toISOString();
    const assignmentId = req.params.id;

    // Fetch assignment details BEFORE making changes
    const assignmentBefore = await getQuery(`
      SELECT id, status, toolConditions FROM assignments WHERE id = ?
    `, [assignmentId]);

    if (!assignmentBefore) {
      return res.status(400).json({ error: 'Assignment does not exist' });
    }
    
    const isAlreadyCompleted = assignmentBefore.status === 'completed';
    const oldToolConditions = isAlreadyCompleted && assignmentBefore.toolConditions 
      ? JSON.parse(assignmentBefore.toolConditions) 
      : {};

    // Get all tools for this assignment with their checkout quantities
    const toolsInAssignment = await allQuery(`
      SELECT 
        at.toolId, 
        at.quantity as checkoutQuantity,
        t.quantity as currentToolQuantity,
        t.status as toolStatus
      FROM assignment_tools at
      JOIN tools t ON at.toolId = t.id
      WHERE at.assignmentId = ?
    `, [assignmentId]);

    // Start transaction for atomic checkin
    await runQuery('BEGIN TRANSACTION');
    try {
      // Update assignment
      await runQuery(`
        UPDATE assignments
        SET checkinDate = ?, status = 'completed', checkinNotes = ?, toolConditions = ?, return_guide = ?
        WHERE id = ?
      `, [finalCheckinDate, checkinNotes || null, JSON.stringify(toolConditions || {}), return_guide || null, assignmentId]);

      // Update tool statuses based on conditions
      // Restore quantities for tools assigned to this assignment
      for (const toolRecord of toolsInAssignment) {
        const { toolId, checkoutQuantity } = toolRecord;
        const condition = toolConditions ? toolConditions[toolId] : null;
        const restoreAmount = checkoutQuantity || 0;

        // Helper: expand a condition value (string or object map) into
        // { good, damaged, lost, missing } quantities that sum to restoreAmount.
        const expandCondition = (cond, total) => {
          if (!cond) return { good: total, damaged: 0, lost: 0, missing: 0 };
          if (typeof cond === 'string') {
            return {
              good:    cond === 'good'    ? total : 0,
              damaged: cond === 'damaged' ? total : 0,
              lost:    cond === 'lost'    ? total : 0,
              missing: cond === 'missing' ? total : 0,
            };
          }
          // New object format — coerce all values to numbers
          return {
            good:    Number(cond.good)    || 0,
            damaged: Number(cond.damaged) || 0,
            lost:    Number(cond.lost)    || 0,
            missing: Number(cond.missing) || 0,
          };
        };

        if (isAlreadyCompleted) {
          const oldCond = expandCondition(oldToolConditions[toolId], restoreAmount);
          const newCond = expandCondition(condition, restoreAmount);

          // Revert old quantities
          if (oldCond.damaged > 0) await runQuery(`UPDATE tools SET damagedQuantity = damagedQuantity - ? WHERE id = ?`, [oldCond.damaged, toolId]);
          if (oldCond.lost    > 0) await runQuery(`UPDATE tools SET lostQuantity    = lostQuantity    - ? WHERE id = ?`, [oldCond.lost,    toolId]);

          // Apply new quantities
          if (newCond.damaged > 0) await runQuery(`UPDATE tools SET damagedQuantity = damagedQuantity + ? WHERE id = ?`, [newCond.damaged, toolId]);
          if (newCond.lost    > 0) await runQuery(`UPDATE tools SET lostQuantity    = lostQuantity    + ? WHERE id = ?`, [newCond.lost,    toolId]);
        } else {
          const newCond = expandCondition(condition, restoreAmount);

          if (newCond.damaged > 0) await runQuery(`UPDATE tools SET damagedQuantity = damagedQuantity + ? WHERE id = ?`, [newCond.damaged, toolId]);
          if (newCond.lost    > 0) await runQuery(`UPDATE tools SET lostQuantity    = lostQuantity    + ? WHERE id = ?`, [newCond.lost,    toolId]);
          // missing: quantities stay at 0 — tool remains unaccounted
        }

        // Re-evaluate tool status
        const activeAssignments = await allQuery(
          `SELECT at.quantity FROM assignment_tools at
           JOIN assignments a ON at.assignmentId = a.id
           WHERE at.toolId = ? AND a.status = 'active' AND a.id != ?`,
          [toolId, assignmentId]
        );
        const inUseCount = activeAssignments.reduce((sum, row) => sum + row.quantity, 0);

        const toolStats = await getQuery(`SELECT quantity, damagedQuantity, lostQuantity FROM tools WHERE id = ?`, [toolId]);
        const newCond = expandCondition(condition, restoreAmount);

        const totalOwned = toolStats.quantity || 0;
        const damagedCount = toolStats.damagedQuantity || 0;
        const lostCount = toolStats.lostQuantity || 0;
        const missingCount = newCond.missing || 0;

        const availableCount = totalOwned - inUseCount - damagedCount - lostCount - missingCount;

        let finalStatus = 'Available';
        if (inUseCount > 0 || missingCount > 0) {
          finalStatus = 'In Use';
        } else if (availableCount <= 0) {
          if (lostCount > 0) finalStatus = 'Lost';
          else if (damagedCount > 0) finalStatus = 'Damaged';
          else if (totalOwned === 0) finalStatus = 'In Use';
          else if (lostCount > 0) finalStatus = 'Lost';
          else if (damagedCount > 0) finalStatus = 'Damaged';
          else finalStatus = 'Available';
        }

        await runQuery(`UPDATE tools SET status = ? WHERE id = ?`, [finalStatus, toolId]);
      }

      await runQuery('COMMIT');
    } catch (err) {
      console.error('Error during checkin transaction:', err);
      try { await runQuery('ROLLBACK'); } catch (e) { console.error('Rollback failed:', e); }
      return res.status(500).json({ error: 'Failed to check in assignment' });
    }

    // Fetch updated assignment
    const assignment = await getQuery(`
      SELECT 
        a.id,
        a.guiaNumber,
        a.checkoutDate,
        a.checkoutNotes,
        a.checkinDate,
        a.status,
        a.checkinNotes,
        a.toolConditions,
        a.return_guide,
        w.id as workerId,
        w.name as workerName,
        w.employeeId as workerEmployeeId,
        p.id as projectId,
        p.name as projectName
      FROM assignments a
      JOIN workers w ON a.workerId = w.id
      JOIN projects p ON a.projectId = p.id
      WHERE a.id = ?
    `, [req.params.id]);

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const tools = await allQuery(`
      SELECT 
        t.id,
        t.name,
        t.category,
        t.status,
        t.isCalibrable,
        t.calibrationDue,
        t.image,
        t.customAttributes,
        at.quantity as assignedQuantity
      FROM assignment_tools at
      JOIN tools t ON at.toolId = t.id
      WHERE at.assignmentId = ?
    `, [req.params.id]);

    const parsedTools = tools.map(tool => ({
      ...tool,
      isCalibrable: Boolean(tool.isCalibrable),
      customAttributes: tool.customAttributes ? JSON.parse(tool.customAttributes) : {},
      quantity: tool.assignedQuantity
    }));

    const completeAssignment = {
      id: assignment.id,
      guiaNumber: assignment.guiaNumber,
      checkoutDate: assignment.checkoutDate,
      checkoutNotes: assignment.checkoutNotes,
      checkinDate: assignment.checkinDate,
      status: assignment.status,
      checkinNotes: assignment.checkinNotes,
      return_guide: assignment.return_guide || null,
      toolConditions: assignment.toolConditions ? JSON.parse(assignment.toolConditions) : {},
      worker: {
        id: assignment.workerId,
        name: assignment.workerName,
        employeeId: assignment.workerEmployeeId
      },
      project: {
        id: assignment.projectId,
        name: assignment.projectName
      },
      tools: parsedTools
    };

    res.json(completeAssignment);
  } catch (error) {
    console.error('Error checking in assignment:', error);
    res.status(500).json({ error: 'Failed to check in assignment' });
  }
});

export default router;