const fs = require('fs');

// Read the MySQL dump
const mysqlDump = fs.readFileSync(process.argv[2] || 'psikotest_data.sql', 'utf8');

// Convert to SQLite-compatible syntax
let sqlite = mysqlDump
  // Remove MySQL-specific syntax
  .replace(/ENGINE=InnoDB[^;]*;/g, ';')
  .replace(/DEFAULT CHARSET=utf8mb4[^;]*;/g, ';')
  .replace(/COLLATE=utf8mb4[^;]*;/g, ';')
  .replace(/AUTO_INCREMENT=\d+/g, '')
  .replace(/AUTO_INCREMENT/g, 'AUTOINCREMENT')
  
  // Convert backticks to nothing or double quotes
  .replace(/`/g, '"')
  
  // Convert INT to INTEGER
  .replace(/\bINT\b/gi, 'INTEGER')
  .replace(/\bTINYINT\([0-9]+\)/gi, 'INTEGER')
  .replace(/\bSMALLINT\([0-9]+\)/gi, 'INTEGER')
  .replace(/\bMEDIUMINT\([0-9]+\)/gi, 'INTEGER')
  .replace(/\bBIGINT\([0-9]+\)/gi, 'INTEGER')
  
  // Convert VARCHAR to TEXT
  .replace(/\bVARCHAR\([0-9]+\)/gi, 'TEXT')
  .replace(/\bCHAR\([0-9]+\)/gi, 'TEXT')
  
  // Convert DATETIME
  .replace(/\bDATETIME\b/gi, 'TEXT')
  
  // Convert BOOLEAN
  .replace(/\bTINYINT\(1\)/gi, 'INTEGER')
  
  // Remove CREATE TABLE IF NOT EXISTS (we have our schema)
  .replace(/CREATE TABLE IF NOT EXISTS[^;]*;/gi, '')
  
  // Fix INSERT statements - ensure proper format
  .replace(/INSERT INTO "([^"]+)"\s+/gi, 'INSERT INTO $1 ')
  .replace(/INSERT INTO\s+"([^"]+)"/g, 'INSERT INTO $1');

// Clean up multiple newlines
sqlite = sqlite.replace(/\n\s*\n/g, '\n\n');

// Write output
fs.writeFileSync('psikotest_data_sqlite.sql', sqlite);

console.log('✅ Conversion complete!');
console.log('Output: psikotest_data_sqlite.sql');
console.log('\nNext step:');
console.log('  wrangler d1 execute psikotest-db --file=./psikotest_data_sqlite.sql --remote');