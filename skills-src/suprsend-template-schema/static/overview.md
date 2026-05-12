SuprSend templates define the content of a notification — the subject and body of an email, the text of an SMS, the layout of an in-app inbox message, and so on. Templates are channel-aware and locale-aware.

Internally, every template is modeled as a collection of **variants**. A variant pairs a channel, locale, optional tenant, and optional condition with channel-specific content. Even a simple template with no multi-tenant or multi-language requirements is just one variant — usually `tenant_id: null`, `locale: "en"`, `conditions: null`. Adding more locales, more tenants, or conditional content means adding more variants under the same template.

Each variant validates against `https://schema.suprsend.com/template/v2/variant_schema.json`. The `content` object inside a variant validates against a channel-specific schema selected by the `channel` field.
