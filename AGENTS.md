# Agent Instructions

## Coding standards

Before writing or reviewing code, tests, or docs, read [`CODING_STANDARDS.md`](CODING_STANDARDS.md) — the project's conventions for package layout, TypeScript style, JSDoc, verification commands, unit tests (including the 100% coverage requirement), and documentation snippets.

## Skills

Project-specific agent skills live in [`.agents/skills/`](.agents/skills/). Each skill is a directory containing a `SKILL.md` with frontmatter (`name`, `description`) describing when to use it.

If your coding agent does not discover skills from `.agents/skills/` automatically, read the relevant `SKILL.md` and follow its instructions when performing a matching task:

- [`create-issue`](.agents/skills/create-issue/SKILL.md) — creating GitHub issues following the project's issue templates
- [`create-pr`](.agents/skills/create-pr/SKILL.md) — creating GitHub pull requests following the project's PR template
