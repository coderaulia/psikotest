param()

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$deployDir = Join-Path $root 'deploy'
$installDir = Join-Path $deployDir 'install'
$upgradeDir = Join-Path $deployDir 'upgrade'
$sourceDir = Join-Path $deployDir 'source'
$zipPath = Join-Path $deployDir 'api2-codeyourcareer-database.zip'
$migrationsDir = Join-Path $root 'apps/api/src/database/migrations'
$seedsDir = Join-Path $root 'apps/api/src/database/seeds'

$seedSourceFiles = @(
  '001_seed_test_types.sql',
  '002_seed_disc_questions.sql',
  '003_seed_iq_questions.sql',
  '004_seed_workload_questions.sql',
  '005_seed_demo_sessions.sql',
  '008_seed_custom_research_questions.sql',
  '009_seed_custom_demo_session.sql',
  '010_seed_dummy_customer_accounts.sql'
)

$legacyRootFiles = @(
  '001_init_schema.sql',
  '006_submission_compliance_fields.sql',
  '007_operational_settings_and_audit.sql',
  '010_customer_accounts_and_assessments.sql',
  '011_result_review_workflow.sql'
)

New-Item -ItemType Directory -Force -Path $deployDir, $installDir, $upgradeDir, $sourceDir | Out-Null

foreach ($fileName in $legacyRootFiles) {
  $rootFile = Join-Path $deployDir $fileName
  if (Test-Path $rootFile) {
    Remove-Item $rootFile -Force
  }
}

foreach ($fileName in $seedSourceFiles) {
  $rootFile = Join-Path $deployDir $fileName
  $sourceFile = Join-Path $sourceDir $fileName
  $seedFile = Join-Path $seedsDir $fileName

  if ((Test-Path $rootFile) -and -not (Test-Path $sourceFile)) {
    Move-Item $rootFile $sourceFile
  }

  if (-not (Test-Path $sourceFile) -and (Test-Path $seedFile)) {
    Copy-Item $seedFile $sourceFile
  }
}

Copy-Item (Join-Path $migrationsDir '001_init_schema.sql') (Join-Path $installDir '01_schema_current.sql') -Force
Copy-Item (Join-Path $sourceDir '001_seed_test_types.sql') (Join-Path $installDir '02_seed_test_catalog.sql') -Force

$questionSeedFiles = @(
  '002_seed_disc_questions.sql',
  '003_seed_iq_questions.sql',
  '004_seed_workload_questions.sql',
  '008_seed_custom_research_questions.sql'
) | ForEach-Object { Join-Path $sourceDir $_ }

$demoSeedFiles = @(
  '005_seed_demo_sessions.sql',
  '009_seed_custom_demo_session.sql',
  '010_seed_dummy_customer_accounts.sql'
) | ForEach-Object { Join-Path $sourceDir $_ }

$questionBundle = @()
foreach ($file in $questionSeedFiles) {
  $questionBundle += "-- Source: $(Split-Path $file -Leaf)"
  $questionBundle += Get-Content $file
  $questionBundle += ""
}
Set-Content (Join-Path $installDir '03_seed_assessment_questions.sql') ($questionBundle -join [Environment]::NewLine)

$demoBundle = @()
foreach ($file in $demoSeedFiles) {
  $demoBundle += "-- Source: $(Split-Path $file -Leaf)"
  $demoBundle += Get-Content $file
  $demoBundle += ""
}
Set-Content (Join-Path $installDir '04_seed_demo_sessions.sql') ($demoBundle -join [Environment]::NewLine)

$installReadme = @"
# Database Install Bundle

Use this folder for a fresh database setup.

Run the files in this order:

1. `01_schema_current.sql`
2. `02_seed_test_catalog.sql`
3. `03_seed_assessment_questions.sql`
4. `04_seed_demo_sessions.sql` (optional demo data, including demo customer accounts)

Notes:

- `01_schema_current.sql` already includes the current schema, including workspace settings, reviewer workflow support, report access logging, answer sequence tracking for protected sessions, and the billing foundation tables for checkout, invoices, webhooks, and usage snapshots.
- Distribution policy and protected delivery are stored in both session settings JSON and the current schema for easier legacy compatibility.
- `04_seed_demo_sessions.sql` is optional. Skip it in production if you do not want demo sessions, demo tokens, and demo customer accounts.
"@
Set-Content (Join-Path $installDir 'README.md') $installReadme

$upgradeFiles = @(
  '002_submission_compliance_fields.sql',
  '003_operational_settings_and_audit.sql',
  '004_customer_accounts_and_assessments.sql',
  '005_result_review_workflow.sql',
  '006_session_security.sql',
  '007_customer_workspace_settings.sql',
  '008_distribution_and_security.sql',
  '009_submission_progressive_security.sql',
  '010_customer_assessment_participants.sql',
  '011_customer_workspace_members.sql',
  '012_workspace_subscriptions.sql',
  '013_customer_assessment_participant_reminders.sql',
  '014_customer_workspace_member_activation.sql',
  '015_billing_foundation.sql'
) | ForEach-Object { Join-Path $migrationsDir $_ }

$upgradeBundle = @()
foreach ($file in $upgradeFiles) {
  $upgradeBundle += "-- Source: $(Split-Path $file -Leaf)"
  $upgradeBundle += Get-Content $file
  $upgradeBundle += ""
}
Set-Content (Join-Path $upgradeDir '01_upgrade_legacy_to_current.sql') ($upgradeBundle -join [Environment]::NewLine)

$upgradeReadme = @"
# Database Upgrade Bundle

Use this folder only if you already have an older Psikotest database and need to bring it up to the current schema.

Recommended order:

1. `01_upgrade_legacy_to_current.sql`

This bundled upgrade adds:

- submission consent and identity snapshot fields
- app settings and audit log tables
- customer account, customer workspace settings, and customer assessment tables for old installs
- reviewer role support on the `admins` table
- distribution policy and protected delivery compatibility fields
- submission answer sequence tracking for replay protection in protected sessions
- customer assessment participant invite records for SaaS onboarding and sharing workflows
- workspace team member records for multi-user customer operations
- teammate activation credentials and invite links for shared customer workspace access
- workspace subscription and plan limit records for SaaS billing workflows
- provider-ready billing checkout, invoice, webhook, and usage tracking tables
"@
Set-Content (Join-Path $upgradeDir 'README.md') $upgradeReadme

if (Test-Path $zipPath) {
  Remove-Item $zipPath -Force
}

$zipPaths = @(
  (Join-Path $installDir '*'),
  (Join-Path $upgradeDir '*')
)
Compress-Archive -Path $zipPaths -DestinationPath $zipPath -Force

Write-Host "Generated $zipPath"




