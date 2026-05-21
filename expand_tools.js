import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'qtools.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
});

db.serialize(() => {
  // First, find tools that have quantity > 1
  db.all("SELECT * FROM tools WHERE quantity > 1", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log(`Found ${rows.length} tools to expand.`);

    rows.forEach(tool => {
      console.log(`Expanding tool ${tool.id} (${tool.name}) with quantity ${tool.quantity}`);

      const qty = tool.quantity;
      // Keep the original tool but set its quantity to 1
      db.run("UPDATE tools SET quantity = 1 WHERE id = ?", [tool.id]);

      // Insert qty - 1 new records
      const stmt = db.prepare(`
        INSERT INTO tools (name, category, status, isCalibrable, calibrationDue, certificateNumber, quantity, image, customAttributes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (let i = 1; i < qty; i++) {
        stmt.run([
          tool.name,
          tool.category,
          tool.status,
          tool.isCalibrable,
          tool.calibrationDue,
          tool.certificateNumber,
          1,
          tool.image,
          tool.customAttributes
        ]);
      }
      stmt.finalize();
    });

    console.log("Migration complete.");
  });
});
