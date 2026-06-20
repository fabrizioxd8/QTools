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

      // Process each tool: ensure enough quantity, insert assignment_tools with quantity, decrement tools.quantity
      for (const t of tools) {
        // Check available quantity
        const toolRow = await getQuery(`SELECT id, quantity FROM tools WHERE id = ?`, [t.toolId]);
        const available = toolRow ? (toolRow.quantity || 0) : 0;
        if (available < t.quantity) {
          // Not enough: rollback and return error
          await runQuery('ROLLBACK');
          return res.status(400).json({ error: `Not enough quantity for tool ${t.toolId}` });
        }

        await runQuery(`
          INSERT INTO assignment_tools (assignmentId, toolId, quantity)
          VALUES (?, ?, ?)
        `, [assignmentId, t.toolId, t.quantity]);

        // Decrement available quantity and mark as In Use (any checked-out units => In Use)
        await runQuery(`
          UPDATE tools SET quantity = quantity - ?, status = 'In Use' WHERE id = ?
        `, [t.quantity, t.toolId]);
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
          if (oldCond.good    > 0) await runQuery(`UPDATE tools SET quantity        = quantity        - ? WHERE id = ?`, [oldCond.good,    toolId]);
          if (oldCond.damaged > 0) await runQuery(`UPDATE tools SET damagedQuantity = damagedQuantity - ? WHERE id = ?`, [oldCond.damaged, toolId]);
          if (oldCond.lost    > 0) await runQuery(`UPDATE tools SET lostQuantity    = lostQuantity    - ? WHERE id = ?`, [oldCond.lost,    toolId]);

          // Apply new quantities
          if (newCond.good    > 0) await runQuery(`UPDATE tools SET quantity        = quantity        + ? WHERE id = ?`, [newCond.good,    toolId]);
          if (newCond.damaged > 0) await runQuery(`UPDATE tools SET damagedQuantity = damagedQuantity + ? WHERE id = ?`, [newCond.damaged, toolId]);
          if (newCond.lost    > 0) await runQuery(`UPDATE tools SET lostQuantity    = lostQuantity    + ? WHERE id = ?`, [newCond.lost,    toolId]);
        } else {
          const newCond = expandCondition(condition, restoreAmount);

          if (newCond.good    > 0) await runQuery(`UPDATE tools SET quantity        = quantity        + ? WHERE id = ?`, [newCond.good,    toolId]);
          if (newCond.damaged > 0) await runQuery(`UPDATE tools SET damagedQuantity = damagedQuantity + ? WHERE id = ?`, [newCond.damaged, toolId]);
          if (newCond.lost    > 0) await runQuery(`UPDATE tools SET lostQuantity    = lostQuantity    + ? WHERE id = ?`, [newCond.lost,    toolId]);
          // missing: quantities stay at 0 — tool remains unaccounted
        }

        // Re-evaluate tool status
        const activeCountRow = await getQuery(
          `SELECT COUNT(*) as cnt FROM assignment_tools at
           JOIN assignments a ON at.assignmentId = a.id
           WHERE at.toolId = ? AND a.status = 'active' AND a.id != ?`,
          [toolId, assignmentId]
        );
        const activeCount = activeCountRow ? activeCountRow.cnt : 0;

        const toolStats = await getQuery(`SELECT quantity, damagedQuantity, lostQuantity FROM tools WHERE id = ?`, [toolId]);
        const newCond = expandCondition(condition, restoreAmount);
        const hasMissing = newCond.missing > 0;
        let finalStatus = 'Available';
        if (activeCount > 0 || hasMissing) {
          finalStatus = 'In Use';
        } else if (toolStats.quantity === 0 && toolStats.damagedQuantity > 0) {
          finalStatus = 'Damaged';
        } else if (toolStats.quantity === 0 && toolStats.lostQuantity > 0 && toolStats.damagedQuantity === 0) {
          finalStatus = 'Lost';
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