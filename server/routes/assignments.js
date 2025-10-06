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
            t.image,
            t.customAttributes
          FROM assignment_tools at
          JOIN tools t ON at.toolId = t.id
          WHERE at.assignmentId = ?
        `, [assignment.id]);

        const parsedTools = tools.map(tool => ({
          ...tool,
          isCalibrable: Boolean(tool.isCalibrable),
          customAttributes: tool.customAttributes ? JSON.parse(tool.customAttributes) : {}
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

// POST /api/assignments - Create new assignment
router.post('/', async (req, res) => {
  try {
    const { checkoutDate, workerId, projectId, toolIds } = req.body;

    if (!checkoutDate || !workerId || !projectId || !toolIds || !Array.isArray(toolIds)) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create assignment
    const result = await runQuery(`
      INSERT INTO assignments (checkoutDate, workerId, projectId, status)
      VALUES (?, ?, ?, 'active')
    `, [checkoutDate, workerId, projectId]);

    const assignmentId = result.id;

    // Add tools to assignment
    for (const toolId of toolIds) {
      await runQuery(`
        INSERT INTO assignment_tools (assignmentId, toolId)
        VALUES (?, ?)
      `, [assignmentId, toolId]);

      // Update tool status to "In Use"
      await runQuery(`
        UPDATE tools SET status = 'In Use' WHERE id = ?
      `, [toolId]);
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
    `, [assignmentId]);

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

    // Update assignment
    await runQuery(`
      UPDATE assignments
      SET checkinDate = ?, status = 'completed', checkinNotes = ?, toolConditions = ?
      WHERE id = ?
    `, [checkinDate, checkinNotes || null, JSON.stringify(toolConditions || {}), req.params.id]);

    // Update tool statuses based on conditions
    if (toolConditions) {
      for (const [toolId, condition] of Object.entries(toolConditions)) {
        let newStatus = 'Available';
        if (condition === 'damaged') newStatus = 'Damaged';
        else if (condition === 'lost') newStatus = 'Lost';

        await runQuery(`
          UPDATE tools SET status = ? WHERE id = ?
        `, [newStatus, toolId]);
      }
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