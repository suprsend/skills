---
name: suprsend-workflow-schema
description: "SuprSend workflow schema reference for creating, modifying, or understanding notification workflows. Lists all available workflow nodes with documentation and JSON schema details."
metadata:
  author: "suprsend"
  category: "workflows"
---

SuprSend workflows define notification logic as a sequence of nodes. Each workflow requires a trigger (event or API) and at least one delivery node. Between trigger and delivery, you can add function, branch, and data nodes to build sophisticated notification journeys.

Workflows are defined as JSON conforming to the schema at `https://schema.suprsend.com/workflow/v1/schema.json`.


For a complete guide on creating workflows using the JSON schema, see [Workflow Schema Guide](references/workflow-schema-guide.md).

## Workflow Nodes

### Delivery Nodes

Send notifications to users. Every workflow must end with at least one delivery or HTTP API node.

| Node Type | Schema `node_type` | Description |
|---|---|---|
| Single Channel | `send_email`, `send_sms`, `send_whatsapp`, `send_inbox`, `send_mobile_push`, `send_webpush`, `send_slack`, `send_ms_teams` | Send via one channel |
| Multi-Channel | `send_multi_channel` | Send across multiple channels simultaneously |
| Smart Channel Routing | `send_smart_channel_routing` | Send sequentially across channels with delays until engagement |

See [Delivery Nodes Reference](references/node-delivery.md) for configuration details and schema.

### Function Nodes

Control timing and aggregation of notifications.

| Node Type | Schema `node_type` | Description |
|---|---|---|
| Delay | `delay` | Pause workflow for a fixed, dynamic, or relative duration |
| Batch | `batch` | Aggregate multiple triggers into one notification |
| Digest | `digest` | Send batched summary on a recurring schedule |
| Time Window | `timewindow` | Deliver only within specified day/time ranges |

See: [Delay](references/node-delay.md), [Batch](references/node-batch.md), [Digest](references/node-digest.md), [Time Window](references/node-timewindow.md)

### Branch Nodes

Route notifications through different paths based on conditions.

| Node Type | Schema `node_type` | Description |
|---|---|---|
| Branch | `branch` | If/else routing based on conditions |
| Wait Until | `branch_waituntil` | Pause until condition is met or timeout expires |

See: [Branch](references/node-branch.md), [Wait Until](references/node-wait-until.md)

### Data Nodes

Fetch, transform, or update data during workflow execution.

| Node Type | Schema `node_type` | Description |
|---|---|---|
| Fetch | `httpapi_fetch` | GET data from an external API |
| Webhook | `httpapi_webhook` | Call external API (GET/POST/PUT/PATCH/DELETE) |
| Data Transform | `transform` | Generate or modify variables using Handlebars or JSONNET |
| Invoke Workflow | `invokeworkflow` | Trigger another workflow as a step |
| Update User Profile | `userupdate` | Modify recipient or actor profile properties |

See: [Fetch](references/node-fetch.md), [Webhook](references/node-webhook.md), [Transform](references/node-transform.md), [Invoke Workflow](references/node-invoke-workflow.md), [User Update](references/node-user-update.md)

### List & Object Nodes

Manage user list memberships and object subscriptions.

| Node Type | Schema `node_type` | Description |
|---|---|---|
| Add User to List | `subscriberlistoperation_adduser` | Add recipient/actor to a list |
| Remove User from List | `subscriberlistoperation_removeuser` | Remove recipient/actor from a list |
| Subscribe to Object | `objectoperation_addsubscription` | Add user to an object subscription |
| Unsubscribe from Object | `objectoperation_removesubscription` | Remove user from an object subscription |

See: [List Operations](references/node-list-operations.md), [Object Operations](references/node-object-operations.md)
