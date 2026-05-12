---
name: suprsend-template-schema
description: "JSON schema for authoring or editing SuprSend template variants (channel + locale + tenant + content). Loads the variant envelope, per-channel content schemas, and Handlebars/JSONNET syntax references needed to write valid template JSON. Covers all 9 channels: email, sms, whatsapp, inbox, slack, ms_teams, androidpush, iospush, webpush. Use ONLY when the user wants the agent to create, modify, or edit a template variant (e.g. \"build an SMS variant\", \"add a French locale\", \"create a tenant-specific welcome email\"). Do NOT load for documentation, lookup, or conceptual questions (\"what is a variant\", \"how does templating work\", \"explain WhatsApp templates\") — load suprsend-docs-support for those."
metadata:
  author: "suprsend"
  category: "templates"
---

SuprSend templates define the content of a notification — the subject and body of an email, the text of an SMS, the layout of an in-app inbox message, and so on. Templates are channel-aware and locale-aware.

Internally, every template is modeled as a collection of **variants**. A variant pairs a channel, locale, optional tenant, and optional condition with channel-specific content. Even a simple template with no multi-tenant or multi-language requirements is just one variant — usually `tenant_id: null`, `locale: "en"`, `conditions: null`. Adding more locales, more tenants, or conditional content means adding more variants under the same template.

Each variant validates against `https://schema.suprsend.com/template/v2/variant_schema.json`. The `content` object inside a variant validates against a channel-specific schema selected by the `channel` field.


For a complete guide on the variant envelope and how variants compose into a template, see [Template Schema Guide](references/template-schema-guide.md).

## Channels

A variant's `channel` field selects which content schema applies. Pick the reference for the channel you are authoring.

| Channel | Variant `channel` | Reference |
|---|---|---|
| Email | `email` | [Email content schema](references/channel-email.md) |
| SMS | `sms` | [SMS content schema](references/channel-sms.md) |
| WhatsApp | `whatsapp` | [WhatsApp content schema](references/channel-whatsapp.md) |
| In-app Inbox | `inbox` | [Inbox content schema](references/channel-inbox.md) |
| Slack | `slack` | [Slack content schema](references/channel-slack.md) |
| Microsoft Teams | `ms_teams` | [MS Teams content schema](references/channel-ms-teams.md) |
| Android Push | `androidpush` | [Android push content schema](references/channel-androidpush.md) |
| iOS Push | `iospush` | [iOS push content schema](references/channel-iospush.md) |
| Web Push | `webpush` | [Web push content schema](references/channel-webpush.md) |

## Authoring Variants

Every variant must specify `channel`, `id`, `tenant_id`, `locale`, and `conditions` — even when not using multi-tenant or conditional features (use `null` where applicable). The `content` object is validated against the channel-specific schema.

Minimum shape:

```json
{
  "$schema": "https://schema.suprsend.com/template/v2/variant_schema.json",
  "channel": "email",
  "id": "default-en",
  "tenant_id": null,
  "locale": "en",
  "conditions": null,
  "content": { /* channel-specific — see channel reference */ }
}
```

See the [Template Schema Guide](references/template-schema-guide.md) for the variant envelope, selection rules, and complete examples.

For multi-variant patterns, see:

- [Multi-tenant Variants](references/multi-tenant-variants.md) — different content per tenant/brand
- [Multi-lingual Variants](references/multi-lingual-variants.md) — translation keys vs. per-locale variants

For the template syntax used inside content fields, see:

- [Handlebars Helpers](references/handlebars-helpers.md) — variables, conditionals, comparisons, date/array helpers. Default for every channel.
- [JSONNET Syntax](references/jsonnet-syntax.md) — alternative for Slack `body_block` and MS Teams `body_card` when `templating_language: "jsonnet"`.

## Related skills

- **`suprsend-workflow-schema`** — workflow delivery nodes (`send_email`, `send_multi_channel`, etc.) reference variants by `template` slug. Use it for the workflow shape that wraps these variants.
- **`suprsend-cli`** — `suprsend template push` / `pull` / `commit` / `get` / `list` are the commands that move variant JSON between your editor and a SuprSend workspace.
