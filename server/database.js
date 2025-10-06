import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path - one level up from server directory
const dbPath = join(__dirname, '..', 'qtools.db');

// Create database connection
export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('📊 Connected to SQLite database:', dbPath);
  }
});

// Initialize database tables
export const initializeDatabase = () => {
  // Tools table
  db.run(`
    CREATE TABLE IF NOT EXISTS tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Available',
      isCalibrable BOOLEAN DEFAULT 0,
      calibrationDue TEXT,
      image TEXT,
      customAttributes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Workers table
  db.run(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      employeeId TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Projects table
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Assignments table
  db.run(`
    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      checkoutDate TEXT NOT NULL,
      workerId INTEGER NOT NULL,
      projectId INTEGER NOT NULL,
      checkinDate TEXT,
      status TEXT DEFAULT 'active',
      checkinNotes TEXT,
      toolConditions TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (workerId) REFERENCES workers (id),
      FOREIGN KEY (projectId) REFERENCES projects (id)
    )
  `);

  // Assignment tools junction table
  db.run(`
    CREATE TABLE IF NOT EXISTS assignment_tools (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignmentId INTEGER NOT NULL,
      toolId INTEGER NOT NULL,
      FOREIGN KEY (assignmentId) REFERENCES assignments (id) ON DELETE CASCADE,
      FOREIGN KEY (toolId) REFERENCES tools (id)
    )
  `);

  // Run migrations to ensure schema is up to date
  runMigrations();

  // Insert sample data if tables are empty
  insertSampleData();
};

// Migration function to handle schema updates
const runMigrations = () => {
  // Check if toolConditions column exists and add it if missing
  db.all("PRAGMA table_info(assignments)", (err, columns) => {
    if (err) {
      console.error('Error checking assignments table schema:', err);
      return;
    }

    const hasToolConditions = columns.some(col => col.name === 'toolConditions');
    
    if (!hasToolConditions) {
      console.log('🔄 Adding toolConditions column to assignments table...');
      db.run("ALTER TABLE assignments ADD COLUMN toolConditions TEXT", (err) => {
        if (err) {
          console.error('Error adding toolConditions column:', err);
        } else {
          console.log('✅ toolConditions column added successfully');
        }
      });
    }
  });
};

const insertSampleData = () => {
  // Check if tools table has data
  db.get("SELECT COUNT(*) as count FROM tools", (err, row) => {
    if (err) {
      console.error('Error checking tools table:', err);
      return;
    }

    if (row.count === 0) {
      console.log('📝 Inserting sample data...');
      
      // Sample tools
      const sampleTools = [
        {
          name: 'Digital Multimeter',
          category: 'Electrical',
          status: 'Available',
          isCalibrable: 1,
          calibrationDue: '2025-12-31',
          customAttributes: JSON.stringify({ brand: 'Fluke', model: '87V' })
        },
        {
          name: 'Torque Wrench',
          category: 'Mechanical',
          status: 'Available',
          isCalibrable: 1,
          calibrationDue: '2025-11-15',
          customAttributes: JSON.stringify({ range: '10-150 Nm' })
        },
        {
          name: 'Safety Harness',
          category: 'Safety',
          status: 'Available',
          isCalibrable: 0,
          customAttributes: JSON.stringify({ size: 'Large', certified: 'Yes' })
        },
        {
          name: 'Oscilloscope',
          category: 'Electrical',
          status: 'Available',
          isCalibrable: 1,
          calibrationDue: '2025-10-20',
          customAttributes: JSON.stringify({ bandwidth: '100MHz' })
        },
        {
          name: 'Impact Driver',
          category: 'Mechanical',
          status: 'Damaged',
          isCalibrable: 0,
          customAttributes: JSON.stringify({ voltage: '18V' })
        }
      ];

      sampleTools.forEach(tool => {
        db.run(`
          INSERT INTO tools (name, category, status, isCalibrable, calibrationDue, customAttributes)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [tool.name, tool.category, tool.status, tool.isCalibrable, tool.calibrationDue, tool.customAttributes]);
      });

      // Sample workers
      const sampleWorkers = [
        { name: 'John Smith', employeeId: 'EMP001' },
        { name: 'Sarah Johnson', employeeId: 'EMP002' },
        { name: 'Michael Brown', employeeId: 'EMP003' },
        { name: 'Emily Davis', employeeId: 'EMP004' }
      ];

      sampleWorkers.forEach(worker => {
        db.run(`
          INSERT INTO workers (name, employeeId)
          VALUES (?, ?)
        `, [worker.name, worker.employeeId]);
      });

      // Sample projects
      const sampleProjects = [
        { name: 'Building A Renovation' },
        { name: 'Lab Equipment Installation' },
        { name: 'Power Grid Maintenance' },
        { name: 'Safety Audit 2025' }
      ];

      sampleProjects.forEach(project => {
        db.run(`
          INSERT INTO projects (name)
          VALUES (?)
        `, [project.name]);
      });

      console.log('✅ Sample data inserted successfully');
    }
  });
};

// Helper function to run queries with promises
export const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

export const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

export const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};