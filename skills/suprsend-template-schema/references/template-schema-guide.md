# Template Schema Guide

A SuprSend template is a collection of **variants**. Each variant is a self-contained JSON document conforming to the variant schema, with its `content` validated against a per-channel schema chosen by the variant's `channel` field.

**Variant schema URL:** `https://schema.suprsend.com/template/v2/variant_schema.json`

## When is one variant enough?

If the template only needs to send to one channel, in one language, with no per-tenant or per-segment customization, you have **one variant** — the reserved `default` variant (`id: "default"`, `locale: "en"`, `tenant_id: null`, `conditions: null`) that SuprSend auto-creates when the channel is enabled. Put the content there. The variant envelope is still required — there is no schema for a "single content blob" outside it.

You add more variants when:

- **Multiple channels** — one variant per channel (email + sms + inbox for the same template each gets its own variant).
- **Multiple locales** — one variant per `locale` per channel for translations.
- **Multi-tenant** — set `tenant_id` to a tenant slug to customize content per tenant.
- **Conditional content** — use `conditions` to choose a variant based on recipient or payload attributes.

## Variant Envelope

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| $schema | string | No |  |
| channel | string | Yes |  |
| id | string | Yes |  |
| tenant_id | string \| null | Yes |  |
| locale | string | Yes | locale for variant |
| conditions | array \| null | Yes | variant conditions |
| content | object | No |  |
| needs_vendor_approval | boolean | No | does content require vendor approval before sending. This is used for SMS content |
| seq_no | integer \| null | No |  |
| vendor_approvals | array | No | approvals info with respect to variants that needs vendor approval |

### `channel` values

- `email`
- `sms`
- `whatsapp`
- `inbox`
- `slack`
- `ms_teams`
- `androidpush`
- `iospush`
- `webpush`

The `channel` selects which schema validates the `content` object. See the per-channel references for `content` structure.

### `id`

An identifier that is unique **per channel** — `^[a-zA-Z0-9_\-.]+$`, max 128 chars. Variants in the same channel must have distinct `id`s; the same `id` can be reused on different channels (picking several channels when creating a variant creates one variant per channel with that `id`). `default` is reserved for the auto-created base variant: its `locale` / `tenant_id` / `conditions` are fixed, only its `content` can change, and it can't be deleted.

### `tenant_id`

`null` for non-tenant variants, or a tenant slug (`^[a-zA-Z0-9_\-.]+$`, max 64 chars). When the template is rendered for a specific tenant, SuprSend prefers a matching `tenant_id` variant over `tenant_id: null` variants — see [Variant Selection](#variant-selection).

This field is the only way to scope a variant to a tenant:

- It is an **exact match** on the send's `tenant_id`, and one variant targets one tenant. To give two tenants the same override, create one variant per tenant.
- **Sub-tenants do not inherit** a parent tenant's variants (unlike branding and `properties`, which are inherited).
- A condition on `tenant_id` (empty namespace) reads the **trigger payload**, not the send's tenant. There is no `in` operator — it is rejected on save.

### `locale`

A supported locale code — case-sensitive, e.g. `en`, `en-US`, `fr`, `hi-IN`, `es-MX`. Anything else is rejected with "Unsupported locale code". The `default` variant is always `en`.

Put the language in this field, not in `conditions`. The recipient's locale is read from the user's `$locale` property, falling back to `$preferred_language`, then `en`. There is no built-in `language` property. A variant that tests language through `conditions` still sits in its own `locale` group (usually `en`), so real locale variants for the recipient's language are tried before it.

### `conditions`

`null` or an array of `expression_v1` clauses. Entries in the array are **OR'd**; the `args` inside one entry are **AND'd**. When non-null, the variant is only eligible if at least one entry matches for the current send. Useful for segmentation (e.g., a different subject line for enterprise users).

`value` is parsed as an expression: wrap string literals in escaped quotes (`"\"enterprise\""`). Numbers, `true` / `false`, and `null` can be bare; a bare word such as `"enterprise"` is read as a variable path, not a string.

Limits and gotchas:

- At most **10 `args`** per entry; `variable` and `value` are each at most **512 characters** (rejected on save otherwise).
- `ARRAY_INTERSECTS` / `NOT_ARRAY_INTERSECTS` against several values need an array literal as `value`: `"[\"admin\",\"owner\"]"`. A comma-separated string such as `"\"admin,owner\""` is compared as one string.
- There is no `IN` operator (rejected on save) — use `ARRAY_INTERSECTS` with an array literal, or one entry per value (entries are OR'd).

Each condition follows:

```json
{
  "type": "expression_v1",
  "expression_v1": {
    "op": "AND",
    "args": [
      { "variable_ns": "$recipient", "variable": "plan", "op": "==", "value": "\"enterprise\"" }
    ]
  }
}
```

#### Variable namespaces

| Namespace | Source |
|---|---|
| *(empty / omitted)* | Trigger event payload |
| `$actor` | Properties of the user who performed the action |
| `$recipient` | Properties of the user receiving the notification |
| `$tenant` | Properties of the tenant (`$brand` is the legacy alias — don't emit it) |
| `$organization` | Organization-level properties |

#### Comparison operators

- `==`
- `!=`
- `>`
- `>=`
- `<`
- `<=`
- `EMPTY`
- `NON_EMPTY`
- `CONTAINS`
- `NOT_CONTAINS`
- `ARRAY_INTERSECTS`
- `NOT_ARRAY_INTERSECTS`
- `DATETIME_EQUALS`
- `DATETIME_LT`
- `DATETIME_GT`

### `needs_vendor_approval` / `vendor_approvals`

Used for channels where the underlying vendor reviews content before send (notably SMS DLT and WhatsApp). `needs_vendor_approval` is the only part you author; it is forced to `true` for WhatsApp. Set it when you **create** the variant — changing it on an existing non-`default` variant is silently ignored (only the `default` variant accepts a later change). `vendor_approvals` is **read-only** in variant JSON — approval starts when the template is committed (automatic for WhatsApp via Meta Cloud API or Twilio; recorded manually per vendor otherwise) and appears here when you read a variant back. See the SMS and WhatsApp channel references.

The `vendor_approvals` array entries (as returned) follow:

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| vendor_slug | string | Yes | vendor slug against which approval is done |
| vendor_uid | string | Yes | vendor unique-identifier against which approval is done |
| vendor_template_name | string | Yes | template-name set during vendor approval |
| vendor_template_id | string \| null | No | template-id given by vendor after successful template upload |
| vendor_locale_code | string \| null | No | language code addes during approval |
| vendor_template_category | string \| null | No | in whatsapp, template category assigned after approval |
| provider_template_id | string \| null | No | if msg91-sms vendor, set template_id generated by this vendor, in addition to DLT template-id |
| approval_status | string | Yes |  |
| comment | string \| null | No | in case of rejection, this is rejection reason/comment |

For SMS variants, `needs_vendor_approval` is optional: when omitted it follows the workspace's SMS vendor setting (DLT or not), and `true` forces the content `type` to `dlt`. See the SMS channel reference for DLT details.

### `seq_no`

Read-only priority, assigned `1..n` from the template's **variant order** (dashboard drag-and-drop, or the `variant_order` map in the CLI's `template.json`). Lower numbers are evaluated first. Don't set it in variant JSON — it is ignored.

## Variant Selection

When a workflow sends a template, SuprSend picks one variant per channel using:

1. **Candidates** — enabled variants for the channel whose `tenant_id` is `null` or exactly the send's tenant, and whose `locale` is in the fallback list: recipient locale → its base language → `en` (e.g. `hi-IN` → `hi` → `en`).
2. **Tenant preference** — if any tenant-specific variant exists for a base language, the `tenant_id: null` variants for that language are dropped (except `default`) — even when the tenant's variants have conditions that don't match this send.
3. **Order** — by locale fallback position first, then non-`default` variants before `default`, then `seq_no` ascending.
4. **First match wins** — variants are evaluated in that order and the first whose `conditions` match (or are `null`) is used.

**Broadcasts select differently:** variants with `conditions` are never used (only `default` and condition-less variants are candidates), and the tenant comes before the locale — tenant + recipient locale → tenant + base language → tenant + `en` → tenant-less recipient locale → tenant-less base language → tenant-less `en`. So in a broadcast, the tenant's `en` variant beats a tenant-less `fr` variant.

Consequences:

- **Locale beats tenant.** If the tenant has no variant in the recipient's language, a tenant-less variant in that language wins over the tenant's `en` variant (e.g. recipient `fr`, variants `acme-en` and `default-fr` → `default-fr`).
- **Each channel is independent.** Channels are enabled per template; a channel with no variant for the tenant still sends its `default` (or other tenant-less) content.

## When to add more variants

- **Per-tenant content** — see [Multi-tenant Variants](multi-tenant-variants.md) for how `tenant_id` lets you customize a template per tenant.
- **Per-language content** — see [Multi-lingual Variants](multi-lingual-variants.md) for the trade-off between translation keys (one variant, many languages) vs. one variant per `locale`.

## Variants Concept

# Template Variants

> Use SuprSend template variants to serve different content by tenant, language, or condition from a single template, with default fallback and live preview.

Variants let you send different content to different recipients from the same template. Instead of creating separate templates for each tenant, language, or audience segment, you create variants with conditions - SuprSend picks the right one at send time.

Every template starts with a **default** variant. Add more only when you need them.

You can embed the template editor directly in your application using the [Embeddable Templates SDK](/docs/embeddable-template-react-sdk). This lets your customers edit notification templates within your product, or your internal team manage templates and run campaigns - all without switching to the SuprSend dashboard.

***

## When to use variants

<CardGroup cols={2}>
  <Card title="Multi-tenant" icon="buildings" iconType="solid">
    Each tenant's users see their own branding - logos, colours, copy. One template serves all [tenants](/docs/tenants).
  </Card>

  <Card title="Multi-lingual" icon="language" iconType="solid">
    One variant per language. SuprSend auto-selects based on the recipient's preferred language. See [Multi-lingual Templates](/docs/multi-lingual-template).
  </Card>

  <Card title="Payload-based" icon="code-branch" iconType="solid">
    Different content based on trigger data — for example, `plan == "pro"` gets a premium message.
  </Card>

  <Card title="A/B testing" icon="flask" iconType="solid">
    Different copy to different segments. Compare in [Analytics](/docs/analytics). Needs manual maintenance - use for specific hypotheses, not as a default.
  </Card>
</CardGroup>

***

## Create a variant

Click the **+** button next to "All Variants" in the left panel. You'll see two options:


### Add a new channel

Select **New Channel** to add a channel to the template (for example, add SMS to a template that only had Email). Pick the channels and click **Add Channels**.


### Add a new variant

Select **New Variant** to create a variant with conditions for an existing channel.


Fill in:

**Channels** - which channels this variant applies to. *(Required)*

**ID** - a unique identifier. Use descriptive names: `uber-en`, `acme-es`, `pro-users`. *(Required)*

**Locale** - the language for this variant. *(Required)*

**Tenant** - scope to a specific tenant. Leave blank for non-tenant variants.

**Conditions** - rules that determine when this variant is sent. Each condition has a **Data Type** (Recipient, Actor, Tenant, or Input Payload), **Property**, **Operator**, and **Value**. Add multiple conditions with **+ OR**.

| Common operators | |
| - | - |
| `==`, `!=` | Equals / not equals |
| `>`, `>=`, `<`, `<=` | Comparisons |
| `contains`, `not contains` | Substring match |
| `is empty`, `is not empty` | Null checks |
| `datetime is`, `datetime is before`, `datetime is after` | Date comparisons |
| `intersects (array)`, `not intersects (array)` | Array overlap checks |

<Tip>
  **AI prompt - design variant conditions:** *"Design SuprSend template variants for \[describe scenario]. Data available: \[payload keys, tenant props, recipient props]. For each variant suggest: ID, conditions, ordering (first match wins), and which should be the default fallback."*
</Tip>

***

## Edit a variant

Click any variant in the left panel to open it. You're always editing the **draft** - the live version is untouched until you commit.

* **Edit content** - write directly in the channel editor. Content auto-saves.
* **Edit conditions** - click the **settings icon** on the variant to change its ID, locale, tenant, or conditions after creation.
* **Import content** - use the Import button to copy content from another variant or template instead of starting from scratch. See [Import content](/docs/templates#import-content).

***

## Commit

Click **Commit** to publish. The modal shows all changes - you can deselect specific variants you're not ready to publish.


For **WhatsApp** and **SMS (DLT)** variants, committing puts the variant into **Approval Pending** - it goes live only after vendor approval. For multi-lingual templates, each language is approved separately. If a [fallback vendor](/docs/vendor-fallback) is configured, you'll need to confirm approval for each vendor.

***

## How selection works at send time

When a notification is triggered, SuprSend picks one variant per channel. Candidates are variants whose **Tenant** is empty or exactly the send's tenant and whose **Locale** is in the recipient's fallback list (for example `hi-IN` → `hi` → `en`). They are tried by locale first, then non-default variants in panel order, and the first whose conditions match is sent. The **default** variant (always at the top of the panel) is tried last, as the fallback. Broadcasts use a simpler rule: variants with conditions are ignored, and the tenant is checked before the locale (a tenant's `en` variant beats a tenant-less variant in the recipient's language).

* Conditions added with **+ OR** are alternatives — the variant matches if any one of them is true. The rules inside a single condition must all be true.
* **Tenant** and **locale** are soft checks with fallback, and **locale comes first**: recipient locale → base language → `en`. Within a base language, if the tenant has any variant for it, tenant-less variants for that language are skipped (even if the tenant's variants don't match); otherwise tenant-less variants are used. So for a French recipient a tenant-less `fr` variant beats the tenant's `en` variant. Sub-tenants don't inherit a parent tenant's variants.
* All other conditions (like `$recipient.plan == "pro"`) are hard checks - no fallback, the variant is just skipped.


### Ordering variants

Order determines priority. If two variants both match a recipient's data, the one **higher in the list** wins. You can drag and drop variants to change their position.

* The **default** variant always stays at the top - it's the fallback and cannot be moved. No other variant can be placed above it.
* All other variants can be freely reordered by dragging.
* Place more specific variants (for example, `uber-es`) above general ones (for example, `default-es`) to ensure they match first.

If a variant isn't being picked when you expect it to, check its position - a broader variant above it may be matching first.

### Testing variant selection

To verify the right variant is being picked for a specific condition, **test the full template group** - not a single variant. Testing a single variant sends that variant's content directly (bypassing conditions). Testing the template group runs the actual selection logic:

1. Click **Test** → select the **Template Group** tab.
2. Enter a **Recipient** whose profile matches the condition you want to test.
3. Select a **Tenant** if your variant is scoped to a tenant.
4. Click **Send Test** - SuprSend evaluates all variant conditions and sends the matching one.
5. Check [Logs](/docs/logging) to confirm which variant was selected.

This is the only way to verify that ordering and conditions work as expected end-to-end.

***

## Duplicate, delete, and disable

### Duplicate a variant

Click the three-dot menu (**...**) on any variant to duplicate it. The content is copied into a new variant - adjust the ID and conditions.


### Delete a variant

Click the three-dot menu on a variant and select **Delete**. This permanently removes the variant and its content. The **default** variant cannot be deleted.

### Disable a channel

Click the three-dot menu on a **channel name** (not a variant) to disable it. Notifications stop on that channel immediately, but the content is preserved. Re-enable anytime without losing work.


This is useful when you want to temporarily pause a channel (for example, stop sending SMS during a vendor migration) without deleting the content and having to recreate it later.

***

## Common patterns

**One template, many tenants** - create a variant per tenant by setting its **Tenant** field (`tenant_id`), not a condition. Default is the fallback for tenants without a custom variant. Onboarding a new tenant = a template edit, no code change.

**Tenant + language** - set both fields on one variant: **Tenant** `acme` + **Locale** `fr`. Language is not a condition: the recipient's locale comes from `$locale` (falling back to `$preferred_language`), and there is no built-in `language` property.

**A/B testing** — create a variant targeting a subset (for example, `$recipient.cohort = beta`). Compare metrics. To promote: widen the conditions or update the default. To end: delete the challenger.

After setting up any pattern, [test with a specific tenant and recipient](/docs/templates#test) to verify the right variant is picked.

***

## Frequently asked questions


  ### What happens if no variant matches?
    The **default** variant is sent. It cannot be deleted and always acts as the fallback.
  

  ### Can I have different variants per channel?
    Yes. Variants are per-channel - you can have 3 for Email, 1 for SMS, and just the default for Push. Each channel is evaluated independently.
  

  ### How do I test which variant gets picked?
    Click **Test** in the editor, enter a recipient, select a tenant, and send. The variant whose conditions match is used. Check [Logs](/docs/logging) to confirm.
  

  ### What's the difference between soft and hard conditions?
    **Soft** (tenant, locale): SuprSend falls back through a hierarchy if no exact match exists. **Hard** (everything else): no fallback - the variant is skipped if the condition doesn't match.
  

  ### Can I reorder variants?
    Yes. Drag them up or down in the panel. The default always stays at the top and cannot be moved.
  


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

## Examples

### Base email content (the `default` variant)

```json
{
  "$schema": "https://schema.suprsend.com/template/v2/variant_schema.json",
  "channel": "email",
  "id": "default",
  "tenant_id": null,
  "locale": "en",
  "conditions": null,
  "content": {
    "subject": "Welcome to Acme, {{ first_name }}",
    "body": {
      "type": "plain_text",
      "plain_text": { "text": "Thanks for signing up." }
    }
  }
}
```

### Locale variant (French)

```json
{
  "channel": "email",
  "id": "welcome-default-fr",
  "tenant_id": null,
  "locale": "fr",
  "conditions": null,
  "content": {
    "subject": "Bienvenue chez Acme, {{ first_name }}",
    "body": { "type": "plain_text", "plain_text": { "text": "Merci pour votre inscription." } }
  }
}
```

### Tenant-specific variant

```json
{
  "channel": "email",
  "id": "welcome-acme-eu-en",
  "tenant_id": "acme-eu",
  "locale": "en",
  "conditions": null,
  "content": {
    "subject": "Welcome to Acme EU",
    "body": { "type": "plain_text", "plain_text": { "text": "GDPR-compliant onboarding email." } }
  }
}
```

### Conditional variant (enterprise plan)

```json
{
  "channel": "email",
  "id": "welcome-enterprise-en",
  "tenant_id": null,
  "locale": "en",
  "conditions": [
    {
      "type": "expression_v1",
      "expression_v1": {
        "op": "AND",
        "args": [
          { "variable_ns": "$recipient", "variable": "plan", "op": "==", "value": "\"enterprise\"" }
        ]
      }
    }
  ],
  "content": {
    "subject": "Welcome to Acme Enterprise",
    "body": { "type": "plain_text", "plain_text": { "text": "Your dedicated CSM will reach out shortly." } }
  }
}
```

### SMS variant requiring DLT approval

```json
{
  "channel": "sms",
  "id": "otp-en",
  "tenant_id": null,
  "locale": "en",
  "conditions": null,
  "needs_vendor_approval": true,
  "content": {
    "type": "dlt",
    "category": "transactional",
    "header": "ACMECO",
    "body": "Your verification code is {{ otp }}. Valid for 5 minutes."
  }
}
```

