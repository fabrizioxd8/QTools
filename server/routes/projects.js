import express from 'express';
import { runQuery, getQuery, allQuery } from '../database.js';

const router = express.Router();

// GET /api/projects - Get all projects
router.get('/', async (req, res) => {
  try {
    const projects = await allQuery(`
      SELECT id, name
      FROM projects
      ORDER BY name
    `);

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id - Get single project
router.get('/:id', async (req, res) => {
  try {
    const project = await getQuery(`
      SELECT id, name
      FROM projects
      WHERE id = ?
    `, [req.params.id]);

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects - Create new project
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const result = await runQuery(`
      INSERT INTO projects (name)
      VALUES (?)
    `, [name]);

    const newProject = await getQuery(`
      SELECT id, name
      FROM projects
      WHERE id = ?
    `, [result.id]);

    res.status(201).json(newProject);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    await runQuery(`
      UPDATE projects
      SET name = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [name, req.params.id]);

    const updatedProject = await getQuery(`
      SELECT id, name
      FROM projects
      WHERE id = ?
    `, [req.params.id]);

    if (!updatedProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(updatedProject);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id - Delete project
router.delete('/:id', async (req, res) => {
  try {
    // Check if project has active assignments
    const activeAssignments = await getQuery(`
      SELECT COUNT(*) as count
      FROM assignments
      WHERE projectId = ? AND status = 'active'
    `, [req.params.id]);

    if (activeAssignments.count > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete project with active assignments' 
      });
    }

    const result = await runQuery('DELETE FROM projects WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

export default router;