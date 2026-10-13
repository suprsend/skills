# Multi-lingual Variants

SuprSend offers two ways to localize a template:

1. **Translation keys** (recommended when available) — keep **one variant** and reference text via `{{t "key"}}` (JSONNET: `t("key")`). SuprSend resolves the key from your published translation files against the recipient's locale. Use this when only the text changes across languages.
2. **Language variants** — create one variant per language with its own `locale`. Use this when the entire content differs per language (different layouts, images, buttons, structure), or when translations aren't enabled for the account.

## Before using translation keys

`{{t "key"}}` / `t("key")` render only when **all** of these hold — otherwise the render fails at send time (saving the template does not catch it):

- Translations are **enabled for the account**. They are off by default on every plan; if they aren't on, use language variants instead.
- A translation version has been **published** (draft files are not used).
- The key exists in the recipient's locale file, its base language, or `en`.
- The channel is **not WhatsApp**. WhatsApp templates render with no translation data, so `{{t "key"}}` always fails there. Use one WhatsApp variant per `locale` instead.

**Namespaces:** `{{t "key"}}` reads only the `common` namespace — files named `{locale}.json` (e.g. `en.json`, `fr.json`). Keys in a namespaced file `{ns}.{locale}.json` (e.g. `billing.en.json`) need the prefix: `{{t "billing:key"}}`.

## Language variants

Put the language in the variant's `locale` field — not in `conditions`. The recipient's locale is read from the user's `$locale` property, falling back to `$preferred_language`, then `en`. There is no built-in `language` property.

Selection: SuprSend tries locales in order — the recipient's locale, then its base language, then `en` (e.g. `fr-CA` → `fr` → `en`). The first variant (in that order, for the matched channel + tenant) whose conditions match is used; the `en` `default` variant is the final fallback. Locale codes are case-sensitive (`fr-CA`, not `fr-ca`).

With tenants, locale is checked first: if the tenant has no variant in the recipient's language, a tenant-less variant in that language beats the tenant's `en` variant. If the tenant has a variant in one of the recipient's fallback locales (e.g. `en-US` or `en` for an `en-US` recipient; a tenant `en-GB` variant doesn't count), the tenant-less variants for that base language are skipped (except `default`). See [Template Schema Guide](template-schema-guide.md) → Variant Selection.

**Broadcasts select differently:** variants with `conditions` are never used (only `default` and condition-less variants are candidates), and the tenant comes before the locale — tenant + recipient locale → tenant + base language → tenant + `en` → tenant-less recipient locale → tenant-less base language → tenant-less `en`. So in a broadcast, the tenant's `en` variant beats a tenant-less `fr` variant.

## Documentation

# Multi-lingual Templates

> Localize SuprSend templates with translation keys or language variants so you can deliver notifications in each recipient preferred language.

SuprSend supports two ways to localise notification templates. The right approach depends on what changes between languages.

| Approach | Use when | How it works |
| - | - | - |
| **[Translations](#translations-recommended)** (recommended) | The text changes per language, but the template structure (layout, images, buttons) stays the same. | Use translation keys (`{{t "key"}}`) in your template. SuprSend resolves the key to the user's language at send time from your uploaded translation files. |
| **[Language variants](#language-variants)** | The entire content differs per language - different images, layouts, buttons, or structure. Not just text. | Create a separate variant per language with its `locale` field set. Each variant has its own full content. |

For most use cases, **Translations** is the right choice. It's simpler, easier to maintain, and scales better. Use variants only when you genuinely need different content structure per language.

***

## Setting the user's language

Before either approach works, each user needs a locale set on their profile. Use any backend SDK or the API:

* [Python SDK](/docs/python-create-user-profile#set-preferred-language)
* [Node.js SDK](/docs/node-create-user-profile#set-preferred-language)
* [REST API](/reference/edit-user-profile) - set the `$locale` property

The value should be a standard locale code: `en`, `es`, `fr`, `hi`, `de`, `pt-BR`, etc.

***

## Translations (recommended)

> **Note:** Translation keys render only when translations are enabled for your account (off by default — contact SuprSend to turn them on), a translation version has been published, and the key exists in it. Otherwise the render fails at send time; saving the template does not catch it.

Translations let you keep **one template** and manage all language text in separate JSON files. The template uses **translation keys** instead of raw text - at send time, SuprSend looks up the key in the user's language file and renders the translated text.

### How it works

1. **Upload translation files** — JSON files with key-value pairs, one per language (for example, `en.json`, `es.json`, `fr.json`). Upload from the [dashboard](https://app.suprsend.com/en/staging/developers/translations), [CLI](/reference/cli-translation-overview), or [API](/reference/add-translation).

2. **Use translation keys in your template** - instead of writing raw text, use the `t` helper:


  ```handlebars Handlebars (Email, SMS, Push, Inbox) theme={"system"}
  {{t "order_shipped" order_id=order_id}}
  ```

  ```jsonnet JSONNET (Slack, MS Teams) theme={"system"}
  t("order_shipped", {order_id: data.order_id})
  ```


3. **SuprSend resolves at send time** - reads the user's locale, finds the matching translation file, and renders the translated text with interpolated variables.

### Example

Translation files:

```json en.json theme={"system"}
{
  "order_shipped": "Your order #{{order_id}} has been shipped!",
  "track_button": "Track Order"
}
```

```json es.json theme={"system"}
{
  "order_shipped": "Tu pedido #{{order_id}} ha sido enviado!",
  "track_button": "Rastrear Pedido"
}
```

Template (same for all languages):

```handlebars theme={"system"}
{{t "order_shipped" order_id=order_id}}
```

A user with locale `es` receives: *"Tu pedido #ORD-1234 ha sido enviado!"*

### Fallback logic

If the user's locale file or key is missing, SuprSend falls back:

1. Exact locale (for example, `es-MX.json`)
2. General language (for example, `es.json`)
3. Default language (`en.json`)

Always maintain an `en.json` as the base fallback — if a key is missing from every file in the chain, the render fails.

### When to use Translations

* The template layout, images, and buttons are the same across languages - only the text differs.
* You want a single template to serve all languages without creating variants.
* You're scaling to many languages and don't want to maintain separate content per language.
* You want to manage translations outside the template editor (via files, CLI, or API).

For the full reference - managing translation files, pluralization, namespaces, interpolation, and version history - see [Translations](/docs/translations).

***

## Language variants

For cases where the **entire content differs per language** - not just text, but different images, layouts, buttons, or structure - use language variants.

### When to use variants instead of translations

* The email design is structurally different per language (for example, RTL layout for Arabic, different images for Japanese market).
* A specific language version needs completely different content (not just a translation of the same message).
* You want to visually author each language version separately in the editor.

### How to create a language variant

1. Open the template editor, click **+** in the Variants panel, and select **New Variant**.
2. Set the **Locale** to the target language (for example, Spanish).
3. Give it a descriptive **ID** (for example, `default-es`).
4. Author the content for that language. Use [Import content](/docs/templates#import-content) to copy the default English variant as a starting point.
5. Commit.

At send time, SuprSend checks the recipient's locale and sends the matching language variant. If no match, the **default** variant (English) is sent.

<Tip>
  **AI prompt - translate a template:** *"Translate this notification into \[language]. Channel: \[email/SMS/push/WhatsApp]. Content: \[paste]. Preserve all Handlebars variables exactly as-is. Adapt tone for the locale. Flag anything needing cultural adaptation (dates, currency, idioms). Stay within character limits."*
</Tip>

### Combining language with tenant

For tenants that need both brand customisation and localisation, set both the **Locale** and **Tenant** fields on one variant — for example, locale `es` + tenant `acme` for Acme's Spanish-speaking users.

The fallback order is locale first: recipient locale → base language → `en`. Within a base language, the tenant's variants replace the tenant-less ones if the tenant has any in the recipient's fallback locales for that language (even if they don't match); otherwise the tenant-less ones are used. So for a Spanish recipient a tenant-less `es` variant beats Acme's `en` variant. Broadcasts are the exception: there the tenant comes first, so Acme's `en` variant wins.

Name these descriptively: `acme-es`, `uber-fr`, `default-hi`.

***

## Which approach should I use?


  ### My notifications are the same structure in every language, just different text
    Use **Translations**. Create translation files per language and use `t` keys in your template. One template, zero variants.
  

  ### My email has different images, layout, or buttons per language
    Use **Language variants**. Create a variant per language with its own full content.
  

  ### Can I use both in the same template?
    Yes. You can use translation keys inside a variant. For example, a tenant-specific variant for Acme could still use `t` keys for localised text - so Acme's Spanish users get both Acme branding and Spanish text without creating `acme-es` as a separate variant.
  

  ### I'm scaling to 10+ languages. Which is easier to maintain?
    Translations, by far. With variants, you'd need to maintain 10+ content versions per channel per template. With translations, you maintain one template and 10 JSON files that can be managed via CLI or API.
  


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
