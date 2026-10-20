---
name: create-issue
description: Creates GitHub issues following the project's issue templates. Use when asked to create, file, or open a GitHub issue.
---

# Create GitHub Issue

When creating GitHub issues for this project, follow the issue templates defined in `.github/ISSUE_TEMPLATE/`. The templates are the source of truth for fields, required/optional flags, labels, and title prefixes — always read the relevant template file rather than relying on remembered field names, since CLI-created issues bypass GitHub's template UI entirely.

## Workflow

1. Choose the template based on the issue type:
   - **Bug report** (`bug_report.yml`): something is broken or behaving incorrectly and can be reproduced
   - **Feature request** (`feature_request.yml`): a new capability or improvement for users of the library
   - **Maintenance** (`maintenance.yml`): tech debt, governance, tooling, automation, or anything internal-facing
2. Read the chosen template file from `.github/ISSUE_TEMPLATE/` to get the exact fields, title prefix, and labels
3. Draft the issue body covering every field in the template — include required fields always, and optional fields when you have something useful to say
4. Present the draft to the user for review
5. Only create the issue after the user approves

## Rules

- ALWAYS show the draft before creating
- If the template has a `checkboxes` field (e.g. the Acknowledgment section in feature_request.yml and maintenance.yml), reproduce its options verbatim as a section with checkbox syntax (`- [ ]`), checking the required ones — the issue implicitly asserts compliance, and the user's approval of the draft confirms it
- If the template has no `checkboxes` field (e.g. bug_report.yml), do NOT invent one
- If unsure which template to use, ask the user
