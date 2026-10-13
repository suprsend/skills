# Delivery Nodes

Delivery nodes send notifications to users.

## Single Channel Nodes

Send via one specific channel. Each uses a different `node_type`, and only `template` and `success` apply (see [Schema Properties](#schema-properties)).

| `node_type` | Channel |
|---|---|
| `send_email` | Email |
| `send_sms` | SMS |
| `send_whatsapp` | WhatsApp |
| `send_inbox` | In-app Inbox |
| `send_mobile_push` | Mobile Push (Android + iOS) |
| `send_webpush` | Web Push |
| `send_slack` | Slack |
| `send_ms_teams` | Microsoft Teams |

### Documentation — Single Channel

# Delivery- Single Channel

> Configure single channel delivery nodes for email, SMS, WhatsApp, mobile push, web push, Slack, MS Teams and inbox messages in SuprSend workflows.

You can use single-channel delivery nodes - Email, SMS, WhatsApp, Inbox, Slack, MS Teams, MobilePush and Webpush to send notification on a particular user channel. The content of the notification is designed with [templates](/docs/templates).


## How the delivery node is executed?

Delivery node is successfully executed if all of the below checks hold true:

1. The channel must be published and live within the template. For WhatsApp and SMS (Indian vendors), templates become live upon approval by the respective provider.
2. Vendor Configuration is available for the channel. For all out-of-app channels, you need to create an account with the respective [channel provider](/docs/vendors) and add the configuration in the vendor form on SuprSend dashboard. Inbox is an internal offering by SuprSend and doesn't need any third party integration. [Refer Integration guide](/docs/inbox-overview) to setup Inbox Channel.
3. Channel information should be available in user profile and channel status should be active. A set channel becomes inactive in case the channel is `removed` or `unset` using [SDK or API](/docs/users#via-sdk) or it is marked inactive by SuprSend.
4. User preference is `opt-in` for the given channel within the preference category (defined in workflow settings). You can check user preference status using [get user preference API](/reference/get-user-category-preferences).

> **Note:**
  **Category-level opt-out is checked at trigger time.** If a user has opted out of the entire preference category, the workflow is skipped before execution begins — the workflow run does not start. The delivery node only evaluates **channel-level** preferences (whether the user has opted into the specific channel within the category). See [Preference Evaluation](/docs/preference-evaluation) for details.


> **Note:**
  ### Inactive channel marking by SuprSend

  SuprSend marks the user channel identity inactive for email and WhatsApp in case of hard errors from vendor end, such as bounced email addresses, unregistered WhatsApp numbers.

  This is done to safeguard your email domain authority or WhatsApp rating if you continue to send notifications to users who have reported or marked your email or messages as spam.

  Additionally, this helps in WhatsApp cost saving, as vendor charges for every processed request. Inactive marking period by SuprSend is 15 days for WhatsApp and 90 days for email.


## Success Metric

Success Metric can be any event which defines the target user activity you aim to drive with your sent notification. for example, if the objective of your notification is to prompt users to open it, such as in the case of newsletters, you can set your success metric as `Notification Status - Seen`. If your goal is for users to perform any custom event, like complete payment in case of payment reminder notification, then you can set that event as your success metric.


In the context of single-channel delivery, the success metric is utilized solely to track conversion numbers for display in workflow analytics. However, in the case of [smart channel routing](/docs/smart-delivery), the same success metric serves to halt delivery on further channels once the success metric is achieved.

***


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

## Multi-Channel Node

**Schema `node_type`:** `send_multi_channel`

Sends across multiple channels simultaneously.

### Documentation — Multi-Channel

# Delivery- Multi-Channel

> Use the multi-channel delivery node to notify users across email, SMS, push, WhatsApp and chat channels in a single SuprSend workflow step.

You can use multi-channel delivery node to notify users on multiple channels at once. If you want to send multi-channel notifications, we recommend using [smart channel routing](/docs/smart-delivery) to ensure that notifications are delivered sequentially on multiple channels rather than bombarding users on all channels at once.


The content of the notification is designed with [templates](/docs/templates). In SuprSend, you can design the content of multiple channels within a single template group.

## How the delivery node is executed?

Delivery node is successfully executed if all of the below checks hold true:

1. The channel should be published and live in the template. For WhatsApp and SMS (Indian vendors), templates become live upon approval by the respective provider.
2. Vendor Configuration is available for the channel. For all out-of-app channels, you need to create an account with the respective [channel provider](/docs/vendors) and add the configuration in the vendor form on SuprSend dashboard. Inbox is an internal offering by SuprSend and doesn't need any third party integration. [Refer Integration guide](/docs/inbox-overview) to setup Inbox Channel.
3. Channel information should be available in user profile and channel status should be active. Template channels not available in user profile are skipped for delivery. A set channel becomes inactive in case the channel is `removed` or `unset` using [SDK or API](/docs/users#via-sdk) or it is marked inactive by SuprSend.
4. User preference is `opt-in` for the given channel within the preference category (defined in workflow settings). You can check user preference status using [get user preference API](/reference/get-user-category-preferences).

> **Note:**
  **Category-level opt-out is checked at trigger time.** If a user has opted out of the entire preference category, the workflow is skipped before execution begins — the workflow run does not start. The delivery node only evaluates **channel-level** preferences (whether the user has opted into the specific channel within the category). See [Preference Evaluation](/docs/preference-evaluation) for details.


> **Note:**
  ### Inactive channel marking by SuprSend

  SuprSend marks the user channel identity inactive for email and WhatsApp in case of hard errors from vendor end, such as bounced email addresses, unregistered WhatsApp numbers.

  This is done to safeguard your email domain authority or WhatsApp rating if you continue to send notifications to users who have reported or marked your email or messages as spam.

  Additionally, this helps in WhatsApp cost saving, as vendor charges for every processed request. Inactive marking period by SuprSend is 15 days for WhatsApp and 90 days for email.


## Selecting channels for multi-channel delivery

By default, notification is sent on all active channels of the template. You can however choose to send notification on selected channels by manually choosing selected channels in the form or [override channels](/docs/delivery-multi-channel#override-channels) dynamically using data in your event property.

### Override Channels

You can use this field to pass channel list dynamically using data in your event property. This feature comes in handy when user channels are dynamically defined at the user level for each workflow. For instance, when booking an appointment, your users are dynamically defining their preferred channel to receive booking updates for each appointment.

For more consistent channel preferences, like user wanting to receive all communication via email only, or defining preferred communication channel for a notifications category (like booking updates), we recommend updating it using [user preferences](/docs/user-preferences).

To override channels, include the channels array in event property and add the corresponding key in the override channels field on SuprSend workflow form.


The expected channel values are: `["email", "sms", "whatsapp", "androidpush", "iospush", "webpush", "slack", "inbox", "ms_teams"]`

You can add channel array as a [JQ-expression](https://jqlang.github.io/jq/manual/). So, in case your channel values do not match with the one mentioned in the above table, you can transform it using the JQ-expression. Below are some examples of how to add duration key in JQ format:

1. General format for duration key at parent level is`.channels`
2. If channel is a nested event property key like shown below, enter it in the format`.user.channels`.


  ```json Trigger Payload theme={"system"}
  properties = {
    "user": {
      "name": "Steve",
      "channels": ["email","inbox"]
    }
  ```


> **Warning:**
  * If both selected channels and override channels key are set in the form, system will prioritize the override channels, even if that channel is not included in the selected channel list.
  * When the override channel variable in the event data is missing, or resolves to an invalid value, workflow execution will stop and corresponding error will be logged in the logs


## Success Metric

Success Metric can be any event which defines the target user activity you aim to drive with your sent notification. for example, if the objective of your notification is to prompt users to open it, such as in the case of newsletters, you can set your success metric as `Notification Status - Seen`. If your goal is for users to perform any custom event, like complete payment in case of payment reminder notification, then you can set that event as your success metric.


In the context of multi-channel delivery, the success metric is utilized solely to track conversion numbers for display in workflow analytics. However, in the case of [smart channel routing](/docs/smart-delivery), the same success metric serves to halt delivery on further channels once the success metric is achieved.

***


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

## Smart Channel Routing Node

**Schema `node_type`:** `send_smart_channel_routing`

Sends sequentially across channels with delays until the user engages on one channel.

### Documentation — Smart Channel Routing

# Smart Channel Routing

> Send notifications across multiple channels sequentially - with a delay between each - so users aren't bombarded, and you stop sending the moment they engage.

Instead of sending a notification on all channels at once, Smart Channel Routing delivers them **one channel at a time**, with a delay in between. The moment a user engages (opens, clicks, or triggers a custom event), delivery on remaining channels stops - reducing noise for users and cutting cost on paid channels.

***

## How It Works

Smart Channel Routing follows three steps when a workflow is triggered:

### 1. Identify eligible channels

SuprSend checks which channels qualify for delivery by intersecting:

* **Channels active on the template** - published and live. For WhatsApp and SMS (Indian vendors), this means provider approval is complete.
* **Channels active in the user profile** - not removed, unset, or marked inactive. See [managing user channels](/docs/users#via-sdk).
* **User opt-in preference** - if you use SuprSend's preference centre, the user must be `opt-in` for the channel within the preference category. Category-level opt-out is checked at trigger time (the workflow won't run for opted-out users), while channel-level preferences are evaluated here at the delivery node. Verify with the [get user preference API](/reference/get-user-category-preferences).

### 2. Order outside-app channels

Routing logic **only applies to outside-app channels** - Email, SMS, WhatsApp, Slack, MS teams and Push. SuprSend orders these based on your chosen [optimize-on](#optimize-on) setting (default: lowest to highest cost).

> **Note:**
  **Inbox is delivered at T+0 only in the default setup** - when neither Must Send To (`mandatory_channels`) nor a channel sequence (`routing_basis: "channels_sequence"`) is set. Then Inbox fires immediately alongside the first outside-app channel and does not count toward the sequence or interval calculation. If either setting is used, Inbox gets no special treatment: it is ordered like any other channel (by cost, or by its position in the sequence) unless you list it in `mandatory_channels`.


### 3. Deliver sequentially with a delay

Default sequence (no Must Send To channel, no channel sequence):

| Time | What's sent |
| - | - |
| T+0 | Inbox (if active) + 1st outside-app channel |
| T+interval | 2nd outside-app channel |
| T+interval×2 | 3rd outside-app channel |
| ... | continues until success metric is achieved |

The interval between each outside-app channel is:

`interval = time_to_live ÷ (number of routed channels − 1)` in the default setup, where the first routed channel goes at T+0.

**When a Must Send To channel is sent** (listed in `mandatory_channels` and reachable for this user), must-send channels go at T+0 and routed channels start one interval later: `interval = time_to_live ÷ number of routed channels`. Example: `mandatory_channels: ["inbox"]`, Email + SMS routed, time-to-live 1h → Inbox at T+0, Email at T+30min, SMS at T+60min.

Routed channels are counted per channel identity (see below). If a step fails to send at all, the next step goes out without waiting for the rest of its interval.

**Example:** Template with Inbox + Email + SMS + WhatsApp, time-to-live = 1 hour:

* **T+0** → Inbox + Email
* **T+30min** → SMS (skipped if success metric already achieved)
* **T+60min** → WhatsApp (skipped if success metric already achieved)

If a user sees the in-app notification at T+0, only **SMS and WhatsApp are skipped** - Email has already been sent alongside Inbox.

Once the success metric is achieved at any point, all remaining channel deliveries are cancelled immediately.

<Info>
  **Routing is per channel identity, not per channel.** If a user has multiple identities on the same channel (for example, two email addresses), each identity is treated as a separate step in the sequence. SuprSend sends to the first email address, waits for the configured interval, then sends to the second.
</Info>

***

## Configuration

### Optimize On

Sets the order in which outside-app channels are attempted. The default is **cost** - channels are tried from lowest to highest cost based on your vendor settings.

In workflow JSON this is `routing_basis`: `"cost_low_to_high"` (default) or `"channels_sequence"`. With `"channels_sequence"`, also pass `routing_channels_sequence` (non-empty list of channel values): listed channels go first in list order, unlisted ones follow by cost. The saved sequence may not keep the order you sent, so read the node back after saving to check it.

### Time to Live

The total time window across which outside-app channels are attempted. This determines the interval between each channel.

**Example:** 3 outside-app channels, time-to-live = 1 hour → channels are tried **30 minutes** apart.

### Must Send To

Channels listed here (`mandatory_channels`) are delivered to **immediately at T+0**, outside of routing order. Use this for channels that must always receive the notification regardless of sequencing. Setting it turns off the automatic Inbox-at-T+0 rule (add `inbox` here if you need it immediately), and when a must-send channel is sent, the first routed channel waits one full interval instead of going at T+0.

### Success Metric

Defines what counts as "user engaged." Once this is met, SuprSend stops delivering to further channels.

**Notification Status** - a status reached on any sent channel:

| Status | When it triggers |
| - | - |
| Delivered | Notification is delivered to the device or inbox |
| Seen | User opens or views the notification |
| Interaction / Click | User clicks a CTA or interacts with the notification |

**Custom Event** - any event your platform fires in response to the notification. For example, `invoice_paid` for a payment reminder, or `appointment_confirmed` for a booking flow.

> **Note:**
  **Vendor routing is independent.** If you have vendor routing enabled, it operates independently of channel routing and does not add to the delay between channels.


***

## Override Channels

Pass a channel list dynamically at runtime via an event property. Useful when a user's preferred channel changes per workflow trigger - for example, a user selecting their preferred channel when booking an appointment.

> For persistent preferences (for example, a user who always wants email only), use [User Preferences](/docs/user-preferences) instead — it's the more appropriate tool.

**Setup:** Add a `channels` array to your event properties, then reference the key in the **Override Channels** field in the workflow form.


Accepted channel values:

```
"email" | "sms" | "whatsapp" | "androidpush" | "iospush" | "webpush" | "slack" | "inbox" | "ms_teams"
```

You can use a [JQ expression](https://jqlang.github.io/jq/manual/) to map your event data to the expected format:

* Top-level key: `.channels`
* Nested key: `.user.channels`

```json theme={"system"}
{
  "user": {
    "name": "Steve",
    "channels": ["email", "inbox"]
  }
}
```

> **Warning:**
  If the channel key is missing or resolves to an invalid value, workflow execution stops and the error is logged.


***

## Frequently Asked Questions


  ### Why am I receiving Inbox and Email at the same time?
    This is expected in the default setup (no Must Send To, no channel sequence): Inbox then fires at T+0 alongside the first outside-app channel (Email, in this case). The time-to-live delay only applies to the 2nd, 3rd, and subsequent outside-app channels.

    So with Inbox + Email + SMS and a 10-minute time-to-live:

    * **T+0** → Inbox + Email
    * **T+10min** → SMS (only if success metric not yet met)
  

  ### Do I need a 'Wait Until' node before this node?
    No. The delay between channels is managed by the **Time to Live** setting inside the Smart Channel Routing node. A Wait Until node is not required.
  


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

## Schema Properties

The table lists every delivery property. Each node type keeps only some of them, and **other keys are silently dropped on save**:

| `node_type` | Properties kept |
|---|---|
| Single-channel (`send_email`, `send_sms`, …) | `template`, `success`. The channel is fixed by the node type (`send_mobile_push` = `androidpush` + `iospush`). |
| `send_multi_channel` | `template`, `channels`, `channels_expr`, `success` |
| `send_smart_channel_routing` | `template`, `channels_expr`, `success`, `ttl_value`, `mandatory_channels`, `routing_basis`, `routing_channels_sequence`. There is **no `channels`**: it routes across all live template channels unless `channels_expr` narrows them. |

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| template | string | Yes | slug of template used for notification content |
| channels | array | No | specific channels to use when sending multi-channel notification |
| channels_expr | string \| null | No | jq-expression for preparing channel list, if channels are to be derived at runtime using payload |
| success | string | No | success metric (delivered/seen/interaction/<user-event>) |
| mandatory_channels | array | No | applicable for smart-channel-routing, notification on mandatory channels will be sent immediately |
| ttl_value | string | No | Duration format ([xx]d[xx]h[xx]m[xx]s) examples [30s, 1m, 1m30s, 1d3h45m] |

**Field rules:**

- `template`: slug of an existing, **published** template. Otherwise the node errors on save.
- `success`: `delivered` | `seen` | `interaction` | a custom event name. **Required on `send_smart_channel_routing`** — workflow JSON without it is rejected on save. On other delivery nodes it defaults to `seen`. A custom event counts only if it happens within 1 day of the send (fixed window). On an event-triggered workflow, a success event that is also a trigger event is rejected at publish. Only smart routing acts on it by stopping the remaining channels. On other nodes it is analytics only.
- `ttl_value` (smart routing): default `1h`. Use a duration like `30m` or `1h30m`: no spaces, hours ≤ 23, minutes and seconds ≤ 59, greater than 0, at most 90 days ([Duration format](workflow-schema-guide.md#duration-format)).
- `routing_basis` (smart routing): `cost_low_to_high` (default) | `channels_sequence`. With `channels_sequence`, `routing_channels_sequence` (non-empty channel list) is required. Listed channels go first and the rest follow by cost. The saved order may not match what you sent, so read the node back to check.
- `mandatory_channels` (smart routing): sent at T+0. Setting it turns off the automatic "inbox at T+0" behaviour, and when a listed channel is reachable for the user, the routed channels start one interval after T+0 (interval = `ttl_value` ÷ number of routed channels). See the example below.

### Channel values

- `sms`
- `email`
- `androidpush`
- `iospush`
- `webpush`
- `inbox`
- `whatsapp`
- `slack`
- `ms_teams`

## Examples

### Single channel — Email

```json
{
  "node_type": "send_email",
  "properties": {
    "template": "welcome-email"
  }
}
```

### Multi-channel

```json
{
  "node_type": "send_multi_channel",
  "properties": {
    "template": "order-confirmation",
    "channels": ["email", "inbox", "whatsapp"]
  }
}
```

### Smart channel routing

```json
{
  "node_type": "send_smart_channel_routing",
  "properties": {
    "template": "payment-reminder",
    "ttl_value": "1h",
    "routing_basis": "cost_low_to_high",
    "mandatory_channels": ["inbox"],
    "success": "seen"
  }
}
```

Timing for a user reachable on inbox, email and SMS (email cheaper than SMS):

- **As written** (`mandatory_channels: ["inbox"]`): inbox at T+0, email at **T+30m**, SMS at T+60m. The interval is 1h ÷ 2 routed channels.
- **Without `mandatory_channels`** (default): inbox **and** email at T+0, SMS at T+60m. The interval is 1h ÷ (2 − 1).

Delivery stops as soon as the user reaches `success`. Omit `mandatory_channels` if the first paid channel should go out immediately.
