// Database migration script to create and populate qtools.db
import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path - one level up from server directory
const dbPath = join(__dirname, '..', 'qtools.db');

console.log('🗄️  Creating QTools database...');
console.log('📍 Database location:', dbPath);

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error creating database:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to SQLite database');
  }
});

// Create tables and insert sample data
db.serialize(() => {
  console.log('📋 Creating tables...');
  
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

  console.log('📝 Inserting sample data...');

  // Sample tools
  const sampleTools = [
    {
      name: 'Digital Multimeter',
      category: 'Electrical',
      status: 'Available',
      isCalibrable: 1,
      calibrationDue: '2025-12-31',
      customAttributes: JSON.stringify({ brand: 'Fluke', model: '87V', voltage: '1000V' })
    },
    {
      name: 'Torque Wrench',
      category: 'Mechanical',
      status: 'Available',
      isCalibrable: 1,
      calibrationDue: '2025-11-15',
      customAttributes: JSON.stringify({ range: '10-150 Nm', accuracy: '±3%' })
    },
    {
      name: 'Safety Harness',
      category: 'Safety',
      status: 'Available',
      isCalibrable: 0,
      customAttributes: JSON.stringify({ size: 'Large', certified: 'ANSI Z359.11', weight_limit: '310 lbs' })
    },
    {
      name: 'Oscilloscope',
      category: 'Electrical',
      status: 'Available',
      isCalibrable: 1,
      calibrationDue: '2025-10-20',
      customAttributes: JSON.stringify({ bandwidth: '100MHz', channels: '4', sample_rate: '1 GSa/s' })
    },
    {
      name: 'Impact Driver',
      category: 'Mechanical',
      status: 'Damaged',
      isCalibrable: 0,
      customAttributes: JSON.stringify({ voltage: '18V', torque: '1800 in-lbs', battery: 'Li-ion' })
    },
    {
      name: 'Laser Level',
      category: 'Measurement',
      status: 'Available',
      isCalibrable: 1,
      calibrationDue: '2025-09-30',
      customAttributes: JSON.stringify({ range: '100ft', accuracy: '±1/8 inch', type: 'Cross-line' })
    },
    {
      name: 'Angle Grinder',
      category: 'Power Tools',
      status: 'Available',
      isCalibrable: 0,
      customAttributes: JSON.stringify({ disc_size: '4.5 inch', power: '750W', rpm: '11000' })
    },
    {
      name: 'Insulation Tester',
      category: 'Electrical',
      status: 'Cal. Due',
      isCalibrable: 1,
      calibrationDue: '2024-12-01',
      customAttributes: JSON.stringify({ voltage: '1000V', resistance: '2000 MΩ', brand: 'Megger' })
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
    { name: 'Emily Davis', employeeId: 'EMP004' },
    { name: 'Robert Wilson', employeeId: 'EMP005' },
    { name: 'Lisa Anderson', employeeId: 'EMP006' }
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
    { name: 'Safety Audit 2025' },
    { name: 'HVAC System Upgrade' },
    { name: 'Emergency Generator Testing' }
  ];

  sampleProjects.forEach(project => {
    db.run(`
      INSERT INTO projects (name)
      VALUES (?)
    `, [project.name]);
  });

  // Sample assignment (Safety Harness checked out to John Smith for Building A Renovation)
  db.run(`
    INSERT INTO assignments (checkoutDate, workerId, projectId, status)
    VALUES (?, 1, 1, 'active')
  `, [new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()], function(err) {
    if (!err) {
      // Link the safety harness (id: 3) to this assignment
      db.run(`
        INSERT INTO assignment_tools (assignmentId, toolId)
        VALUES (?, 3)
      `, [this.lastID]);
      
      // Update safety harness status to "In Use"
      db.run(`
        UPDATE tools SET status = 'In Use' WHERE id = 3
      `);
    }
  });

  console.log('✅ Sample data inserted successfully');
});

// Close database connection
db.close((err) => {
  if (err) {
    console.error('❌ Error closing database:', err.message);
  } else {
    console.log('🎉 Database created successfully!');
    console.log('📁 Location: qtools.db');
    console.log('📊 Ready for production use');
  }
});