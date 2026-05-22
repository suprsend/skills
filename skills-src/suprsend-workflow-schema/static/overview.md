SuprSend workflows define notification logic as a sequence of nodes. Each workflow requires a trigger (event or API) and at least one delivery node. Between trigger and delivery, you can add function, branch, and data nodes to build sophisticated notification journeys.

Workflows are defined as JSON conforming to the schema at `https://schema.suprsend.com/workflow/v1/schema.json`.

## Recipient model

A workflow runs for exactly one recipient — the `distinct_id` from the API trigger, or from the event's `distinct_id` (or its `override_recipients_*` override). Every delivery node in the workflow sends to that recipient. **Delivery nodes have no per-node recipient field.**

If a workflow needs to send to someone other than the trigger recipient, use one of these patterns:

| Need | Use | Notes |
| --- | --- | --- |
| Re-point the *entire* workflow to a different recipient based on event payload (e.g., approval flows where the actor should receive resolution updates instead of the approver) | `override_recipients_type` + `override_recipients_user_expr` (or `override_recipients_single_object_fields_expr`) at the workflow root | **Event-triggered workflows only** (`trigger_type=event`). Not available for `trigger_type=api`. See [Workflow Schema Guide](references/workflow-schema-guide.md) → Recipient overrides. |
| Send to a different recipient *mid-flow*, while continuing the parent flow for the original recipient (e.g., a buyer-triggered order workflow that also alerts the seller at one step) | `invokeworkflow` node with `recipient_selection: "expression"` and `recipient_expression` pointing at the new recipient | Works for both `event` and `api` triggers. The invoked workflow runs in parallel with its own recipient. See [Invoke Workflow](references/node-invoke-workflow.md). |
| Aggregate across recipients different from the workflow's trigger recipient (e.g., one digest per seller across many buyer-triggered orders) | A separate workflow triggered with the digest key as its recipient, invoked from the parent via `invokeworkflow` | Digest nodes batch on `(recipient, workflow_slug)`. A digest inside a buyer-triggered workflow will always batch per-buyer. See [Digest](references/node-digest.md). |

If a generated workflow sends to multiple distinct recipients across nodes and uses neither `override_recipients_*` nor `invokeworkflow`, it is wrong — every send will route to the trigger recipient.
