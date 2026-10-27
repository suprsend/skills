---
name: suprsend-template-schema
description: "JSON schema for authoring or editing SuprSend template variants (channel + locale + tenant + content). Loads the variant envelope, per-channel content schemas, and Handlebars/JSONNET syntax references needed to write valid template JSON. Covers all 9 channels: email, sms, whatsapp, inbox, slack, ms_teams, androidpush, iospush, webpush. Use ONLY when the user wants the agent to create, modify, or edit a template variant (e.g. \"build an SMS variant\", \"add a French locale\", \"create a tenant-specific welcome email\"). Do NOT load for documentation, lookup, or conceptual questions (\"what is a variant\", \"how does templating work\", \"explain WhatsApp templates\") — load suprsend-docs-support for those."
metadata:
  author: "suprsend"
  category: "templates"
---

SuprSend templates define the content of a notification — the subject and body of an email, the text of an SMS, the layout of an in-app inbox message, and so on. Templates are channel-aware and locale-aware.

Internally, every template is modeled as a collection of **variants**. A variant pairs a channel, locale, optional tenant, and optional condition with channel-specific content. Enabling a channel auto-creates its reserved **`default`** variant (`id: "default"`, `locale: "en"`, `tenant_id: null`, no conditions) — a simple template is just that one variant with its content filled in. Adding more locales, more tenants, or conditional content means adding more variants under the same template.

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

## Tenant variables

Templates reference tenant properties through **`$tenant`**. Always emit `$tenant.*` in new or edited content. `$brand.*` is the legacy name for the same object — existing templates that use it still render, but never author new `$brand.*` references. When editing a template that uses `$brand.*`, migrate it to `$tenant.*` (and `brand_id` / `brand_name` to `id` / `name`).

There are three shapes — use the right one for each case:

### 1. Reserved `$tenant.*` keys

These are the only keys valid directly under `$tenant.`. Any other key belongs under `$tenant.properties.` (see below). Handlebars renders in strict mode, so a key that doesn't exist — `{{$tenant.<key>}}` or `{{$tenant.properties.<key>}}` — fails the render, in preview and at send time.

| Variable | Renders |
| --- | --- |
| `{{$tenant.id}}` | Tenant id (slug) |
| `{{$tenant.name}}` | Tenant display name |
| `{{$tenant.logo}}` | Tenant logo URL |
| `{{$tenant.primary_color}}` | Primary brand color |
| `{{$tenant.secondary_color}}` | Secondary brand color |
| `{{$tenant.tertiary_color}}` | Tertiary brand color |
| `{{$tenant.timezone}}` | Tenant timezone |
| `{{$tenant.embedded_preference_url}}` | Tenant-level embedded preference URL |
| `{{$tenant.hosted_preference_domain}}` | Tenant-level hosted preference domain |
| `{{$tenant.blocked_channels}}` | List of channels blocked for the tenant |
| `{{$tenant.parent_id}}` | Parent tenant id ([sub-tenants](https://docs.suprsend.com/docs/sub-tenants)); empty for a root tenant |
| `{{$tenant.level}}` | Depth in the sub-tenant tree (`0` = root) |
| `{{$tenant.ancestors}}` | Ancestor tenant ids, root first (excludes the tenant itself) |
| `{{$tenant.social_links.<network>}}` | Tenant social link. Built-in `<network>` keys: `x`, `twitter`, `facebook`, `instagram`, `linkedin`, `youtube`, `tiktok`, `discord`, `telegram`, `medium`, `website` |

`brand_id` / `brand_name` and `tenant_id` / `tenant_name` still resolve as legacy aliases of `id` / `name` — never emit them in new content. For sub-tenants, branding and `properties` are inherited per key from the closest ancestor that sets them; `blocked_channels` accumulate across ancestors; `id` and `name` are never inherited. Template **variants are not inherited** — a variant's `tenant_id` matches only that exact tenant.

### 2. Custom tenant properties — `$tenant.properties.<key>`

Any property the customer adds on the tenant object that is **not** in the reserved list above is a custom property, and the correct shape is `{{$tenant.properties.<key>}}`. Common examples:

- `{{$tenant.properties.address}}`
- `{{$tenant.properties.unsubscribe_url}}`
- `{{$tenant.properties.support_url}}`
- `{{$tenant.properties.support_email}}`

If you don't recognise the key from the reserved list, default to `$tenant.properties.<key>`. For an optional key use `{{default $tenant.properties.<key> "fallback"}}` — this only works when the tenant's `properties` is an object; if `properties` is null the render still fails.

### 3. Preference-page URLs (top-level `$`, not under `$tenant`)

These are injected at send time as top-level variables, not nested under `$tenant`:

- `{{$hosted_preference_url}}` — signed link to the SuprSend-hosted preference / unsubscribe page for this notification's recipient. Substituted in **email and SMS** content only.
- `{{$embedded_preference_url}}` — your embedded preference page URL: the tenant's `embedded_preference_url`, falling back to the organization-level setting.
- `{{$hosted_preference_domain}}` — the hosted preference page domain: the tenant's `hosted_preference_domain`, falling back to the organization-level setting. Resolved at send time; the dashboard preview data doesn't include it.

`{{$tenant.$hosted_preference_url}}` does not resolve. `$tenant.embedded_preference_url` and `$tenant.hosted_preference_domain` are the tenant's own values (inherited from ancestors for sub-tenants; no live organization fallback — a root tenant created without them gets a copy of the organization values at creation, and later organization changes don't propagate) — prefer the top-level variables when linking recipients to their preferences.

### Common anti-patterns — never emit these

| Wrong | Correct |
| --- | --- |
| `{{$brand.<key>}}` (any key) | `{{$tenant.<key>}}` — `$brand` is the legacy namespace |
| `{{$tenant.brand_name}}`, `{{$brand.brand_name}}` | `{{$tenant.name}}` |
| `{{$tenant.brand_id}}`, `{{$brand.brand_id}}` | `{{$tenant.id}}` |
| `{{$tenant.support_url}}` | `{{$tenant.properties.support_url}}` |
| `{{$tenant.unsubscribe_url}}` | `{{$tenant.properties.unsubscribe_url}}` |
| `{{$tenant.address}}` | `{{$tenant.properties.address}}` |
| `{{$tenant.$hosted_preference_url}}` | `{{$hosted_preference_url}}` (per-recipient link) *or* `{{$hosted_preference_domain}}` (tenant domain, org fallback) — pick based on intent |

For the full multi-tenant variant model and per-tenant overrides, see [Multi-tenant Variants](references/multi-tenant-variants.md).

## Authoring Variants

Every variant must specify `channel`, `id`, `tenant_id`, `locale`, and `conditions` — even when not using multi-tenant or conditional features (use `null` where applicable). The `content` object is validated against the channel-specific schema.

**Base content goes in the reserved `default` variant.** Enabling a channel auto-creates it with `locale: "en"`, `tenant_id: null`, no conditions; only its `content` (and `needs_vendor_approval`) can be changed. Never create a second variant with that same `locale` + `tenant_id` + `conditions` combination — it is rejected as a duplicate of `default`.

Minimum shape:

```json
{
  "$schema": "https://schema.suprsend.com/template/v2/variant_schema.json",
  "channel": "email",
  "id": "default",
  "tenant_id": null,
  "locale": "en",
  "conditions": null,
  "content": { /* channel-specific — see channel reference */ }
}
```

**Target a tenant with the variant's `tenant_id` field and a language with its `locale` field — never with `conditions`.** A condition on `tenant_id` reads the trigger payload, there is no `in` operator, and one variant targets exactly one tenant. Channels are enabled per template, not per variant: each channel picks its own variant, so a channel with no variant for the tenant still sends its tenant-less content.

Only `id`, `locale`, `tenant_id`, `conditions`, `needs_vendor_approval`, and `content` are written when a variant is saved. `seq_no` (priority) is set by the template's variant order and `vendor_approvals` are managed per vendor — don't put either in variant JSON you author.

See the [Template Schema Guide](references/template-schema-guide.md) for the variant envelope, selection rules, and complete examples.

For multi-variant patterns, see:

- [Multi-tenant Variants](references/multi-tenant-variants.md) — different content per tenant
- [Multi-lingual Variants](references/multi-lingual-variants.md) — translation keys vs. per-locale variants (translation keys only render when translations are enabled for the account and published)

For the template syntax used inside content fields, see:

- [Handlebars Helpers](references/handlebars-helpers.md) — variables, conditionals, comparisons, date/array helpers. Default for every channel.
- [JSONNET Syntax](references/jsonnet-syntax.md) — always used for Slack `body_block` and MS Teams `body_card` (`body_type: "block"` / `"card"` forces `templating_language: "jsonnet"`).

**Escaping:** default to `{{ }}`. It HTML-escapes its output (`&` → `&amp;`, `'` → `&#x27;`, `=` → `&#x3D;`), which keeps HTML outputs (email HTML body, Inbox body) safe from injected markup. Use triple braces `{{{ }}}` only where HTML escaping isn't needed — SMS, push, WhatsApp, Slack text mode, Inbox header / subtext / URLs, and the email subject, preheader and plain-text part. SuprSend never unescapes, so `{{ }}` there delivers `O&#x27;Brien`.

## Validation warnings

Validating content before you save it returns, besides `errors`, a per-variant `warnings` list: variables the mock data does not resolve (for example `$recipient.coin_balance` when the test recipient has no `coin_balance`). Warnings do **not** make the template invalid, but an unresolved variable renders empty at send time, so treat each one as something to fix — supply the value (a `payload` key, or a recipient whose profile has the property) or adjust the content. Give the mock data in the stored shape: plain variables under `payload`, and the test recipient/actor as `recipient_distinct_id` / `actor_distinct_id`.

## Related skills

- **`suprsend-workflow-schema`** — workflow delivery nodes (`send_email`, `send_multi_channel`, etc.) reference variants by `template` slug. Use it for the workflow shape that wraps these variants.
- **`suprsend-cli`** — `suprsend template push` / `pull` / `commit` / `get` / `list` are the commands that move variant JSON between your editor and a SuprSend workspace.
