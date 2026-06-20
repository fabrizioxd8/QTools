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
      SELECT id, name, category, status, isCalibrable, calibrationDue, certificateNumber,
             quantity, damagedQuantity, lostQuantity, image, customAttributes,
             calibration_company, last_calibration_date, calibration_frequency_months
      FROM tools
      ORDER BY name
    `);

    // Parse customAttributes JSON and coerce types
    const parsedTools = tools.map(tool => ({
      ...tool,
      isCalibrable: Boolean(Number(tool.isCalibrable)),
      certificateNumber: tool.certificateNumber || null,
      quantity: tool.quantity !== undefined && tool.quantity !== null ? Number(tool.quantity) : undefined,
      damagedQuantity: tool.damagedQuantity !== undefined && tool.damagedQuantity !== null ? Number(tool.damagedQuantity) : 0,
      lostQuantity: tool.lostQuantity !== undefined && tool.lostQuantity !== null ? Number(tool.lostQuantity) : 0,
      calibration_company: tool.calibration_company || null,
      last_calibration_date: tool.last_calibration_date || null,
      calibration_frequency_months: tool.calibration_frequency_months !== undefined && tool.calibration_frequency_months !== null ? Number(tool.calibration_frequency_months) : 12,
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
      SELECT id, name, category, status, isCalibrable, calibrationDue, certificateNumber,
             quantity, damagedQuantity, lostQuantity, image, customAttributes,
             calibration_company, last_calibration_date, calibration_frequency_months
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
      damagedQuantity: tool.damagedQuantity !== undefined && tool.damagedQuantity !== null ? Number(tool.damagedQuantity) : 0,
      lostQuantity: tool.lostQuantity !== undefined && tool.lostQuantity !== null ? Number(tool.lostQuantity) : 0,
      calibration_company: tool.calibration_company || null,
      last_calibration_date: tool.last_calibration_date || null,
      calibration_frequency_months: tool.calibration_frequency_months !== undefined && tool.calibration_frequency_months !== null ? Number(tool.calibration_frequency_months) : 12,
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
  const { name, category, status = 'Available', isCalibrable, calibrationDue, certificateNumber, quantity, customAttributes, imageUrl,
          calibration_company, last_calibration_date, calibration_frequency_months } = req.body;
    // Handle both file uploads and URL inputs
    const image = req.file ? `/uploads/${req.file.filename}` : (imageUrl || null);
  // Coerce isCalibrable which may come as string from FormData
  const isCalibrableFlag = isCalibrable === true || isCalibrable === 'true' || isCalibrable === '1' || Number(isCalibrable) === 1;

  // Calculate calibration_due_date from last_calibration_date + calibration_frequency_months
  let computedCalibrationDue = calibrationDue || null;
  if (isCalibrableFlag && last_calibration_date && calibration_frequency_months) {
    const lastDate = new Date(last_calibration_date);
    if (!isNaN(lastDate.getTime())) {
      lastDate.setMonth(lastDate.getMonth() + Number(calibration_frequency_months));
      computedCalibrationDue = lastDate.toISOString().split('T')[0];
    }
  }

    const result = await runQuery(`
      INSERT INTO tools (name, category, status, isCalibrable, calibrationDue, certificateNumber, quantity, image, customAttributes,
                         calibration_company, last_calibration_date, calibration_frequency_months)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name,
      category,
      status,
      isCalibrableFlag ? 1 : 0,
      computedCalibrationDue,
      certificateNumber || null,
      typeof quantity !== 'undefined' ? Number(quantity) : 1,
      image,
      customAttributes || '{}',
      isCalibrableFlag ? (calibration_company || null) : null,
      isCalibrableFlag ? (last_calibration_date || null) : null,
      isCalibrableFlag ? (Number(calibration_frequency_months) || 12) : 12,
    ]);

    const newTool = await getQuery(`
      SELECT id, name, category, status, isCalibrable, calibrationDue, certificateNumber,
             quantity, damagedQuantity, lostQuantity, image, customAttributes,
             calibration_company, last_calibration_date, calibration_frequency_months
      FROM tools
      WHERE id = ?
    `, [result.id]);

    const parsedTool = {
      ...newTool,
      isCalibrable: Boolean(Number(newTool.isCalibrable)),
      certificateNumber: newTool.certificateNumber || null,
      quantity: newTool.quantity !== undefined && newTool.quantity !== null ? Number(newTool.quantity) : undefined,
      damagedQuantity: newTool.damagedQuantity !== undefined && newTool.damagedQuantity !== null ? Number(newTool.damagedQuantity) : 0,
      lostQuantity: newTool.lostQuantity !== undefined && newTool.lostQuantity !== null ? Number(newTool.lostQuantity) : 0,
      calibration_company: newTool.calibration_company || null,
      last_calibration_date: newTool.last_calibration_date || null,
      calibration_frequency_months: newTool.calibration_frequency_months !== undefined && newTool.calibration_frequency_months !== null ? Number(newTool.calibration_frequency_months) : 12,
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
  const { name, category, status, isCalibrable, calibrationDue, certificateNumber, quantity, customAttributes, imageUrl,
          calibration_company, last_calibration_date, calibration_frequency_months } = req.body;
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

    let isCalibrableFlagUpdate;
    if (isCalibrable !== undefined) {
      isCalibrableFlagUpdate = isCalibrable === true || isCalibrable === 'true' || isCalibrable === '1' || Number(isCalibrable) === 1;
      updateFields.push('isCalibrable = ?');
      updateValues.push(isCalibrableFlagUpdate ? 1 : 0);
    }

    // Determine final calibration_due from provided value or recalculate
    if (calibrationDue !== undefined || last_calibration_date !== undefined || calibration_frequency_months !== undefined) {
      // Fetch current tool data to fill in missing values for recalculation
      const currentTool = await getQuery(`SELECT isCalibrable, last_calibration_date, calibration_frequency_months, calibrationDue FROM tools WHERE id = ?`, [req.params.id]);
      const effectiveIsCalibrable = isCalibrableFlagUpdate !== undefined
        ? isCalibrableFlagUpdate
        : Boolean(Number(currentTool?.isCalibrable));
      const effectiveLastDate = last_calibration_date !== undefined ? last_calibration_date : currentTool?.last_calibration_date;
      const effectiveFrequency = calibration_frequency_months !== undefined ? Number(calibration_frequency_months) : (currentTool?.calibration_frequency_months || 12);

      // Recalculate calibrationDue when calibration fields change
      let newCalibrationDue = calibrationDue !== undefined ? (calibrationDue || null) : currentTool?.calibrationDue;
      if (effectiveIsCalibrable && effectiveLastDate && effectiveFrequency) {
        const lastDate = new Date(effectiveLastDate);
        if (!isNaN(lastDate.getTime())) {
          lastDate.setMonth(lastDate.getMonth() + effectiveFrequency);
          newCalibrationDue = lastDate.toISOString().split('T')[0];
        }
      }

      updateFields.push('calibrationDue = ?');
      updateValues.push(newCalibrationDue || null);
    } else if (calibrationDue !== undefined) {
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
    if (calibration_company !== undefined) {
      updateFields.push('calibration_company = ?');
      updateValues.push(calibration_company || null);
    }
    if (last_calibration_date !== undefined) {
      updateFields.push('last_calibration_date = ?');
      updateValues.push(last_calibration_date || null);
    }
    if (calibration_frequency_months !== undefined) {
      updateFields.push('calibration_frequency_months = ?');
      updateValues.push(Number(calibration_frequency_months) || 12);
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(req.params.id);

    await runQuery(`
      UPDATE tools
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    const updatedTool = await getQuery(`
      SELECT id, name, category, status, isCalibrable, calibrationDue, certificateNumber,
             quantity, damagedQuantity, lostQuantity, image, customAttributes,
             calibration_company, last_calibration_date, calibration_frequency_months
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
      damagedQuantity: updatedTool.damagedQuantity !== undefined && updatedTool.damagedQuantity !== null ? Number(updatedTool.damagedQuantity) : 0,
      lostQuantity: updatedTool.lostQuantity !== undefined && updatedTool.lostQuantity !== null ? Number(updatedTool.lostQuantity) : 0,
      calibration_company: updatedTool.calibration_company || null,
      last_calibration_date: updatedTool.last_calibration_date || null,
      calibration_frequency_months: updatedTool.calibration_frequency_months !== undefined && updatedTool.calibration_frequency_months !== null ? Number(updatedTool.calibration_frequency_months) : 12,
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