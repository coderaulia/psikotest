# Database Migration Guide: Hostinger MySQL to Cloudflare D1

## Step 1: Export Data from Hostinger

### Option A: phpMyAdmin (Recommended)
1. Log in to Hostinger hPanel
2. Go to **Databases** → **phpMyAdmin**
3. Select your database
4. Click **Export** tab
5. Click **Quick** → **SQL** format
6. Click **Go** to download
7. Save as `psikotest_data.sql`

### Option B: Command Line (if SSH available)
```bash
mysqldump -u username -p database_name > psikotest_data.sql
```

## Step 2: Convert MySQL to SQLite

### Install Node.js (if not installed)
Download from: https://nodejs.org

### Run the conversion script
```bash
cd workers/scripts
node convert-mysql-to-sqlite.js psikotest_data.sql
```

This creates `psikotest_data_sqlite.sql`

## Step 3: Import to D1

```bash
# First, make sure your schema is applied
wrangler d1 execute psikotest-db --file=./migrations/001_initial_schema.sql --remote

# Then import your data
wrangler d1 execute psikotest-db --file=./psikotest_data_sqlite.sql --remote
```

## Step 4: Verify Migration

```bash
# Check admin table
wrangler d1 execute psikotest-db --command="SELECT * FROM admins" --remote

# Check participant count
wrangler d1 execute psikotest-db --command="SELECT COUNT(*) FROM participants" --remote

# Check sessions
wrangler d1 execute psikotest-db --command="SELECT COUNT(*) FROM test_sessions" --remote
```

---

## Manual Conversion (if script doesn't work)

### MySQL → SQLite Syntax Changes

| MySQL | SQLite |
|-------|--------|
| `INT(11)` | `INTEGER` |
| `VARCHAR(255)` | `TEXT` |
| `DATETIME` | `TEXT` |
| `BOOLEAN` | `INTEGER` (0/1) |
| `AUTO_INCREMENT` | `AUTOINCREMENT` |
| `ENGINE=InnoDB` | (remove) |
| `DEFAULT CHARSET=utf8` | (remove) |

### Manually Convert:

1. Open `psikotest_data.sql` in a text editor
2. Remove these lines:
   - `SET NAMES utf8mb4`
   - `SET time_zone`
   - `CREATE TABLE IF NOT EXISTS...` (we have our schema)
   - `ENGINE=InnoDB`
   - `DEFAULT CHARSET=...`
   - `COLLATE=...`

3. Replace:
   - `` ` `` (backtick) → `` " `` (double quote) or nothing
   - `INSERT INTO "table_name"` → `INSERT INTO table_name`

4. Save as `psikotest_data_sqlite.sql`

5. Import:
   ```bash
   wrangler d1 execute psikotest-db --file=./psikotest_data_sqlite.sql --remote
   ```

---

## Common Issues

### "Table already exists"
- We already have the schema, remove CREATE TABLE statements
- Only keep INSERT statements

### "Syntax error near "
- Remove all backticks
- Check for MySQL-specific syntax

### "Too many SQL variables"
- Split large INSERT statements into smaller batches
- Or use `--local` flag and then push

### Data too large
- D1 has limits (500MB total)
- Split into multiple files
- Import one table at a time

---

## Migration Checklist

- [ ] Export MySQL data from Hostinger
- [ ] Convert to SQLite format
- [ ] Apply D1 schema (001_initial_schema.sql)
- [ ] Import converted data
- [ ] Verify admin login works
- [ ] Verify participant data
- [ ] Verify test sessions
- [ ] Test API endpoints