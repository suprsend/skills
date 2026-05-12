# Slack Content Schema

For variants with `channel: "slack"`.

**Schema URL:** `https://schema.suprsend.com/template/v2/channel/slack_schema.json`

## Fields

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| $schema | string | No |  |
| templating_language | string | No |  |
| body_type | string | Yes |  |
| body_text | string | No | message body if body_type='text' |
| body_block | string | No | message body if body_type='block' |

`body_type` is required. When `body_type` is `text`, `body_text` is required. When `body_type` is `block`, `body_block` is required.

### `templating_language` values

- `handlebars`
- `jsonnet`

- `handlebars` — string interpolation in `body_text` / `body_block` content.
- `jsonnet` — evaluate `body_block` as a Jsonnet expression that produces the Slack `blocks` JSON.

### `body_type` values

- `text`
- `block`

- `text` — `body_text` is a plain message string.
- `block` — `body_block` is a JSON string conforming to Slack's [Block Kit](https://api.slack.com/block-kit) spec.

## Examples

### Plain text message

```json
{
  "body_type": "text",
  "body_text": "Build failed for {{ repo }} on branch {{ branch }} — {{ commit.author }} broke main"
}
```

### Block Kit message

```json
{
  "body_type": "block",
  "body_block": "{\"blocks\":[{\"type\":\"section\",\"text\":{\"type\":\"mrkdwn\",\"text\":\"*Build failed* in {{ repo }}\"}},{\"type\":\"actions\",\"elements\":[{\"type\":\"button\",\"text\":{\"type\":\"plain_text\",\"text\":\"View logs\"},\"url\":\"{{ build.log_url }}\"}]}]}"
}
```

### Jsonnet-templated blocks

```json
{
  "templating_language": "jsonnet",
  "body_type": "block",
  "body_block": "{ blocks: [{ type: 'section', text: { type: 'mrkdwn', text: '*Build failed* in ' + data.repo } }] }"
}
```

## Documentation

```
# Slack

> Design Slack notification templates using the Text editor for simple messages or the JSONNET editor for rich Block Kit layouts.

The Slack editor supports two modes: a **Text** editor for simple messages, and a **JSONNET** editor for rich [Block Kit](https://api.slack.com/block-kit) layouts with buttons, images, and structured sections.


> **Note:**
  To send Slack notifications, you need a Slack vendor integrated with SuprSend. See [Slack vendor integration](/docs/slack) for setup.


## Slack fields

**Text mode** — a single text field. Supports [Handlebars](/docs/handlebars-helpers) variables (`{{variable_name}}`). Use triple braces `{{{url}}}` for URLs with special characters.

**JSONNET mode** — a code editor that outputs [Slack Block Kit](https://api.slack.com/block-kit) JSON. Variables use `data.key` syntax (not Handlebars). Design visually in the [Block Kit Builder](https://app.slack.com/block-kit-builder/) first, then adapt the JSON into JSONNET. See the full [JSONNET reference](/docs/jsonnet-templates) for syntax, examples, and debugging.

<Tip>
  **AI prompt — convert text to Block Kit:** *"Convert this Slack notification into Block Kit JSON: \[paste message]. Variables: \[list]. Return valid JSON I can adapt into JSONNET for SuprSend (replacing values with data.key)."*
</Tip>

<Tip>
  **AI prompt — debug JSONNET:** *"Fix this JSONNET error from the SuprSend Slack editor. Error: \[paste error]. Code: \[paste JSONNET]. Variables are accessed as data.key or data\['\$special_key']."*
</Tip>

<Info>
  You can switch between Text and JSONNET at any time. Content is saved independently for each mode.
</Info>

## Adding dynamic content

**In Text mode** — type `{{` for auto-suggestions. Standard Handlebars syntax:

* `{{order_id}}` — top-level variable
* `{{order.address.city}}` — nested variable
* `{{{tracking_url}}}` — URL (avoid escaping)
* `{{$recipient.name}}` — recipient property
* `{{$brand.brand_name}}` — tenant property

**In JSONNET mode** — variables use `data.key` syntax. See [JSONNET variable reference](/docs/jsonnet-templates#variable-syntax) for the full table.

For conditionals, loops, and helpers in Text mode, see [Handlebars Helpers](/docs/handlebars-helpers).

> **Warning:**
  If a variable cannot be rendered at send time (missing or mismatched data), SuprSend discards the Slack notification for that user. Other channels in the same template group are still sent.


## Preview and test

**Text mode** — the right panel shows a Slack message preview. It does not update automatically — **refresh the page** to see the latest changes.

**JSONNET mode** — preview is not available in the editor. Click **View on Slack Builder** to render and validate your Block Kit output in Slack's [Block Kit Builder](https://app.slack.com/block-kit-builder/).

Click **Test** in the top-right corner to send a real Slack message. This uses the **live version** — commit your changes before testing. See [Testing a Template](/docs/templates#test) for the full guide.

## Commit

Click **Commit** in the top bar to publish the current draft as a new live version. Add an optional description for versioning.

## Common patterns


  ### Thread-aware notifications
    Slack automatically threads messages sent to the same channel with the same `thread_ts`. Pass a consistent `thread_ts` in your trigger payload to keep related messages threaded.
  

  ### Mentioning users
    Use `<@SLACK_USER_ID>` to @mention a user. Pass the ID as a variable: `<@{{assignee_slack_id}}>`.
  

  ### Linking to resources
    Slack uses `<URL|display text>` syntax. In JSONNET: `"*<" + data.url + "|" + data.title + ">*"`.
  

  ### Emoji
    Use `:emoji_name:` syntax (e.g., `:white_check_mark:`, `:warning:`).
  


## Frequently asked questions


  ### Text or JSONNET — which should I use?
    Start with Text for simple alerts and status updates. Switch to JSONNET when you need buttons, images, structured layouts, or batched event lists.
  

  ### How do I validate my Block Kit JSON?
    Click **View on Slack Builder** in the JSONNET editor. Slack silently drops invalid blocks instead of showing errors — always validate before committing.
  

  ### What's the message length limit?
    Slack truncates messages over 4000 characters. For batched notifications with many items, show the top 5-10 and add a "View all" button.
  

  ### What formatting does Slack support?
    Slack uses `mrkdwn`, not standard Markdown. Bold: `*text*`, italic: `_text_`, strikethrough: `~text~`, code: triple backticks.
  

  ### What happens if a variable is missing at send time?
    SuprSend discards the Slack notification for that user. Other channels in the same template group are still sent.
```
