# SuprSend Skills Generator

This repo generates official SuprSend agent skills for distribution via `npx skills add suprsend/skills`.

## Project Structure

- `src/` — TypeScript generator source code (build tool, not distributed)
- `skills-src/` — Skill templates with `sources.yaml` + Handlebars templates (authoring)
- `skills/` — Generated output (committed, this is what users install)
- `tests/` — Vitest test suite (unit, integration, validation)
- `.cache/` — Build cache for Claude API responses (gitignored)

## How It Works

Each skill in `skills-src/<name>/` has:
- `sources.yaml` — declares data sources (static files, docs URLs, JSON schemas, Claude prompts) and output file declarations
- `template.md.hbs` — Handlebars template that produces the SKILL.md body
- `static/` — human-written markdown content used by `static` sources
- `partials/` — reusable Handlebars partials
- `scripts/` — executable scripts to copy or template into output
- `references/` — reference docs to copy or template into output
- `assets/` — static resources (templates, data files) to copy or template into output

Run `npm run build` to generate all skills, or `npm run build -- --skill=<name>` for one.

## Commands

- `npm run build` — Generate all skills
- `npm run build -- --skill=<name>` — Generate a single skill
- `npm run build -- --no-cache` — Force fresh Claude API calls (bypass cache)
- `npm test` — Run test suite
- `npm run test:watch` — Run tests in watch mode
- `npm run typecheck` — Run TypeScript type checking

## Environment Variables

- `ANTHROPIC_API_KEY` — Required for `claude` type sources

## agentskills.io Compliance

All generated SKILL.md files MUST comply with https://agentskills.io/specification:
- Frontmatter: `name` (max 64 chars, lowercase+hyphens, no consecutive hyphens, matches dir name), `description` (max 1024 chars)
- Body: < 500 lines, < 5000 tokens. Use progressive disclosure.
- Heavy reference material goes in `references/` (loaded on-demand by agents)
- Executable code goes in `scripts/` (run on-demand by agents)
- Static resources go in `assets/` (loaded on-demand by agents)

## Adding a New Skill

1. Create `skills-src/<skill-name>/`
2. Write `sources.yaml` with metadata + data source declarations
3. Write `template.md.hbs` using Handlebars (access sources via `{{key}}`)
4. Add any static content to `static/` subdirectory
5. Optionally add `scripts/`, `references/`, `assets/` subdirectories with files to include in output
6. Declare output files in `sources.yaml` under `references:`, `scripts:`, `assets:` — each entry can be a static copy (just `filename`) or templated (`filename` + `template`)
7. Run `npm run build -- --skill=<skill-name>`
8. Verify output in `skills/<skill-name>/SKILL.md`
9. Commit the generated `skills/` output

## Template Variables

In Handlebars templates, each source's `key` becomes a template variable:
- Static sources → raw markdown string
- Docs sources → fetched markdown string
- Schema sources → parsed JSON Schema object (use `get` helper to navigate)
- Claude sources → generated text string

`meta` is always available with `meta.name`, `meta.description`, and other frontmatter fields.

## Handlebars Helpers

- `{{json obj}}` — Render as formatted JSON
- `{{schema-table schemaObj}}` — JSON Schema properties → markdown table
- `{{schema-enum enumArray}}` — Enum values → markdown list
- `{{section markdown "## Heading"}}` — Extract section by heading
- `{{codeblock content "json"}}` — Wrap in fenced code block
- `{{trim text}}` — Strip whitespace
- `{{#ifEqual a b}}...{{/ifEqual}}` — Conditional on equality
- `{{#each-sorted obj}}...{{/each-sorted}}` — Iterate keys alphabetically
- `{{ref-link "file.md" "Label"}}` — Link to references/ file
- `{{truncate text 500}}` — Truncate text to N characters
- `{{get obj "path.to.key"}}` — Deep property access (dot notation or JSON Pointer `#/$defs/foo`)
- `{{keys obj}}` — Get object keys as an array
- `{{concat "a" "b"}}` — Concatenate strings
- `{{default value "fallback"}}` — Return value, or fallback if null/undefined

## Output File Declarations

In `sources.yaml`, the `references`, `scripts`, and `assets` arrays declare files to include in the generated skill. Each entry supports two modes:

```yaml
# Static copy — copies from skills-src/<skill>/references/<filename>
references:
  - filename: troubleshooting.md

# Templated — renders a Handlebars template with the full template context
references:
  - filename: schema-reference.md
    template: partials/schema-ref.hbs
```

The same pattern applies to `scripts:` and `assets:`.
