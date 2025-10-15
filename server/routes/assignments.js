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
          checkoutDate: assignment.checkoutDate,
          checkinDate: assignment.checkinDate,
          status: assignment.status,
          checkinNotes: assignment.checkinNotes,
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
    const { checkoutDate, workerId, projectId, tools } = req.body;

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
        INSERT INTO assignments (checkoutDate, workerId, projectId, status)
        VALUES (?, ?, ?, 'active')
      `, [checkoutDate, workerId, projectId]);

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
        a.checkoutDate,
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
      checkinDate: assignment.checkinDate,
      status: assignment.status,
      checkinNotes: assignment.checkinNotes,
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
    const { checkinNotes, toolConditions } = req.body;
    const checkinDate = new Date().toISOString();

    // Start transaction for atomic checkin
    await runQuery('BEGIN TRANSACTION');
    try {
      // Update assignment
      await runQuery(`
        UPDATE assignments
        SET checkinDate = ?, status = 'completed', checkinNotes = ?, toolConditions = ?
        WHERE id = ?
      `, [checkinDate, checkinNotes || null, JSON.stringify(toolConditions || {}), req.params.id]);

      // Update tool statuses based on conditions (damaged/lost override)
      const damagedOrLost = new Set();
      if (toolConditions) {
        for (const [toolId, condition] of Object.entries(toolConditions)) {
          if (condition === 'damaged' || condition === 'lost') {
            const newStatus = condition === 'damaged' ? 'Damaged' : 'Lost';
            await runQuery(`UPDATE tools SET status = ? WHERE id = ?`, [newStatus, toolId]);
            damagedOrLost.add(Number(toolId));
          }
        }
      }

      // Restore quantities for tools assigned to this assignment
      const assigned = await allQuery(`SELECT toolId, quantity FROM assignment_tools WHERE assignmentId = ?`, [req.params.id]);
      for (const row of assigned) {
        await runQuery(`UPDATE tools SET quantity = quantity + ? WHERE id = ?`, [row.quantity || 0, row.toolId]);

        // If tool was not damaged/lost, and there are NO other active assignments using this tool, mark Available
        if (!damagedOrLost.has(row.toolId)) {
          const activeCountRow = await getQuery(`SELECT COUNT(*) as cnt FROM assignment_tools at JOIN assignments a ON at.assignmentId = a.id WHERE at.toolId = ? AND a.status = 'active'`, [row.toolId]);
          const activeCount = activeCountRow ? activeCountRow.cnt : 0;
          if (!activeCount || Number(activeCount) === 0) {
            await runQuery(`UPDATE tools SET status = 'Available' WHERE id = ?`, [row.toolId]);
          }
        }
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
        a.checkoutDate,
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
        t.customAttributes
      FROM assignment_tools at
      JOIN tools t ON at.toolId = t.id
      WHERE at.assignmentId = ?
    `, [req.params.id]);

    const parsedTools = tools.map(tool => ({
      ...tool,
      isCalibrable: Boolean(tool.isCalibrable),
      customAttributes: tool.customAttributes ? JSON.parse(tool.customAttributes) : {}
    }));

    const completeAssignment = {
      id: assignment.id,
      checkoutDate: assignment.checkoutDate,
      checkinDate: assignment.checkinDate,
      status: assignment.status,
      checkinNotes: assignment.checkinNotes,
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