# Cancel Workflow Node

**Schema `node_type`:** `cancelworkflow`

Cancels other **in-progress** runs in the same workspace — for example, stop a pending payment-reminder sequence once the payment arrives. Runs paused in a delay, batch, digest, or wait-until node count as in-progress. The node never cancels the run it is executing in.

## Schema Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| workflows | array | null | No | slugs of workflows whose in-progress runs should be cancelled. null/empty = no workflow filter |
| recipient_selection | string | null | No | recipient filter for in-progress executions to be cancelled. empty/null = no recipient filter |
| recipient_expression | string | null | No | JSONNET expression to derive recipient at runtime. required non-empty string if recipient_selection=expression; otherwise empty/null is allowed |
| cancellation_key | string | null | No | JSONNET expression to match runs by cancellation key. empty/null = no key filter |

At least one filter must be set: a non-empty `workflows` list, a `recipient_selection` of `recipient` / `actor` / `expression`, or a non-empty `cancellation_key`. All filters that are set are combined with **AND**.

| Filter | Matches runs where |
|---|---|
| `workflows` | the workflow slug is in the list (max 20; can't include the current workflow's own slug) |
| `recipient_selection: "recipient"` | the recipient is this run's recipient |
| `recipient_selection: "actor"` | the recipient is this run's actor |
| `recipient_selection: "expression"` | the recipient is the user whose `distinct_id` the JSONNET `recipient_expression` returns |
| `cancellation_key` | the run's cancellation key equals the value this JSONNET expression returns (exact match) |

Cancellation is **not tenant-scoped**. A node with only `recipient_selection` cancels every other in-progress run for that user, including other runs of the same workflow — add `workflows` and/or `cancellation_key` to narrow it.

If a filter can't be resolved — an expression fails, `actor` is selected but the trigger has no actor, or `recipient_expression` returns an unknown `distinct_id` — the node logs an error and the workflow continues without cancelling anything. If every filter evaluates to empty, nothing is cancelled.

## Cancellation keys

A run only has a cancellation key if one was assigned when it started:

1. **API trigger** — a literal `cancellation_key` in the trigger request body.
2. **Workflow root `cancellation_key`** — a JSONNET expression evaluated at trigger time against the trigger data plus `$recipient`, `$actor`, and `$tenant` (used when the API request doesn't pass one). If it fails to evaluate, the run starts without a key.
3. **`invokeworkflow` `cancellation_key`** — sets the key on the invoked child run.

Keys are trimmed, truncated to 512 characters, must evaluate to a scalar, and are matched exactly.

## Example

Workflow `payment-reminder` tags each run with the invoice id at its root:

```json
{
  "name": "payment-reminder",
  "trigger_type": "event",
  "trigger_events": ["invoice_created"],
  "cancellation_key": "data.invoice_id",
  "tree": { "nodes": [ /* delay → reminder sends */ ] }
}
```

A separate workflow triggered by `payment_received` cancels the pending reminders for that invoice:

```json
{
  "node_type": "cancelworkflow",
  "name": "Cancel payment reminders",
  "properties": {
    "workflows": ["payment-reminder"],
    "recipient_selection": "recipient",
    "cancellation_key": "data.invoice_id"
  }
}
```

There is no guide page for this node yet; the REST equivalent is [Cancel workflow](https://docs.suprsend.com/reference/cancel-workflow).
