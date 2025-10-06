import express from 'express';
import { runQuery, getQuery, allQuery } from '../database.js';

const router = express.Router();

// GET /api/workers - Get all workers
router.get('/', async (req, res) => {
  try {
    const workers = await allQuery(`
      SELECT id, name, employeeId
      FROM workers
      ORDER BY name
    `);

    res.json(workers);
  } catch (error) {
    console.error('Error fetching workers:', error);
    res.status(500).json({ error: 'Failed to fetch workers' });
  }
});

// GET /api/workers/:id - Get single worker
router.get('/:id', async (req, res) => {
  try {
    const worker = await getQuery(`
      SELECT id, name, employeeId
      FROM workers
      WHERE id = ?
    `, [req.params.id]);

    if (!worker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json(worker);
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ error: 'Failed to fetch worker' });
  }
});

// POST /api/workers - Create new worker
router.post('/', async (req, res) => {
  try {
    const { name, employeeId } = req.body;

    if (!name || !employeeId) {
      return res.status(400).json({ error: 'Name and employee ID are required' });
    }

    const result = await runQuery(`
      INSERT INTO workers (name, employeeId)
      VALUES (?, ?)
    `, [name, employeeId]);

    const newWorker = await getQuery(`
      SELECT id, name, employeeId
      FROM workers
      WHERE id = ?
    `, [result.id]);

    res.status(201).json(newWorker);
  } catch (error) {
    console.error('Error creating worker:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Employee ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create worker' });
    }
  }
});

// PUT /api/workers/:id - Update worker
router.put('/:id', async (req, res) => {
  try {
    const { name, employeeId } = req.body;

    if (!name || !employeeId) {
      return res.status(400).json({ error: 'Name and employee ID are required' });
    }

    await runQuery(`
      UPDATE workers
      SET name = ?, employeeId = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, employeeId, req.params.id]);

    const updatedWorker = await getQuery(`
      SELECT id, name, employeeId
      FROM workers
      WHERE id = ?
    `, [req.params.id]);

    if (!updatedWorker) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json(updatedWorker);
  } catch (error) {
    console.error('Error updating worker:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Employee ID already exists' });
    } else {
      res.status(500).json({ error: 'Failed to update worker' });
    }
  }
});

// DELETE /api/workers/:id - Delete worker
router.delete('/:id', async (req, res) => {
  try {
    // Check if worker has active assignments
    const activeAssignments = await getQuery(`
      SELECT COUNT(*) as count
      FROM assignments
      WHERE workerId = ? AND status = 'active'
    `, [req.params.id]);

    if (activeAssignments.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete worker with active assignments' 
      });
    }

    const result = await runQuery('DELETE FROM workers WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Worker not found' });
    }

    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    console.error('Error deleting worker:', error);
    res.status(500).json({ error: 'Failed to delete worker' });
  }
});

export default router;