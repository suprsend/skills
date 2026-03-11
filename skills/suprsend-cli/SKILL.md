---
name: suprsend-cli
description: "SuprSend CLI reference for AI agents. Use when working with SuprSend workflows, templates, channels, or API integrations. Covers all CLI commands, configuration, and common patterns."
license: MIT
metadata:
  author: "suprsend"
  version: "1.0"
---

# SuprSend CLI

The SuprSend CLI (`suprsend`) is a command-line tool for managing your SuprSend account and resources. It provides direct access to the SuprSend API for managing workspaces, workflows, templates, users, and more.

## Installation

```bash
npm install -g @suprsend/cli
```

## Authentication

Set up authentication with your workspace credentials:

```bash
suprsend login
```

Or set environment variables:
- `SUPRSEND_WORKSPACE_KEY` — Your workspace key
- `SUPRSEND_WORKSPACE_SECRET` — Your workspace secret


## Commands

### Workspace

- `suprsend workspace list` — List all workspaces
- `suprsend workspace switch <name>` — Switch active workspace

### Workflows

- `suprsend workflow list` — List all workflows
- `suprsend workflow get <slug>` — Get workflow details
- `suprsend workflow create` — Create a new workflow
- `suprsend workflow trigger <slug>` — Trigger a workflow

### Templates

- `suprsend template list` — List all templates
- `suprsend template get <slug>` — Get template details
- `suprsend template push <path>` — Push a local template

### Users

- `suprsend user get <id>` — Get user profile
- `suprsend user identify <id>` — Create or update a user
- `suprsend user preferences <id>` — Get user preferences


## Examples

### Trigger a workflow with data

```bash
suprsend workflow trigger welcome-email \
  --to '{"distinct_id": "user-123"}' \
  --data '{"name": "Alice", "plan": "pro"}'
```

### Export workflow as JSON

```bash
suprsend workflow get welcome-email --format json > workflow.json
```

### List all templates with filtering

```bash
suprsend template list --channel email --status active
```

