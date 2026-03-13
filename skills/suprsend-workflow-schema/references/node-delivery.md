# Delivery Nodes

Delivery nodes send notifications to users. Every workflow must end with at least one delivery node.

## Single Channel Nodes

Send via one specific channel. Each uses a different `node_type` but shares the same schema properties.

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

> Learn how to use delivery nodes like email, sms, whatsapp, mobile push, web push, slack, ms teams, inbox in workflows.

You can use single-channel delivery nodes - Email, SMS, Whatsapp, Inbox, Slack, MS Teams, MobilePush and Webpush to send notification on a particular user channel. The content of the notification is designed with [templates](/docs/templates).

## How the delivery node is executed?

Delivery node is successfully executed if all of the below checks hold true:

1. The channel must be published and live within the template. For WhatsApp and SMS (Indian vendors), templates become live upon approval by the respective provider.
2. Vendor Configuration is available for the channel. For all out-of-app channels, you need to create an account with the respective [channel provider](/docs/vendors) and add the configuration in the vendor form on SuprSend dashboard. Inbox is an internal offering by SuprSend and doesn't need any third party integration. [Refer Integration guide](/docs/inbox-overview) to setup Inbox Channel.
3. Channel information should be available in user profile and channel status should be active. A set channel becomes inactive in case the channel is `removed`or `unset`using [SDK or API](/docs/users#via-sdk) or it is marked inactive by SuprSend.
4. User preference is`opt-in `for the given channel and notification category (defined in workflow settings). You can check user preference status using [get user preference API](/reference/get-user-category-preferences).

> **Note:**
  ### Inactive channel marking by SuprSend

  SuprSend marks the user channel identity inactive for email and WhatsApp in case of hard errors from vendor end, such as bounced email addresses, unregistered WhatsApp numbers.

  This is done to safeguard your email domain authority or WhatsApp rating if you continue to send notifications to users who have reported or marked your email or messages as spam.

  Additionally, this helps in WhatsApp cost saving, as vendor charges for every processed request. Inactive marking period by SuprSend is 15 days for WhatsApp and 90 days for email.


## Success Metric

Success Metric can be any event which defines the target user activity you aim to drive with your sent notification. e.g., if the objective of your notification is to prompt users to open it, such as in the case of newsletters, you can set your success metric as `Notification Status - Seen`. If your goal is for users to perform any custom event, like complete payment in case of payment reminder notification, then you can set that event as your success metric.


In the context of single-channel delivery, the success metric is utilized solely to track conversion numbers for display in workflow analytics. However, in the case of [smart channel routing](/docs/smart-delivery), the same success metric serves to halt delivery on further channels once the success metric is achieved.

***

## Multi-Channel Node

**Schema `node_type`:** `send_multi_channel`

Sends across multiple channels simultaneously.

### Documentation — Multi-Channel

# Delivery- Multi-Channel

> How to send notification across multiple channels in a single workflow step.

You can use multi-channel delivery node to notify users on multiple channels at once. If you want to send multi-channel notifications, we recommend using [smart channel routing](/docs/smart-delivery) to ensure that notifications are delivered sequentially on multiple channels rather than bombarding users on all channels at once.

The content of the notification is designed with [templates](/docs/templates). In SuprSend, you can design the content of multiple channels within a single template group.

## How the delivery node is executed?

Delivery node is successfully executed if all of the below checks hold true:

1. The channel should be published and live in the template. For WhatsApp and SMS (Indian vendors), templates become live upon approval by the respective provider.
2. Vendor Configuration is available for the channel. For all out-of-app channels, you need to create an account with the respective [channel provider](/docs/vendors) and add the configuration in the vendor form on SuprSend dashboard. Inbox is an internal offering by SuprSend and doesn't need any third party integration. [Refer Integration guide](/docs/inbox-overview) to setup Inbox Channel.
3. Channel information should be available in user profile and channel status should be active. Template channels not available in user profile are skipped for delivery. A set channel becomes inactive in case the channel is`removed `or `unset`using [SDK or API](/docs/users#via-sdk) or it is marked inactive by SuprSend.
4. User preference is`opt-in `for the given channel and notification category (defined in workflow settings). You can check user preference status using [get user preference API](/reference/get-user-category-preferences).

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
      "channels": ["email","inbox]
    }
  ```


> **Warning:**
  * If both selected channels and override channels key are set in the form, system will prioritize the override channels, even if that channel is not included in the selected channel list.
  * When the override channel variable in the event data is missing, or resolves to an invalid value, workflow execution will stop and corresponding error will be logged in the logs


## Success Metric

Success Metric can be any event which defines the target user activity you aim to drive with your sent notification. e.g., if the objective of your notification is to prompt users to open it, such as in the case of newsletters, you can set your success metric as `Notification Status - Seen`. If your goal is for users to perform any custom event, like complete payment in case of payment reminder notification, then you can set that event as your success metric.


In the context of multi-channel delivery, the success metric is utilized solely to track conversion numbers for display in workflow analytics. However, in the case of [smart channel routing](/docs/smart-delivery), the same success metric serves to halt delivery on further channels once the success metric is achieved.

***

## Smart Channel Routing Node

**Schema `node_type`:** `send_smart_channel_routing`

Sends sequentially across channels with delays until the user engages on one channel.

### Documentation — Smart Channel Routing

# Smart Channel Routing

> Send multi-channel notifications sequentially with a delay between each channel to reduce bombarding.

Smart Channel Routing is an optimal way of sending multi-channel notifications without bombarding your users. In case of smart routing, you send notification sequentially on channels with a delay rather than bombarding users on all channels at once. Example, If you have a template with 4 channels, the delivery on rest of the channels are skipped if the user sees or interacts with the message on 1 channel. This way, you can achieve the uptick in engagement (delivery, seen and interaction rate) without unnecessary noise and also save cost of paid notification channels.

The content of the notification is designed with [templates](/docs/templates). In SuprSend, you can design the content of multiple channels within a single template group.

## How Smart Channel Routing node is executed?


  **Identify Applicable Channels**
    The First step is to identify applicable channels for delivery in user profile. Applicable channels are the subset of the following:

    * **Active channels on template**

      Active channels are published and live channels in the template. For WhatsApp and SMS (Indian vendors), templates become live upon approval by the respective provider.
    * **Active channels in user profile**

      Available channels in user profile which are not marked inactive. A set channel becomes inactive in case the channel is`removed `or`unset`using [SDK or API](/docs/users#via-sdk) or it is marked inactive by SuprSend.
    * **Channels where user preference is set as opt-in**

      If you are using SuprSend preference centre to take user preferences, check if the user preference is`opt-in`for the given channel and notification category (defined in workflow settings). You can check user preference using [get user preference API](/reference/get-user-category-preferences).
  

  **Finalize channel order using routing rule**
    Currently, the order of channel is defined to [optimize on](/docs/smart-delivery#optimize-on) cost (channels are tried from low to high cost picked from their vendor form). We'll also be introducing options to optimize on engagement so that notifications is sent on the channel with higher chances of open and click first.
  

  **Send notification with delay between each trigger using time to live**
    Now, the **notification will be delivered on each channel in the order with** [time-interval](/docs/smart-delivery#time-to-live) **\[time_to_live / (number_of_channels - 1)] apart** . e.g., if you have 3 active channels with time to live of 1 hour, notification will be delivered to each channel at 30 minutes apart till the [success metric](/docs/smart-delivery#success-metric) is not achieved. Once success metric is achieved, notification delivery on further channels is skipped.
  


## Setting routing rules

Routing rules define how the notifications will be routed across channels.

### Optimize on

This is used to define the order of channels based on the metric that you want to optimize. e.g., if you want to optimize on cost, SuprSend will internally set the order of channel in the ascending order of cost where the lowest cost channel is tried first.

> We'll be introducing the option to manually set the channel order and optimize on other metrics like engagement.

### Time to live

Time to live defines the delay in delivery between 2 subsequent channels. Notification will be delivered on each channel in the order with time-interval of \[time_to_live / (number_of_channels - 1)] apart. e.g., if you 3 channels with time to live of 1 hour, notification will be delivered to each channel at 20 minutes apart till the success metric is achieved.

### Must send to

These are the channels on which notification has to be sent immediately, irrespective of the channel order.

### Success Metric

Success Metric can be any event which defines the target user activity that you want to drive with your sent notification. In case of channel routing, it stops delivery on further channels when success metric is achieved. You can define 2 types of success metrics:

1. **Notification Status**

   Success Metric can be notification status (delivery, seen, interaction / click) of any of the sent channels. e.g., if the target of your notification is user opening the notification, you can set your success metric as `Notification Status - Seen`.
2. **Custom Event**

   It can be any other custom event that you want your user to perform on the platform in response to the sent notification. e.g., in case of payment reminder notification, you can set the success metric as`Invoice Paid`.

## Override Channels

You can use this field to pass channel list dynamically using data in your event property. This feature comes in handy when user channels are dynamically defined at the user level for each workflow. For instance, when booking an appointment, your users are dynamically defining their preferred channel to receive booking updates for each appointment.

For more consistent channel preferences, like user wanting to receive all communication via email only, or defining preferred communication channel for a notifications category (like booking updates), we recommend updating it using [user preferences](/docs/user-preferences).

To override channels, include the channels array in event property and add the corresponding key in the override channels field on SuprSend workflow form.

The expected channel values are: `["email", "sms", "whatsapp", "androidpush", "iospush", "webpush", "slack", "inbox", "ms_teams"]`

You can add channel array as a [JQ-expression](https://jqlang.github.io/jq/manual/). So, in case your channel values do not match with the one mentioned in the above table, you can transform it using the JQ-expression. Below are some examples of how to add duration key in JQ format:

1. General format for duration key at parent level is`.channels`
2. If channel is a nested event property key like shown below, enter it in the format `.user.channels`.


  ```json json theme={"system"}
  properties = {
    "user": {
      "name": "Steve",
      "channels": ["email","inbox]
    }
  ```


> **Warning:**
  When the channel key specified is missing, or resolves to an invalid value, workflow execution will stop and corresponding error will be logged in the logs


***

## Frequently Asked Questions


  ### How channel routing works when a user has multiple identities of the same channel. e.g., if there are multiple email ids in a user profile?
    Routing happens at channel identity level. So, if there are multiple email ids, notification will be sent to one email id and then on another after a delay.
  

  ### How does channel routing work if I have vendor routing enabled as well?
    Vendor routing is independent of channel routing and doesn't add to the delay in channel routing.
  


***

## Schema Properties (shared by all delivery nodes)

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| template | string | Yes | slug of template used for notification content |
| channels | array | No | specific channels to use when sending multi-channel notification |
| channels_expr | string | No | jq-expression for preparing channel list, if channels are to be derived at runtime using payload |
| success | string | No | success metric (delivered/seen/interaction/<user-event>) |
| mandatory_channels | array | No | applicable for smart-channel-routing, notification on mandatory channels will be sent immediately |
| ttl_value | string | No | Duration format ([xx]d[xx]h[xx]m[xx]s) examples [30s, 1m, 1m30s, 1d3h45m] |

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
    "mandatory_channels": ["inbox"],
    "success": "seen"
  }
}
```
