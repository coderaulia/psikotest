1. Improving the App Workflow (Psychological Assessment Standard)

Your current flow:

company → pay → create test → share link → results → send report

Technically correct, but psychological assessment has additional required stages that your system should reflect.

A proper psychological assessment workflow usually includes:

Purpose clarification
↓
Assessment design
↓
Participant consent
↓
Test administration
↓
Scoring
↓
Interpretation
↓
Professional report
↓
Feedback / recommendation

This structure is important because psychological testing is not just scoring questions — it is an assessment process.

Recommended App Workflow

1. Assessment Setup (Purpose)

Before creating a test, require users to define the purpose.

Example:

Assessment Purpose

Recruitment
Employee development
Academic evaluation
Research
Self assessment

Why this matters:

Interpretation depends on context.

Example:

IQ for recruitment ≠ IQ for academic research

2. Test Configuration

Allow user to select:

Test type
Participant limit
Time limit
Administration mode

Administration mode is important:

Supervised
Remote unsupervised

Because remote testing may affect validity.

3. Informed Consent Page (Required)

Before participants start the test, show:

Purpose of the test
Estimated duration
Data privacy statement
Voluntary participation
Contact person

Participants must click:

I agree to participate in this psychological assessment

Why this is critical:

HIMPSI requires informed consent in psychological services and research contexts.

4. Participant Identity Validation

Add participant information:

Name
Age
Education
Position applied
Email

This is important because psychological interpretation often considers demographic context.

5. Test Administration

Participant takes the test.

Important UX rules:

clean interface
timer if needed
no distractions
prevent skipping rules if required

6. Automated Scoring (System)

Your system calculates raw scores.

But do not show interpretation directly yet.

Instead:

Raw Score → Norm Conversion → Psychological Interpretation

Example:

Raw score: 27
Percentile: 68
Category: Above average 7. Psychologist Review (Important)

If used for professional HR decisions, results ideally go through:

Psychologist review

Workflow:

Participant completes test
↓
System generates preliminary score
↓
Psychologist review
↓
Final report generated

This protects ethical standards.

8. Professional Psychological Report

The report should include:

participant identity

test used

date of administration

score

interpretation

limitations

recommendation

Example structure:

Assessment Report

Test Used
DISC Personality Assessment

Participant
Budi Santoso

Results
Dominance (High)

Interpretation
Shows strong leadership tendencies and decisive decision making.

Recommendation
Suitable for roles requiring initiative and leadership. 9. Result Distribution

Your current idea is good.

Options:

Send to HR only
Send summary to participant
Send full report

Important rule:

Do not automatically send full psychological interpretation without consent.
