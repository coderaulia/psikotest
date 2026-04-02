# Psikotest Platform: User Manual

Welcome to the Psikotest Platform! This guide explains how to use the administrative and psychological review tools.

## 1. Navigating the Workspace

The workspace dashboard is your central hub for reviewing active assessment sessions and overall assessment trends.

- **Customers/HR Users**: You can view the status of participants you invited, but you **cannot** see the psychological interpretation notes until the report is fully "Released" by a reviewer.
- **Super Admins**: You have access to the complete platform, including customer account toggles, system audit logs, and reviewer assignment flows.

## 2. Setting Up an Assessment

Before inviting participants, ensure you configure the **visibility policies**:

- **HR Only**: Final reports are delivered strictly to HR, hiding summary from participants.
- **Participant Summary**: Participants see a short overview of their traits, HR gets the detailed report.
- **Full Report**: The entire interpretation profile is shared with both parties (common for internal employee development).

**Protected Delivery Mode**: Enabling this ensures psychological tests are loaded incrementally (one page at a time) to prevent participants from copying the entire item bank.

## 3. The Psychological Review Workflow

This flow applies to assessments lacking automatic interpretations or heavily relying on contextual evaluation (e.g. customized multi-scale behavioral interviews).

### Reviewer Roles

1. **New Result Submission**: When a participant completes an assessment, it enters the `scored_preliminary` status.
2. **Reviewer Assignment**: A Super Admin (or the system) can assign the result to a **Psychologist Reviewer**.
3. **In Review**: The reviewer investigates the item scores, adds "Internal Reviewer Notes," and writes the "Professional Interpretation". They should temporarily save it using the `Save review draft` button.
4. **Reviewed**: Once interpretation is complete, the reviewer marks it as `Reviewed`.
5. **Released**: A reviewer or admin approves the report. Once "Released", the "Export PDF" button becomes active, and the final interpretation is visible to the customer.

> **Note**: Customers and HR Users are intentionally blocked from seeing internal reviewer drafts, meaning any notes you write in the "Reviewer notes" text area are completely private to the internal team.

## 4. Exporting Data

### Exporting Reports (PDF)
You can directly print or save psychometric reports as PDF files once they hit the **Released** state.
1. Within an open result, click **Export PDF**.
2. A new printer-friendly tab will open.
3. Click **Print or Save PDF**.

### Exporting Datasets (CSV)
For statistical or research scenarios:
1. Go to the **Results** or **Customers** page.
2. Filter the table to your required scope.
3. Click the **Export CSV** button on the top right above the data table.

## 5. Security & Account Compliance

- **Revoking Access**: Super Admins can instantly deactivate a customer workspace via the **Customer accounts** page. Toggle the status to `Inactive` to block login and session interactions.
- All interactions, including answer adjustments and submission timestamps, are securely tracked using monotonic answer sequencing to prevent replay attacks and duplicate submissions.
