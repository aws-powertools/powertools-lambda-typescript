---
name: create-pr
description: Creates GitHub pull requests following the project's PR template. Use when asked to create, open, or submit a pull request.
---

# Create Pull Request

When creating pull requests for this project, you MUST follow the PR template defined in `.github/PULL_REQUEST_TEMPLATE.md`.

**CRITICAL: NEVER run `gh pr create` without showing the user the full draft (title + body) first and getting their explicit approval. Always draft first, present, wait for approval, then create.**

## Workflow

1. Read `.github/PULL_REQUEST_TEMPLATE.md` to get the exact structure
2. Run `git log` and `git diff main...HEAD` to understand all commits on the branch
3. Draft the PR title and body following the template and conventions below
4. **Show the complete draft (title + body) to the user and STOP. Wait for explicit approval before proceeding.**
5. Only after the user approves, run `gh pr create`

## PR title

- Must follow [conventional commit semantics](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/.github/semantic.yml#L2)
- Keep under 70 characters
- Examples: `feat(logger): add structured logging`, `fix(metrics): resolve dimension limit`, `chore: remove me-south-1 region`

## PR body format

The body MUST follow this structure:

```markdown
## Summary

<1-3 sentence summary of what and why>

### Changes

<bullet list of specific changes made>

**Issue number:** closes #<issue_number>

---

By submitting this pull request, I confirm that you can use, modify, copy, and redistribute this contribution, under the terms of your choice.

**Disclaimer**: We value your time and bandwidth. As such, any pull requests created on non-triaged issues might not be successful.
```

## Rules

- ALWAYS use bullet points in the Changes section, NOT checklists
- ALWAYS include the issue number if one exists
- ALWAYS include the disclaimer and contribution confirmation from the template
- The Summary section should explain the "what" and "why" concisely
- The Changes section should list concrete changes (files, behaviors) as bullets
- Do NOT use checklists (`- [x]`) in the Changes section
- Push the branch before creating the PR if not already pushed
