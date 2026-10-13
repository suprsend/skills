# SuprSend Documentation & Support

## Documentation

SuprSend docs are available at [docs.suprsend.com](https://docs.suprsend.com). Every page is also served as raw Markdown — always fetch the `.md` form.

### Find, then fetch

1. **Find the page** — fetch `https://docs.suprsend.com/llms.txt`, the page index (every page with a one-line description). Pick the page(s) that match the question.
2. **Fetch only that page as Markdown** — append `.md` to its URL:
   - HTML page → `https://docs.suprsend.com/docs/quick-start-guide`
   - Markdown for the same page → `https://docs.suprsend.com/docs/quick-start-guide.md`

   This works for both `/docs/` (guides) and `/reference/` (API reference) paths.

`https://docs.suprsend.com/llms-full.txt` holds every page in one file (several MB). Use it only for broad sweeps, never for a single lookup.

### SuprSend MCP server

If the agent is connected to the hosted [SuprSend MCP server](https://docs.suprsend.com/reference/mcp-overview) (`https://mcp.suprsend.com/mcp`):

- **Docs lookups** — use its `docs_search` tool.
- **Skills** (workflow, template, semantic layer, docs support) — load them the first way the client supports:
  1. the **MCP Skills extension** (skills load directly);
  2. the server's `skill://` **resources**;
  3. the `docs_get_skill` **tool**.

  All three return the same files.

## Getting Help

### 1. In-Product Agent (instant, in-dashboard)

The SuprSend dashboard at [app.suprsend.com](https://app.suprsend.com) has a built-in AI agent, scoped to your workspace and the SuprSend docs. Open it with:

- **macOS**: `Cmd + /` (side panel)
- **Windows / Linux**: `Ctrl + /` (side panel)
- the **Agent** tab in the left navbar (full page)

It can query the workspace, draft workflows, and debug delivery. Usage is credit-based and tied to the SuprSend plan. Docs: [In-Product Agent](https://docs.suprsend.com/reference/agent).

### 2. In-App Chat (fast, human support)

Users logged into the SuprSend dashboard can reach the support team directly. Click the **?** (help) icon in the top navigation bar, then select **"Chat with us"** from the dropdown menu.

### 3. Slack Community (public, community + team)

Join the SuprSend community Slack for discussions, questions, and announcements:

https://join.slack.com/t/suprsendcommunity/shared_invite/zt-3932rw936-XNWY1RC8bsffh4if4ZyoXQ

### 4. Email Support

For detailed issues, bug reports, or account-specific questions:

**support@suprsend.com**
