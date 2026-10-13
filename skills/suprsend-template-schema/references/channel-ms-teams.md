# Microsoft Teams Content Schema

For variants with `channel: "ms_teams"`.

**Schema URL:** `https://schema.suprsend.com/template/v2/channel/ms_teams_schema.json`

## Fields

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| $schema | string | No |  |
| templating_language | string | No |  |
| body_type | string | Yes |  |
| body_text | string | No | message body if body_type='text' |
| body_card | string | No | message body if body_type='card' |

`body_type` is required. When `body_type` is `text`, `body_text` is required. When `body_type` is `card`, `body_card` is required.

### `templating_language` values

- `handlebars`
- `jsonnet`

### `body_type` values

- `text`
- `card`

- `text` — `body_text` is a plain message string, rendered with Handlebars.
- `card` — `body_card` is a JSONNET expression producing an [Adaptive Card](https://learn.microsoft.com/en-us/adaptive-cards/).

The pairing is enforced: `body_type: "card"` forces `templating_language: "jsonnet"` and `"text"` forces `"handlebars"`. Reference variables in `body_card` as `data.key` — Handlebars `{{ }}` inside a card is sent as literal text.

## Examples

### Plain text message

```json
{
  "body_type": "text",
  "body_text": "Deployment {{ deploy.id }} succeeded in {{ environment }}"
}
```

### Adaptive Card (JSONNET)

```json
{
  "templating_language": "jsonnet",
  "body_type": "card",
  "body_card": "{ \"$schema\": \"http://adaptivecards.io/schemas/adaptive-card.json\", \"type\": \"AdaptiveCard\", \"version\": \"1.4\", \"body\": [ { \"type\": \"TextBlock\", \"size\": \"Medium\", \"weight\": \"Bolder\", \"text\": \"Deployment succeeded\" }, { \"type\": \"TextBlock\", \"text\": data.deploy.id + \" → \" + data.environment } ], \"actions\": [ { \"type\": \"Action.OpenUrl\", \"title\": \"View deploy\", \"url\": data.deploy.url } ] }"
}
```

## Documentation

```
# MS Teams

> Design MS Teams notification templates using the Markdown editor for simple messages or the JSONNET editor for rich Adaptive Card layouts.

The MS Teams editor supports two modes: a **Markdown** editor for simple text messages, and a **JSONNET** editor for rich [Adaptive Card](https://adaptivecards.io/) layouts with buttons, images, and structured data. Each mode uses a different variable syntax.


> **Note:**
  To send MS Teams notifications, start from [Microsoft Teams](/docs/microsoft-teams) and set up the vendor from [Create a Teams app](/docs/microsoft-teams-create-app).


> **Warning:**
  **Sending through a [webhook](/docs/microsoft-teams-incoming-webhook)?** Use the JSONNET editor with card version `1.4` or `1.5`. A webhook doesn't show Markdown messages, and cards at `1.6` show "We're sorry, this card couldn't be displayed". Logs still show the message as delivered in both cases.


## MS Teams fields

**Markdown mode** - a text editor with Markdown formatting support. Variables use [Handlebars](/docs/handlebars-helpers) syntax (`{{variable_name}}`). Supported formatting:

| Format | Syntax |
| - | - |
| **Bold** | `**text**` |
| *Italic* | `*text*` |
| `Code` | `` `code` `` |
| Link | `[label](url)` |
| Blockquote | `> text` |

**JSONNET mode** - a code editor that outputs [Adaptive Card](https://adaptivecards.io/) JSON. Variables use `data.key` syntax (not Handlebars). Design visually in the [Adaptive Cards Designer](https://adaptivecards.io/designer/) first, then adapt the JSON into JSONNET. Use `FactSet` for key-value data and `Action.OpenUrl` for link buttons. See the full [JSONNET reference](/docs/jsonnet-templates) for syntax, examples, and debugging.

<Tip>
  **AI prompt - convert to Adaptive Card:** *"Convert this notification into a Teams Adaptive Card JSON: \[paste message]. Variables: \[list]. Actions: \[describe buttons]. Return valid Adaptive Card JSON (v1.4+) I can adapt into JSONNET for SuprSend."*
</Tip>

<Tip>
  **AI prompt - debug JSONNET:** *"Fix this JSONNET error from the SuprSend Teams editor. Error: \[paste error]. Code: \[paste JSONNET]. Variables are accessed as data.key or data\['\$special_key']."*
</Tip>


Enter the variables in `JSON` format as shown in the screenshot below. This JSON should be the same as passed in your workflow or event request (it is a part of the `data` field for workflow and `properties` field for event).


<Info>
  You can switch between Markdown and JSONNET at any time. Content is saved independently for each mode.
</Info>

## Adding dynamic content

**In Markdown mode** - type `{{` for auto-suggestions. Standard Handlebars syntax:

* `{{order_id}}` - top-level variable
* `{{order.address.city}}` - nested variable
* `{{{tracking_url}}}` - URL (avoid escaping)
* `{{$recipient.name}}` - recipient property

**In JSONNET mode** - variables use `data.key` syntax. See [JSONNET variable reference](/docs/jsonnet-templates#variable-syntax) for the full table.

For conditionals and helpers in Markdown mode, see [Handlebars Helpers](/docs/handlebars-helpers).

> **Warning:**
  If a variable cannot be rendered at send time (missing or mismatched data), SuprSend discards the Teams notification for that user. Other channels in the same template group are still sent.


## Preview and test

**Markdown mode** - the right panel updates in real time as you type.

**JSONNET mode** - click **Load Preview** to render the Adaptive Card. Syntax errors are displayed in red in the preview panel.

Click **Test** in the top-right corner to send a real Teams message. This uses the **live version** - commit your changes before testing. See [Testing a Template](/docs/templates#test) for the full guide.

## Commit

Click **Commit** in the top bar to publish the current draft as a new live version. Add an optional description for versioning.

## Common scenarios


  ### Deployment status alert (Markdown)
    ```text theme={"system"}
    **Deployment Completed**

    Service: {{service_name}}
    Environment: {{environment}}
    Version: {{version}}
    Duration: {{duration}}

    [View Logs]({{log_url}})
    ```

    Simple and effective for DevOps alerts. Markdown is sufficient when the notification is informational with a single link.
  

  ### Approval request (Adaptive Card)
    Use `FactSet` for structured data and `Action.OpenUrl` for CTA buttons. See the full [Adaptive Card example](/docs/jsonnet-templates#ms-teams-adaptive-card-examples) in the JSONNET reference.
  


## Frequently asked questions


  ### Markdown or JSONNET - which should I use?
    For a bot, start with Markdown for plain-text messages with links, and switch to JSONNET when you need images, buttons, columns, or structured layouts (FactSets, ActionSets). For a webhook, always use JSONNET.
  

  ### What Adaptive Card version should I use?
    For a bot, use version `1.6` for the widest feature support across Teams desktop and mobile. For a webhook, use `1.4` or `1.5` — `1.6` isn't displayed.
  

  ### What's the message size limit?
    Teams truncates Adaptive Cards larger than 28 KB. Keep payloads lean, especially when iterating over arrays.
  

  ### Why does my card look different in Teams vs the designer?
    Teams has its own rendering engine. The [Adaptive Cards Designer](https://adaptivecards.io/designer/) is an approximation. Always test in an actual Teams chat before committing.
  

  ### What happens if a variable is missing at send time?
    SuprSend discards the Teams notification for that user. Other channels in the same template group are still sent.
  


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
```
