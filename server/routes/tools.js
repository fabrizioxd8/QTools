import express from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { runQuery, getQuery, allQuery } from '../database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'tool-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
  }
});

const upload = multer({ storage });

// GET /api/tools - Get all tools
router.get('/', async (req, res) => {
  try {
    const tools = await allQuery(`
      SELECT id, name, category, status, isCalibrable, calibrationDue, certificateNumber, quantity, image, customAttributes
      FROM tools
      ORDER BY name
    `);

    // Parse customAttributes JSON and coerce types
    const parsedTools = tools.map(tool => ({
      ...tool,
      isCalibrable: Boolean(Number(tool.isCalibrable)),
      certificateNumber: tool.certificateNumber || null,
      quantity: tool.quantity !== undefined && tool.quantity !== null ? Number(tool.quantity) : undefined,
      customAttributes: tool.customAttributes ? JSON.parse(tool.customAttributes) : {}
    }));

    res.json(parsedTools);
  } catch (error) {
    console.error('Error fetching tools:', error);
    res.status(500).json({ error: 'Failed to fetch tools' });
  }
});

// GET /api/tools/:id - Get single tool
router.get('/:id', async (req, res) => {
  try {
    const tool = await getQuery(`
      SELECT id, name, category, status, isCalibrable, calibrationDue, certificateNumber, quantity, image, customAttributes
      FROM tools
      WHERE id = ?
    `, [req.params.id]);

    if (!tool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    const parsedTool = {
      ...tool,
      isCalibrable: Boolean(Number(tool.isCalibrable)),
      certificateNumber: tool.certificateNumber || null,
      quantity: tool.quantity !== undefined && tool.quantity !== null ? Number(tool.quantity) : undefined,
      customAttributes: tool.customAttributes ? JSON.parse(tool.customAttributes) : {}
    };

    res.json(parsedTool);
  } catch (error) {
    console.error('Error fetching tool:', error);
    res.status(500).json({ error: 'Failed to fetch tool' });
  }
});

// POST /api/tools - Create new tool
router.post('/', upload.single('image'), async (req, res) => {
  try {
  const { name, category, status = 'Available', isCalibrable, calibrationDue, certificateNumber, quantity, customAttributes, imageUrl } = req.body;
    // Handle both file uploads and URL inputs
    const image = req.file ? `/uploads/${req.file.filename}` : (imageUrl || null);
  // Coerce isCalibrable which may come as string from FormData
  const isCalibrableFlag = isCalibrable === true || isCalibrable === 'true' || isCalibrable === '1' || Number(isCalibrable) === 1;

    const result = await runQuery(`
      INSERT INTO tools (name, category, status, isCalibrable, calibrationDue, certificateNumber, quantity, image, customAttributes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      category,
      status,
      isCalibrableFlag ? 1 : 0,
      calibrationDue || null,
      certificateNumber || null,
      typeof quantity !== 'undefined' ? Number(quantity) : 1,
      image,
      customAttributes || '{}'
    ]);

    const newTool = await getQuery(`
      SELECT id, name, category, status, isCalibrable, calibrationDue, certificateNumber, quantity, image, customAttributes
      FROM tools
      WHERE id = ?
    `, [result.id]);

    const parsedTool = {
      ...newTool,
      isCalibrable: Boolean(Number(newTool.isCalibrable)),
      certificateNumber: newTool.certificateNumber || null,
      quantity: newTool.quantity !== undefined && newTool.quantity !== null ? Number(newTool.quantity) : undefined,
      customAttributes: newTool.customAttributes ? JSON.parse(newTool.customAttributes) : {}
    };

    res.status(201).json(parsedTool);
  } catch (error) {
    console.error('Error creating tool:', error);
    res.status(500).json({ error: 'Failed to create tool' });
  }
});

// PUT /api/tools/:id - Update tool
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
  const { name, category, status, isCalibrable, calibrationDue, certificateNumber, quantity, customAttributes, imageUrl } = req.body;
    // Handle both file uploads and URL inputs
    const image = req.file ? `/uploads/${req.file.filename}` : (imageUrl !== undefined ? imageUrl : undefined);

    // Build update query dynamically
    let updateFields = [];
    let updateValues = [];

    if (name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(name);
    }
    if (category !== undefined) {
      updateFields.push('category = ?');
      updateValues.push(category);
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }
    if (isCalibrable !== undefined) {
      const isCalibrableFlagUpdate = isCalibrable === true || isCalibrable === 'true' || isCalibrable === '1' || Number(isCalibrable) === 1;
      updateFields.push('isCalibrable = ?');
      updateValues.push(isCalibrableFlagUpdate ? 1 : 0);
    }
    if (calibrationDue !== undefined) {
      updateFields.push('calibrationDue = ?');
      updateValues.push(calibrationDue || null);
    }
    if (certificateNumber !== undefined) {
      updateFields.push('certificateNumber = ?');
      updateValues.push(certificateNumber || null);
    }
    if (quantity !== undefined) {
      updateFields.push('quantity = ?');
      updateValues.push(Number(quantity));
    }
    if (image !== undefined) {
      updateFields.push('image = ?');
      updateValues.push(image);
    }
    if (customAttributes !== undefined) {
      updateFields.push('customAttributes = ?');
      updateValues.push(customAttributes || '{}');
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(req.params.id);

    await runQuery(`
      UPDATE tools
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    const updatedTool = await getQuery(`
      SELECT id, name, category, status, isCalibrable, calibrationDue, certificateNumber, quantity, image, customAttributes
      FROM tools
      WHERE id = ?
    `, [req.params.id]);

    if (!updatedTool) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    const parsedTool = {
      ...updatedTool,
      isCalibrable: Boolean(Number(updatedTool.isCalibrable)),
      certificateNumber: updatedTool.certificateNumber || null,
      quantity: updatedTool.quantity !== undefined && updatedTool.quantity !== null ? Number(updatedTool.quantity) : undefined,
      customAttributes: updatedTool.customAttributes ? JSON.parse(updatedTool.customAttributes) : {}
    };

    res.json(parsedTool);
  } catch (error) {
    console.error('Error updating tool:', error);
    res.status(500).json({ error: 'Failed to update tool' });
  }
});

// DELETE /api/tools/:id - Delete tool
router.delete('/:id', async (req, res) => {
  try {
    const result = await runQuery('DELETE FROM tools WHERE id = ?', [req.params.id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tool not found' });
    }

    res.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    console.error('Error deleting tool:', error);
    res.status(500).json({ error: 'Failed to delete tool' });
  }
});

export default router;