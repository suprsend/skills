# SuprSend Skills

Official [agent skills](https://agentskills.io) for working with SuprSend. Install them in any compatible AI agent:

```bash
npx skills add suprsend/skills
```

## What's Included

| Skill                      | Description                                                                                                                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `suprsend-workflow-schema` | Workflow schema reference — all workflow nodes with documentation, JSON schema details, and usage examples                                                                                        |
| `suprsend-template-schema` | Template (variant) schema reference — variant envelope, multi-tenant & multi-lingual variants, Handlebars + JSONNET syntax, and per-channel content schemas for all 9 channels                    |
| `suprsend-docs-support`    | How to access SuprSend documentation and get support — docs-over-SSH (`ssh suprsend.sh`), `.md`-suffix raw markdown fallback, LLM-friendly endpoints, in-app chat, AI copilot, Slack, and email   |
| `suprsend-cli`             | SuprSend CLI reference — command-line tool for managing workspaces, templates, workflows, schemas, and more, with agent-targeted per-command Tips _(pulled from [suprsend/cli](https://github.com/suprsend/cli))_ |

## For Users

Once installed, skills are automatically available to your AI agent. The agent will activate the relevant skill when you're working with SuprSend — managing workflows, configuring templates, debugging integrations, etc.

Skills follow the [agentskills.io progressive disclosure](https://agentskills.io/specification) model:

- **Metadata** loads at startup (skill name + description) so the agent knows what's available
- **Instructions** load on activation (the SKILL.md body) with step-by-step guidance
- **Resources** load on demand — `references/` for detailed docs, `scripts/` for executable helpers, `assets/` for templates and data files

## For Contributors

Skills are not hand-maintained — they're generated from templates by a TypeScript build pipeline. To modify or add skills, you work in `skills-src/` and run the generator.

### Prerequisites

- Node.js >= 20
- `ANTHROPIC_API_KEY` environment variable (only if the skill uses `claude` type sources)

### Setup

```bash
git clone https://github.com/suprsend/skills.git
cd skills
npm install
```

### Build

```bash
# Generate all skills
npm run build

# Generate a single skill
npm run build -- --skill=suprsend-workflow-schema

# Force fresh Claude API calls (bypass cache)
npm run build -- --no-cache

# Debug logging
npm run build -- --verbose

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Type check
npm run typecheck
```

Generated output lands in `skills/<skill-name>/` and should be committed.

### Project Structure

```
skills-src/                     Skill templates (you author here)
  └── <skill-name>/
      ├── sources.yaml          Data sources + metadata
      ├── template.md.hbs       Handlebars template → SKILL.md body
      ├── static/               Human-written markdown content
      ├── partials/             Reusable Handlebars partials
      ├── scripts/              Scripts to include in output
      ├── references/           Reference docs to include in output
      └── assets/               Static resources to include in output

skills/                         Generated output (committed, distributed)
  └── <skill-name>/
      ├── SKILL.md              Frontmatter + body
      ├── references/           On-demand documentation
      ├── scripts/              On-demand executable code
      └── assets/               On-demand static resources

src/                            Generator source code
tests/                          Test suite (vitest)
.cache/                         Claude API response cache (gitignored)
```

### Adding a New Skill

1. Create `skills-src/<skill-name>/` (name must be lowercase, hyphens only, no consecutive hyphens)

2. Write `sources.yaml`:

```yaml
name: my-skill
description: >
  What this skill does AND when to use it. Include keywords for discovery.
license: MIT
metadata:
  author: suprsend

sources:
  # Human-written content
  - type: static
    key: overview
    path: overview.md

  # Mintlify hosted docs
  - type: docs
    key: workflow_docs
    urls:
      - https://docs.suprsend.com/docs/workflows
    selector: "## Configuration"

  # JSON Schema
  - type: schema
    key: workflow_schema
    url: https://schema.suprsend.com/workflow/v1/schema.json
    follow_refs: true

  # AI-generated (cached)
  - type: claude
    key: best_practices
    prompt: |
      Given this schema: {{json workflow_schema}}
      Generate a best practices guide...
    model: claude-sonnet-4-20250514
    max_tokens: 4000

# Output files — static copies or templated
references:
  - filename: api-reference.md
  - filename: schema-tables.md
    template: partials/schema-tables.hbs

scripts:
  - filename: setup.sh

assets:
  - filename: workflow-template.json
```

3. Write `template.md.hbs`:

```handlebars
{{{overview}}}

## Commands

{{{commands}}}

## Best Practices

{{{best_practices}}}
```

4. Build and verify:

```bash
npm run build -- --skill=my-skill
```

5. Commit the generated `skills/my-skill/` directory.

### Source Types

| Type     | Resolves To | Description                                                                                                                               |
| -------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `static` | String      | Reads a `.md` file from `static/`                                                                                                         |
| `docs`   | String      | Fetches markdown from a URL (Mintlify `.md` append auto-tried)                                                                            |
| `schema` | Object      | Fetches JSON Schema, optionally resolves `$ref` pointers                                                                                  |
| `claude` | String      | Calls Claude API with a prompt (can reference other resolved keys). Responses are cached by `sha256(model + prompt)` in `.cache/claude/`. |

Claude sources run after all other sources, so their prompts can interpolate any previously resolved key using `{{key}}` syntax.

### Output File Declarations

The `references`, `scripts`, and `assets` arrays in `sources.yaml` declare files to include in the generated skill output. Each entry supports two modes:

- **Static copy** — just set `filename`. The file is copied from the matching subdirectory in `skills-src/<skill>/`.
- **Templated** — set `filename` and `template`. The `.hbs` template is rendered with the full template context.

### Handlebars Helpers

| Helper         | Usage                                     | Description                                         |
| -------------- | ----------------------------------------- | --------------------------------------------------- |
| `json`         | `{{json obj}}`                            | Formatted JSON output                               |
| `schema-table` | `{{schema-table schemaObj}}`              | JSON Schema properties → markdown table             |
| `schema-enum`  | `{{schema-enum enumArray}}`               | Enum values → bullet list                           |
| `section`      | `{{section markdown "## Heading"}}`       | Extract a section by heading                        |
| `codeblock`    | `{{codeblock content "json"}}`            | Fenced code block                                   |
| `trim`         | `{{trim text}}`                           | Strip whitespace                                    |
| `ifEqual`      | `{{#ifEqual a b}}...{{/ifEqual}}`         | Conditional equality                                |
| `each-sorted`  | `{{#each-sorted obj}}...{{/each-sorted}}` | Iterate keys alphabetically                         |
| `ref-link`     | `{{ref-link "file.md" "Label"}}`          | Link to `references/` file                          |
| `truncate`     | `{{truncate text 500}}`                   | Truncate to N characters                            |
| `get`          | `{{get obj "path.to.key"}}`               | Deep property access (dot notation or JSON Pointer) |
| `keys`         | `{{keys obj}}`                            | Get object keys as array                            |
| `concat`       | `{{concat "a" "b"}}`                      | Concatenate strings                                 |
| `default`      | `{{default value "fallback"}}`            | Return value, or fallback if null/undefined         |

### agentskills.io Compliance

The generator enforces the [agentskills.io specification](https://agentskills.io/specification):

- `name`: max 64 chars, lowercase alphanumeric + hyphens, no consecutive hyphens, must match directory name
- `description`: max 1024 chars, must describe what AND when
- `SKILL.md` body: warns if > 500 lines (recommended limit)
- Progressive disclosure: heavy content in `references/`, executable code in `scripts/`, static resources in `assets/`

## License

MIT
