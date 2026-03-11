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
