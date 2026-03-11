---
name: suprsend-workflows
description: "SuprSend workflow design, configuration, and triggering guide for AI agents. Use when building notification workflows, configuring workflow nodes like delay, batch, digest, or branch, or triggering notifications via API or SDK."
license: MIT
metadata:
  author: "suprsend"
  version: "1.0"
  category: "workflows"
---

# SuprSend Workflows

A workflow is the core building block of SuprSend's notification system. It defines the automation logic for sending notifications — from trigger to delivery across multiple channels.

## When to Use This Skill

- Creating new notification workflows
- Configuring workflow nodes (delay, batch, digest, branch)
- Triggering workflows via API or SDK
- Setting up multi-channel notification delivery
- Implementing smart channel routing

## Key Concepts

- **Trigger**: Initiates the workflow via API call or event
- **Function Nodes**: Logic steps like delay, batch, digest, wait-until
- **Branch Nodes**: Conditional parallel execution paths
- **Delivery Nodes**: Send notifications via single or multiple channels
- **Version Control**: Changes are drafted first, then committed to go live


> **Supported Channels:** Email, SMS, WhatsApp, Android Push, iOS Push, Web Push, Slack, MS Teams, In-App Inbox

## Designing a Workflow

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.suprsend.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Design Workflow

> Learn how to design, edit or publish workflow on SuprSend dashboard.

## Pre-Requisites

[Understanding the basics of workflows](/docs/workflows)

## Creating a new workflow

Click on  button on the workflow page to create workflow from scratch or select a workflow from our sample library.

* Pass workflow name and category. Choose a relevant name initially as it determines the related workflow slug, which cannot be modified later.
* [Notification Category](https://docs.suprsend.com/docs/notification-category) is used to apply user preferences to the workflow. While creating the workflow, you can select any notification category and adjust it later if needed.

<img src="https://mintcdn.com/suprsend/dnAGb1CmSRGCSyT3/images/docs/35a2d26-image.png?fit=max&auto=format&n=dnAGb1CmSRGCSyT3&q=85&s=ec86ce0a5840349b4326b35cf3937af3" alt="" width="934" height="752" data-path="images/docs/35a2d26-image.png" />

* After entering the required details, click on `Create` button to create a new workflow in draft state. You'll see the created workflow on top of the listing page, click on it to start editing.
* Next, add relevant nodes to your workflow and edit workflow settings.
* Once you've finalized your edits, remember to  make the workflow live. If you don't want to make your changes live ri...

For detailed node configuration, see [Workflow Nodes Reference](references/nodes-reference.md).

## Triggering Workflows

> ## Documentation Index
> Fetch the complete documentation index at: https://docs.suprsend.com/llms.txt
> Use this file to discover all available pages before exploring further.

# Trigger Workflow

> Learn how to trigger workflows using any of the available methods.

You can trigger workflows designed on SuprSend dashboard via making a [direct call](/docs/trigger-workflow#triggering-workflow-via-api) to `workflows.trigger` endpoint or via [event trigger](/docs/trigger-workflow#event-based-trigger). In SuprSend, we refer events as user-initiated actions, such as social media interactions, or system-generated events like pending payments. User needs to be created beforehand for event based triggers.

[Direct API trigger](/docs/trigger-workflow#triggering-workflow-via-api) is a straightforward way to get started, as you can include recipient channel information directly in the API call and doesn't require prior user creation to initiate the notification.

## Triggering workflow via API

<Info>
  It is a unified API to trigger workflow and doesn't require user creation before hand to trigger notification. Recommended for platforms transitioning their existing notifications to SuprSend. If you are using our frontend SDKs to configure notifications and passing events and user properties from third-party data platforms like Segment, then [event-based trigger](/docs/trigger-workflow#event-based-trigger) would be a better choice.
</Info>

<Warning>
  It is a new workflow method and ...

For complete API payload examples, see [API Payload Examples](references/api-payloads.md).

## Quick Example

### Trigger via API (cURL)

```bash
curl -X POST "https://hub.suprsend.com/trigger/" \
  -H "Authorization: Bearer <WORKSPACE_KEY>:<WORKSPACE_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "order-confirmation",
    "recipients": [
      {
        "distinct_id": "user-123",
        "$email": ["user@example.com"]
      }
    ],
    "data": {
      "order_id": "ORD-456",
      "amount": "$29.99",
      "item_name": "Premium Widget"
    }
  }'
```

## SDK Examples

### Trigger via Node.js SDK

```javascript
const { SuprSend } = require("@suprsend/node-sdk");

const supr = new SuprSend("WORKSPACE_KEY", "WORKSPACE_SECRET");

const workflow = supr.workflows.trigger({
  workflow: "order-confirmation",
  recipients: [{ distinct_id: "user-123" }],
  data: { order_id: "ORD-456", amount: "$29.99" },
});

await workflow;
```

### Trigger via Python SDK

```python
from suprsend import Suprsend

supr = Suprsend("WORKSPACE_KEY", "WORKSPACE_SECRET")

workflow = supr.workflows.trigger(
    workflow="order-confirmation",
    recipients=[{"distinct_id": "user-123"}],
    data={"order_id": "ORD-456", "amount": "$29.99"},
)
```

## Skill Info

- **author**: suprsend
- **category**: workflows
- **version**: 1.0
