#!/bin/bash

# Migration script for MySQL to D1

echo "MySQL to D1 Migration Guide"
echo "=========================="
echo ""
echo "1. Export your MySQL data from Hostinger:"
echo "   - Go to phpMyAdmin"
echo "   - Export your database as SQL"
echo ""
echo "2. Create D1 database:"
echo "   wrangler d1 create psikotest-db"
echo ""
echo "3. Update wrangler.toml with the database_id"
echo ""
echo "4. Apply the schema:"
echo "   wrangler d1 execute psikotest-db --file=./migrations/001_initial_schema.sql"
echo ""
echo "5. Convert and import your data:"
echo "   - MySQL syntax needs conversion to SQLite"
echo "   - Use the converter script: node scripts/convert-mysql-to-sqlite.js"
echo ""
echo "6. Deploy the Workers:"
echo "   wrangler deploy"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "ERROR: wrangler is not installed"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

echo "Prerequisites check complete!"
echo "Run the steps above to migrate your database."