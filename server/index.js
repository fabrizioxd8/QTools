import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let db;

(async () => {
    db = await open({
        filename: './qtools.db',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS tools (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT NOT NULL,
            status TEXT NOT NULL,
            isCalibrable BOOLEAN NOT NULL,
            calibrationDue TEXT,
            image TEXT,
            customAttributes TEXT
        );

        CREATE TABLE IF NOT EXISTS workers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            employeeId TEXT NOT NULL UNIQUE
        );

        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS assignments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            checkoutDate TEXT NOT NULL,
            workerId INTEGER,
            projectId INTEGER,
            checkinDate TEXT,
            status TEXT NOT NULL,
            checkinNotes TEXT,
            FOREIGN KEY (workerId) REFERENCES workers(id),
            FOREIGN KEY (projectId) REFERENCES projects(id)
        );

        CREATE TABLE IF NOT EXISTS assignment_tools (
            assignmentId INTEGER,
            toolId INTEGER,
            condition TEXT,
            FOREIGN KEY (assignmentId) REFERENCES assignments(id),
            FOREIGN KEY (toolId) REFERENCES tools(id),
            PRIMARY KEY (assignmentId, toolId)
        );
    `);

    console.log('Database initialized.');
})();

app.get('/', (req, res) => {
    res.send('QTools Local Backend Server is running!');
});

// --- API Endpoints ---

// Get all data
app.get('/api/data', async (req, res) => {
    try {
        const tools = await db.all('SELECT * FROM tools');
        const workers = await db.all('SELECT * FROM workers');
        const projects = await db.all('SELECT * FROM projects');
        const assignmentsData = await db.all('SELECT * FROM assignments');

        const assignments = await Promise.all(assignmentsData.map(async (a) => {
            const worker = await db.get('SELECT * FROM workers WHERE id = ?', a.workerId);
            const project = await db.get('SELECT * FROM projects WHERE id = ?', a.projectId);
            const assignmentTools = await db.all('SELECT * FROM assignment_tools WHERE assignmentId = ?', a.id);

            const toolsInAssignment = await Promise.all(assignmentTools.map(async (at) => {
                const tool = await db.get('SELECT * FROM tools WHERE id = ?', at.toolId);
                return { ...tool, condition: at.condition };
            }));

            return { ...a, worker, project, tools: toolsInAssignment };
        }));

        res.json({ tools, workers, projects, assignments });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Tools
app.post('/api/tools', async (req, res) => {
    const { name, category, status, isCalibrable, calibrationDue, image, customAttributes } = req.body;
    const sql = `INSERT INTO tools (name, category, status, isCalibrable, calibrationDue, image, customAttributes) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    try {
        const result = await db.run(sql, name, category, status, isCalibrable, calibrationDue, image, JSON.stringify(customAttributes));
        res.status(201).json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/tools/:id', async (req, res) => {
    const { id } = req.params;
    const { name, category, status, isCalibrable, calibrationDue, image, customAttributes } = req.body;
    const sql = `UPDATE tools SET name = ?, category = ?, status = ?, isCalibrable = ?, calibrationDue = ?, image = ?, customAttributes = ? WHERE id = ?`;
    try {
        await db.run(sql, name, category, status, isCalibrable, calibrationDue, image, JSON.stringify(customAttributes), id);
        res.json({ message: 'Tool updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/tools/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.run('DELETE FROM tools WHERE id = ?', id);
        res.json({ message: 'Tool deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Workers
app.post('/api/workers', async (req, res) => {
    const { name, employeeId } = req.body;
    try {
        const result = await db.run('INSERT INTO workers (name, employeeId) VALUES (?, ?)', name, employeeId);
        res.status(201).json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/workers/:id', async (req, res) => {
    const { id } = req.params;
    const { name, employeeId } = req.body;
    try {
        await db.run('UPDATE workers SET name = ?, employeeId = ? WHERE id = ?', name, employeeId, id);
        res.json({ message: 'Worker updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/workers/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.run('DELETE FROM workers WHERE id = ?', id);
        res.json({ message: 'Worker deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Projects
app.post('/api/projects', async (req, res) => {
    const { name } = req.body;
    try {
        const result = await db.run('INSERT INTO projects (name) VALUES (?)', name);
        res.status(201).json({ id: result.lastID });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        await db.run('UPDATE projects SET name = ? WHERE id = ?', name, id);
        res.json({ message: 'Project updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/projects/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.run('DELETE FROM projects WHERE id = ?', id);
        res.json({ message: 'Project deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Assignments
app.post('/api/assignments', async (req, res) => {
    const { checkoutDate, workerId, projectId, tools } = req.body;
    try {
        const result = await db.run('INSERT INTO assignments (checkoutDate, workerId, projectId, status) VALUES (?, ?, ?, ?)', checkoutDate, workerId, projectId, 'active');
        const assignmentId = result.lastID;

        for (const tool of tools) {
            await db.run('INSERT INTO assignment_tools (assignmentId, toolId) VALUES (?, ?)', assignmentId, tool.id);
            await db.run('UPDATE tools SET status = ? WHERE id = ?', 'In Use', tool.id);
        }

        res.status(201).json({ id: assignmentId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/assignments/:id/checkin', async (req, res) => {
    const { id } = req.params;
    const { checkinNotes, toolConditions } = req.body;
    try {
        await db.run('UPDATE assignments SET status = ?, checkinDate = ?, checkinNotes = ? WHERE id = ?', 'completed', new Date().toISOString(), checkinNotes, id);

        for (const toolId in toolConditions) {
            const condition = toolConditions[toolId];
            await db.run('UPDATE assignment_tools SET condition = ? WHERE assignmentId = ? AND toolId = ?', condition, id, toolId);

            let newStatus = 'Available';
            if (condition === 'damaged') newStatus = 'Damaged';
            if (condition === 'lost') newStatus = 'Lost';

            await db.run('UPDATE tools SET status = ? WHERE id = ?', newStatus, toolId);
        }

        res.json({ message: 'Assignment checked in' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});