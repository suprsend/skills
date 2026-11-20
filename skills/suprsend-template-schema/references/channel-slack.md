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

**Length limits:** `body_text` max 4000 characters, `body_block` (the JSONNET source) max 13200. Longer values fail validation on save. Slack itself rejects a section `text` over 3000 characters with `invalid_blocks` and the send fails, so in practice keep `body_text` and each section's text under 3000.

### `templating_language` values

- `handlebars`
- `jsonnet`

- `handlebars` — used with `body_type: "text"`: Handlebars interpolation in `body_text`.
- `jsonnet` — used with `body_type: "block"`: `body_block` is evaluated as a Jsonnet expression that produces the Slack `blocks` JSON.

The pairing is enforced: `body_type: "block"` forces `templating_language: "jsonnet"` and `"text"` forces `"handlebars"`. Handlebars `{{ }}` inside `body_block` is **not** rendered — it is sent as literal text.

### `body_type` values

- `text`
- `block`

- `text` — `body_text` is sent as one Slack section of type **`plain_text`**. mrkdwn (`*bold*`, `_italic_`), `<@U123>` mentions and `<url|text>` links show up **literally**; only emoji shortcodes (`:tada:`) render. Use `block` for any formatting, mentions or links.
- `block` — `body_block` is a JSONNET expression whose output conforms to Slack's [Block Kit](https://docs.slack.dev/block-kit/) spec.

## Default mode: JSONNET (Block Kit)

**For all new Slack templates, generate JSONNET by default.** Block Kit is Slack's native rich format — text mode wastes channel capabilities.

Use Text mode ONLY when:

- User explicitly asks for "plain text" or "simple text"
- Notification is a true one-liner with no CTA, no formatting, no mentions and no links
- Migrating an existing text template

Use JSONNET if ANY of these are present:

- CTA / action link → button block
- Bold/italic, `<url|text>` links or `<@U123>` mentions → `mrkdwn` text objects (Text mode can't render them)
- 2+ sections → section blocks + divider
- Key-value data → fields array
- Recipient/tenant personalization
- Batched/digest events → a `rich_text` block containing a `rich_text_list` element (`rich_text_list` is not a top-level block), or one `section` per item

### Critical format rule

JSONNET output MUST be wrapped in `{ "blocks": [...] }`. The bare-array format `[{...}, {...}]` will fail — SuprSend's renderer requires the JSONNET output to be a JSON object.

Only the `blocks` array is sent. Any other top-level key (`text`, `attachments`, `thread_ts`, …) is dropped, and each message is posted as a new message (threading replies isn't supported).

Invalid Block Kit isn't silently dropped: Slack rejects the whole message with `invalid_blocks` and the notification fails. Validate in Block Kit Builder before committing.

✅ Correct:

```jsonnet
{
  "blocks": [
    { "type": "section", "text": { "type": "mrkdwn", "text": "Hello" } }
  ]
}
```

❌ Incorrect:

```jsonnet
[
  { "type": "section", "text": { "type": "mrkdwn", "text": "Hello" } }
]
```

## Co-pilot output rules

When generating JSONNET for Slack, ALWAYS output:

1. The JSONNET template wrapped in `{ "blocks": [...] }`
2. Mock data JSON in a separate code block
3. The variant config: `{ "templating_language": "jsonnet", "body_type": "block" }`

NEVER output bare-array format `[ {...} ]`.

NEVER mix Handlebars `{{ }}` and JSONNET in the same template.

## Examples

### Plain text message

```json
{
  "body_type": "text",
  "body_text": "Build failed for {{{ repo }}} on branch {{{ branch }}} — {{{ commit.author }}} broke main"
}
```

### Block Kit message (JSONNET)

```json
{
  "templating_language": "jsonnet",
  "body_type": "block",
  "body_block": "{ \"blocks\": [ { \"type\": \"section\", \"text\": { \"type\": \"mrkdwn\", \"text\": \"*Build failed* in \" + data.repo } }, { \"type\": \"actions\", \"elements\": [ { \"type\": \"button\", \"text\": { \"type\": \"plain_text\", \"text\": \"View logs\" }, \"url\": data.build.log_url } ] } ] }"
}
```

## Documentation

**Verified behaviour (overrides the docs below):** Text mode is sent as `plain_text`, so no mrkdwn, mentions or links. Only the `blocks` key of the JSONNET output is sent. Invalid blocks fail the send with `invalid_blocks`; they are not truncated or silently dropped.

# Slack

> Design Slack notification templates in SuprSend using the Text editor for plain messages or the JSONNET editor for rich Block Kit layouts with live preview.

The Slack editor supports two modes: a **Text** editor for simple messages, and a **JSONNET** editor for rich [Block Kit](https://api.slack.com/block-kit) layouts with buttons, images, and structured sections.


Slack editor with JSONNET and live preview

> **Note:**
>
> To send Slack notifications, you need a Slack vendor integrated with SuprSend. See [Slack vendor integration](https://docs.suprsend.com/docs/slack.md) for setup.

## Slack fields

**Text mode** - a single text field, sent to Slack as `plain_text`: mrkdwn (`*bold*`), `<@U123>` mentions and `<url|text>` links show literally, so use JSONNET for any formatting. Supports [Handlebars](https://docs.suprsend.com/docs/handlebars-helpers.md) variables (`{{variable_name}}`). Use triple braces `{{{url}}}` for URLs with special characters.

**JSONNET mode** - a code editor that outputs [Slack Block Kit](https://api.slack.com/block-kit) JSON. Variables use `data.key` syntax (not Handlebars). Design visually in the [Block Kit Builder](https://app.slack.com/block-kit-builder/) first, then adapt the JSON into JSONNET. See the full [JSONNET reference](https://docs.suprsend.com/docs/jsonnet-templates.md) for syntax, examples, and debugging.

> **Warning:**
>
> Slack JSONNET templates must be wrapped in `{"blocks": [...]}`. A bare array of blocks will not render - see the [JSONNET reference](https://docs.suprsend.com/docs/jsonnet-templates.md#slack-block-kit-examples) for the correct shape.

> **Tip:**
>
> **AI prompt - convert text to Block Kit:** *"Convert this Slack notification into Block Kit JSON: \[paste message]. Variables: \[list]. Return valid JSON I can adapt into JSONNET for SuprSend (replacing values with data.key)."*

> **Tip:**
>
> **AI prompt - debug JSONNET:** *"Fix this JSONNET error from the SuprSend Slack editor. Error: \[paste error]. Code: \[paste JSONNET]. Variables are accessed as data.key or data\['\$special_key']."*

> **Note:**
>
> You can switch between Text and JSONNET at any time. Content is saved independently for each mode.

## Adding dynamic content

**In Text mode** - type `{{` for auto-suggestions. Standard Handlebars syntax:

* `{{order_id}}` - top-level variable
* `{{order.address.city}}` - nested variable
* `{{{tracking_url}}}` - URL (avoid escaping)
* `{{$recipient.name}}` - recipient property
* `{{$tenant.name}}` - tenant property

**In JSONNET mode** - variables use `data.key` syntax. See [JSONNET variable reference](https://docs.suprsend.com/docs/jsonnet-templates.md#variable-syntax) for the full table.

For conditionals, loops, and helpers in Text mode, see [Handlebars Helpers](https://docs.suprsend.com/docs/handlebars-helpers.md).

> **Warning:**
>
> If a variable cannot be rendered at send time (missing or mismatched data), SuprSend discards the Slack notification for that user. Other channels in the same template group are still sent.

## Preview and test

**Text mode** - the right panel shows a Slack message preview that updates as you type.

**JSONNET mode** - click **Load Preview** to render the JSONNET output in the preview panel, then click **View in Slack Block Kit** to render and validate your Block Kit output in Slack's [Block Kit Builder](https://app.slack.com/block-kit-builder/).

Click **Test** in the top-right corner to send a real Slack message. In the editor this uses the **draft version**; from the live view it uses the **live version**. See [Testing a Template](https://docs.suprsend.com/docs/templates.md#test) for the full guide.

## Commit

Click **Commit** in the top bar to publish the current draft as a new live version. Add an optional description for versioning.

## Common patterns

### Mentioning users

Use `<@SLACK_USER_ID>` in a JSONNET `mrkdwn` text object to @mention a user: `"<@" + data.assignee_slack_id + ">"`. Text mode is sent as plain text, so mentions don't render there.

### Linking to resources

Slack uses `<URL|display text>` syntax inside a `mrkdwn` text object (JSONNET mode only; Text mode shows it literally). In JSONNET: `"*<" + data.url + "|" + data.title + ">*"`.

### Emoji

Use `:emoji_name:` syntax (for example, `:white_check_mark:`, `:warning:`).

## Frequently asked questions

### Text or JSONNET - which should I use?

**Default to JSONNET.** Text mode is sent as `plain_text`, so mrkdwn, mentions and links show literally. Use Text only for unformatted one-liner alerts with no CTA, and JSONNET for everything else.

### How do I validate my Block Kit JSON?

Click **Load Preview**, then **View in Slack Block Kit** in the JSONNET editor to check the output in Slack's Block Kit Builder. To review it elsewhere, replace every `data.key` with its mock value, resolve the `+` concatenations, keep the `{ "blocks": [...] }` wrapper, then paste the JSON into Block Kit Builder. Slack does not silently drop invalid blocks: it rejects the whole message with `invalid_blocks` and the notification fails. Always validate before committing.

### Why isn't my Slack template rendering?

The most common reason is missing the `{"blocks": [...]}` wrapper. The SuprSend JSONNET editor only accepts the object form - a bare array (`[{...}]`) will not work. Wrap all your blocks inside a top-level object with a `blocks` key.

### What's the message length limit?

Slack does not truncate. A section `text` over 3000 characters is rejected with `invalid_blocks` and the notification fails. Text mode sends the whole body as one section, so keep `body_text` under 3000 characters (the template accepts up to 4000). The JSONNET source (`body_block`) is capped at 13200 characters on save. For batched notifications with many items, show the top 5-10 and add a "View all" button.

### What formatting does Slack support?

Slack uses `mrkdwn`, not standard Markdown, in JSONNET `mrkdwn` text objects. Bold: `*text*`, italic: `_text_`, strikethrough: `~text~`, code: triple backticks. Text mode messages are sent as plain text.

### What happens if a variable is missing at send time?

SuprSend discards the Slack notification for that user. Other channels in the same template group are still sent.
