---
name: suprsend-template-schema
description: "SuprSend template schema reference for creating, modifying, or understanding notification template content. A template is composed of one or more variants — each variant has a channel, locale, optional tenant, optional conditions, and channel-specific content. Lists the variant envelope and per-channel content schemas (email, sms, whatsapp, inbox, slack, ms_teams, androidpush, iospush, webpush)."
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
