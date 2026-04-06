import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const inputFile = process.argv[2] || join(__dirname, 'psikotest_data.sql');
const mysqlDump = fs.readFileSync(inputFile, 'utf8');

console.log('Converting MySQL to SQLite...');
console.log('Input:', inputFile);

let sqlite = mysqlDump;

// Remove comments
sqlite = sqlite
  .replace(/-- MySQL dump[\s\S]*?(?=\n)/gi, '')
  .replace(/-- PHP Version[^\n]*/gi, '')
  .replace(/-- Host:[^\n]*/gi, '')
  .replace(/-- Server version[^\n]*/gi, '')
  .replace(/-- Dump completed[^\n]*/gi, '')
  .replace(/\/\*![\s\S]*?\*\//g, '');

// Remove MySQL SET statements
sqlite = sqlite
  .replace(/SET NAMES[^;]*;/gi, '')
  .replace(/SET time_zone[^;]*;/gi, '')
  .replace(/SET FOREIGN_KEY_CHECKS[^;]*;/gi, '')
  .replace(/SET SQL_MODE[^;]*;/gi, '')
  .replace(/SET @[A-Za-z_]+ =[^;]*;/gi, '');

// Remove LOCK/UNLOCK
sqlite = sqlite
  .replace(/LOCK TABLES[^;]*;/gi, '')
  .replace(/UNLOCK TABLES[^;]*;/gi, '');

// Remove CREATE, ALTER, DROP statements
sqlite = sqlite
  .replace(/CREATE TABLE[\s\S]*?;/gi, '')
  .replace(/CREATE INDEX[\s\S]*?;/gi, '')
  .replace(/CREATE UNIQUE INDEX[\s\S]*?;/gi, '')
  .replace(/ALTER TABLE[\s\S]*?;/gi, '')
  .replace(/DROP TABLE[^;]*;/gi, '')
  .replace(/DROP INDEX[^;]*;/gi, '')
  .replace(/DROP VIEW[^;]*;/gi, '')
  .replace(/DROP DATABASE[^;]*;/gi, '');

// Remove MySQL table options
sqlite = sqlite
  .replace(/\) ENGINE=InnoDB[\s\S]*?;/gi, ');')
  .replace(/\) ENGINE=MyISAM[\s\S]*?;/gi, ');')
  .replace(/\)[^;]*ENGINE[^;]*;/gi, ');')
  .replace(/DEFAULT CHARSET=[^\s,)]*/gi, '')
  .replace(/COLLATE[= ]+[^\s,)]*/gi, '')
  .replace(/AUTO_INCREMENT[= ]*\d*/gi, '')
  .replace(/ROW_FORMAT[= ]*[^\s,)]*/gi, '');

// Quote reserved keywords in column names
const reservedKeywords = ['START', 'END', 'INDEX', 'KEY', 'ORDER', 'GROUP', 'BY', 'SELECT', 
  'WHERE', 'FROM', 'INTO', 'VALUES', 'UPDATE', 'DELETE', 'INSERT', 'TABLE', 'COLUMN',
  'DATABASE', 'SCHEMA', 'VIEW', 'TRIGGER', 'INDEXED', 'NOT', 'NULL', 'PRIMARY', 
  'FOREIGN', 'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT', 'CONSTRAINT', 'CASE'];
  
// Quote column names in INSERT statements
sqlite = sqlite.replace(/INSERT INTO (\w+)\s*\(([^)]+)\)/gi, (match, table, columns) => {
  const quotedColumns = columns.split(',').map(col => {
    col = col.trim().replace(/"/g, '');
    const lowerCol = col.toLowerCase();
    if (reservedKeywords.some(kw => kw.toLowerCase() === lowerCol)) {
      return `"${col}"`;
    }
    return col;
  }).join(', ');
  return `INSERT INTO "${table}" (${quotedColumns})`;
});

// Quote table names in INSERT statements
sqlite = sqlite.replace(/INSERT INTO\s+(\w+)\s*\(/gi, 'INSERT INTO "$1" (');

// Fix VALUES - ensure proper formatting
sqlite = sqlite.replace(/VALUES\s*\(/gi, 'VALUES (');
sqlite = sqlite.replace(/\)\s*,\s*\(/g, '),(');

// Convert data types
sqlite = sqlite
  .replace(/\bINT\b/gi, 'INTEGER')
  .replace(/\bTINYINT\b/gi, 'INTEGER')
  .replace(/\bSMALLINT\b/gi, 'INTEGER')
  .replace(/\bMEDIUMINT\b/gi, 'INTEGER')
  .replace(/\bBIGINT\b/gi, 'INTEGER')
  .replace(/\bVARCHAR\b/gi, 'TEXT')
  .replace(/\bCHAR\b/gi, 'TEXT')
  .replace(/\bLONGTEXT\b/gi, 'TEXT')
  .replace(/\bMEDIUMTEXT\b/gi, 'TEXT')
  .replace(/\bTEXT\b/gi, 'TEXT')
  .replace(/\bDATETIME\b/gi, 'TEXT')
  .replace(/\bTIMESTAMP\b/gi, 'TEXT')
  .replace(/\bDATE\b/gi, 'TEXT')
  .replace(/\bBOOLEAN\b/gi, 'INTEGER')
  .replace(/\bDECIMAL\b/gi, 'REAL')
  .replace(/\bFLOAT\b/gi, 'REAL')
  .replace(/\bDOUBLE\b/gi, 'REAL');

// Remove backticks and replace with double quotes
sqlite = sqlite.replace(/`/g, '"');

// Clean up
sqlite = sqlite
  .replace(/\n\s*\n\s*\n/g, '\n\n')
  .replace(/^\s+$/gm, '')
  .trim();

// Only keep INSERT statements
const lines = sqlite.split('\n');
const insertLines = lines.filter(line => {
  const trimmed = line.trim();
  return trimmed === '' || trimmed.startsWith('INSERT INTO') || trimmed.startsWith('VALUES');
});
sqlite = insertLines.join('\n');

// Write output
const outputFile = join(__dirname, 'psikotest_data_sqlite.sql');
fs.writeFileSync(outputFile, sqlite);

const insertCount = (sqlite.match(/INSERT INTO/gi) || []).length;
console.log('✅ Converted', insertCount, 'INSERT statements');
console.log('Output:', outputFile);
console.log('\nNow run:');
console.log('  wrangler d1 execute psikotest-db --file=./scripts/psikotest_data_sqlite.sql --remote');