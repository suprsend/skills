# Multi-tenant Variants

Use a per-tenant variant when a template needs different content (subject line, copy, branding, attachments) for different tenants of the same workflow. Set the variant's `tenant_id` to the tenant slug; leave it `null` for the default fallback. The `tenant_id` field is the only way to scope a variant to a tenant — it is an exact match, and one variant targets one tenant (there is no `in` operator; a condition on `tenant_id` reads the trigger payload instead).

Selection: when a template is sent for a specific `tenant_id`, only variants with exactly that `tenant_id` or `tenant_id: null` are candidates. If the tenant has a variant in one of the recipient's fallback locales (e.g. `en-US` or `en` for an `en-US` recipient; a tenant `en-GB` variant doesn't count), the `tenant_id: null` variants for that base language are skipped — even if the tenant's variants have conditions that don't match — except `default`, which always remains the final fallback. If no tenant-specific variant exists for that language, the `null` variants are used. Locale is checked before tenant: if the tenant has no variant in the recipient's language, a tenant-less variant in that language beats the tenant's `en` variant.

**Broadcasts select differently:** variants with `conditions` are never used (only `default` and condition-less variants are candidates), and the tenant comes before the locale — tenant + recipient locale → tenant + base language → tenant + `en` → tenant-less recipient locale → tenant-less base language → tenant-less `en`. So in a broadcast, the tenant's `en` variant beats a tenant-less `fr` variant.

- **Channels are per template, not per variant.** Each channel picks its own variant, so a channel with no variant for the tenant still sends its tenant-less (usually `default`) content. To stop a channel for one tenant, use the tenant's `blocked_channels`.
- **Sub-tenants don't inherit variants.** A variant for `acme` is not used for `acme`'s sub-tenants; create one per sub-tenant that needs it.

For tenant *variables* (logo, colors, properties) that just need substituting into shared content, prefer using `{{$tenant.<property>}}` inside a single variant.

> **`$tenant` is the canonical namespace.** `$brand` is the legacy name for the same object — it still renders in existing templates, but never emit it in new content. When editing a template that uses `$brand.*`, migrate it to `$tenant.*`, mapping `brand_id` → `id` and `brand_name` → `name`.

## Reserved `$tenant.*` keys

These keys live directly under `$tenant.`. Anything not in this list is a custom property and must be referenced as `{{$tenant.properties.<key>}}` — see [Custom tenant properties](#custom-tenant-properties) below.

| Variable | Renders |
| --- | --- |
| `{{$tenant.id}}` | Tenant id (slug) |
| `{{$tenant.name}}` | Tenant display name |
| `{{$tenant.logo}}` | Tenant logo URL |
| `{{$tenant.primary_color}}` | Primary brand color (hex) |
| `{{$tenant.secondary_color}}` | Secondary brand color (hex) |
| `{{$tenant.tertiary_color}}` | Tertiary brand color (hex) |
| `{{$tenant.timezone}}` | Tenant timezone (IANA, e.g. `America/Los_Angeles`) |
| `{{$tenant.embedded_preference_url}}` | Tenant-level embedded preference URL |
| `{{$tenant.hosted_preference_domain}}` | Tenant-level hosted preference domain |
| `{{$tenant.blocked_channels}}` | List of channels blocked for the tenant |

Legacy aliases: `brand_id` / `brand_name` and `tenant_id` / `tenant_name` resolve to the same values as `id` / `name`. Never emit them in new content.

### Sub-tenant keys

For tenants nested in a [sub-tenant](https://docs.suprsend.com/docs/sub-tenants) tree:

| Variable | Renders |
| --- | --- |
| `{{$tenant.parent_id}}` | Parent tenant id; empty for a root tenant |
| `{{$tenant.level}}` | Depth in the tree, `0` (root) to `4` |
| `{{$tenant.ancestors}}` | Array of ancestor tenant ids, root first; excludes the tenant itself |

Branding keys (including `embedded_preference_url` and `hosted_preference_domain`) and `properties` are inherited per key from the closest ancestor that sets them, resolved at send time (a key set to `null` or `""` still counts as set). `blocked_channels` is the exception: it accumulates, so a sub-tenant blocks every channel that any ancestor blocks. `id` and `name` are never inherited, and neither are template variants.

### Social links

| Variable | Renders |
| --- | --- |
| `{{$tenant.social_links.x}}` | X (formerly Twitter) profile URL |
| `{{$tenant.social_links.twitter}}` | Twitter profile URL (legacy alias for `x`) |
| `{{$tenant.social_links.facebook}}` | Facebook page URL |
| `{{$tenant.social_links.instagram}}` | Instagram profile URL |
| `{{$tenant.social_links.linkedin}}` | LinkedIn profile / company page URL |
| `{{$tenant.social_links.youtube}}` | YouTube channel URL |
| `{{$tenant.social_links.tiktok}}` | TikTok profile URL |
| `{{$tenant.social_links.discord}}` | Discord invite / server URL |
| `{{$tenant.social_links.telegram}}` | Telegram channel URL |
| `{{$tenant.social_links.medium}}` | Medium publication URL |
| `{{$tenant.social_links.website}}` | Tenant website URL |

> **Anything not in the reserved tables above is a custom property and must be referenced as `{{$tenant.properties.<key>}}` — never `{{$tenant.<key>}}` directly.** Common customer-added properties like `address`, `unsubscribe_url`, `support_url`, `support_email` are *not* reserved; they live under `$tenant.properties.`. Authoring `{{$tenant.support_url}}` directly fails the render — Handlebars runs in strict mode, in preview and at send time.

## Custom tenant properties

For any property not in the reserved list above, use `{{$tenant.properties.<key>}}`:

- `{{$tenant.properties.address}}`
- `{{$tenant.properties.unsubscribe_url}}`
- `{{$tenant.properties.support_url}}`
- `{{$tenant.properties.support_email}}`

A custom key the tenant doesn't have also **fails the render** (strict mode). For an optional key use `{{default $tenant.properties.<key> "fallback"}}` — this works only when the tenant's `properties` is an object; if `properties` is null the render still fails.

In JSONNET templates, the equivalent shapes are `data["$tenant"].<reserved_key>` and `data["$tenant"].properties.<custom_key>`.

## Preference-page URLs (not under `$tenant`)

These are injected at send time as top-level variables — not nested under `$tenant`:

- `{{$hosted_preference_url}}` — signed link to the SuprSend-hosted preference / unsubscribe page for this notification's recipient. Substituted in **email and SMS** content only.
- `{{$embedded_preference_url}}` — your embedded preference page URL: the tenant's `embedded_preference_url`, falling back to the organization-level setting.
- `{{$hosted_preference_domain}}` — the hosted preference page domain: the tenant's `hosted_preference_domain`, falling back to the organization-level setting.

`{{$tenant.$hosted_preference_url}}` does not resolve. `{{$tenant.embedded_preference_url}}` and `{{$tenant.hosted_preference_domain}}` are the tenant's own values (inherited from ancestors for sub-tenants; no live organization fallback — a root tenant created without them gets a copy of the organization values at creation, and later organization changes don't propagate). Prefer the top-level variables when linking recipients to their preferences.

## Documentation

**Verified behaviour (overrides the docs below):**

- Tenant variants change content and layout only. They don't change which channels are enabled — channels are enabled per template, and each channel picks its own variant.
- Scope a variant with its `tenant_id` (dashboard: **Tenant**) field, never with a `tenant_id` condition; the match is exact and sub-tenants don't inherit variants.
- Set language with the variant's `locale` field; the recipient's locale comes from `$locale`, falling back to `$preferred_language`.

# Tenant Templates

> Serve tenant-specific notifications from one template — use brand variables for white-labelling logos and colors, or template variants for tenant-specific content, layout, and channels.

You have two ways to make a template render differently per tenant, both driven by the `tenant_id` passed at trigger time:

* **[Brand variables](#white-labelling-with-brand-variables)** — one shared template with tenant values substituted at runtime (`{{$tenant.logo}}`, `{{$tenant.primary_color}}`, `{{$tenant.name}}`). *Best for white-labelling* — the content is the same, only branding and tenant-specific values change.
* **[Template variants](#custom-content-with-template-variants)** — the same template with different content or layout per tenant, using a variant whose **Tenant** field (`tenant_id`) is set to that tenant. *Best when tenant differences go beyond variable substitution* — a different call to action, an extra section, or a tenant-specific footer.

Most workspaces use variables broadly and reserve variants for the handful of tenants that need genuinely different content. The two approaches compose: a tenant-specific variant can still reference `{{$tenant.*}}` variables inside it.

## When to reach for each

| Parameter | Brand variables | Template variants |
| - | - | - |
| **Best for** | White-labelling — same content, different tenant values | Custom content — different message, layout, or channels per tenant |
| **What changes** | Logos, colors, brand name, social links, custom string properties | Subject line, body copy, structure, CTAs, enabled channels |
| **Setup effort** | Update template once, populate tenant properties | Create a variant per tenant that needs different content |
| **Scale** | Any number of tenants share one template | One variant per tenant that diverges; the default template covers everyone else |
| **Use when** | *"Every tenant sees their own logo and primary color in the same welcome email"* | *"Enterprise-tier customers need a compliance disclaimer at the bottom of every notification"* or *"Acme Corp wants their password-reset email in a completely different layout"* |

## White-labelling with brand variables

Use tenant properties inside your template to render tenant-specific branding at runtime. One template works for every tenant — SuprSend substitutes the values when the workflow is triggered with a `tenant_id`.

### Email template design

Inside the email template designer, you get pre-built tenant components that auto-render the branded header, footer, and buttons for the tenant.


  **Find and add the tenant component**
    Inside the email template designer, find the tenant component in the right-side content menu and add it to your template.

    

    
  

  **Select the relevant block type**
    Select the relevant block type (header, footer, buttons) from the right panel.

    

    
  

  **Customize the selected block**
    Tenant blocks use the tenant's primary color and logo by default. Click any block to customize colors, padding, and styling from the right panel. To insert tenant variables anywhere in a block, use `{{$tenant.<property>}}`. See the full list of [available variables](#available-variables).
  


### Other channels

For SMS, WhatsApp, push, Slack, MS Teams, in-app inbox, and webhook templates, reference tenant properties directly in the template body using `{{$tenant.<property>}}`. There are no visual designer components for these channels — the substitution happens at render time regardless.

### Available variables

Use `{{$tenant.<property>}}` in Handlebars templates and `data["$tenant"].<property>` in JSONNET templates. Variables are replaced at runtime with the tenant's properties (from the `tenant_id` passed when sending).

**Basic**

| Variable | Description |
| - | - |
| `$tenant.name` | Display name for the tenant. |
| `$tenant.logo` | URL of the tenant's logo image. |

**Colors**

| Variable | Description |
| - | - |
| `$tenant.primary_color` | Primary brand color (hex). |
| `$tenant.secondary_color` | Secondary brand color (hex). |
| `$tenant.tertiary_color` | Tertiary brand color (hex). |

**Social links**

| Variable | Description |
| - | - |
| `$tenant.social_links.website` | Website URL. |
| `$tenant.social_links.facebook` | Facebook profile or page URL. |
| `$tenant.social_links.twitter` | Twitter/X profile URL. |
| `$tenant.social_links.instagram` | Instagram profile URL. |

**Custom properties**

| Variable | Description |
| - | - |
| `$tenant.properties.<key>` | Any custom property set on the tenant (for example `$tenant.properties.support_email`). |

## Custom content with template variants

When variable substitution isn't enough — a tenant needs a different subject line, an extra body section, or a different CTA — create a [template variant](/docs/template-variants) with its **Tenant** field (`tenant_id`) set to that tenant. At send time each channel picks its own variant; a tenant variant is a candidate only when the send's `tenant_id` matches it exactly, and if no candidate matches, the default variant is used.

Because the default template is the fallback, you can add a variant for one specific tenant without touching how anyone else receives the notification.

### Common patterns

* **Tenant-specific content** — the enterprise-tier tenant needs a compliance disclaimer in every notification; add a variant with **Tenant** set to `enterprise-corp` and put the disclaimer in the body.
* **Tenant-specific channels** — not done with variants: channels are enabled per template and each channel picks its own variant, so a channel with no variant for the tenant still sends its default content. To stop a channel for one tenant, add it to that tenant's `blocked_channels`.
* **Completely different layout** — a strategic customer wants their password-reset email to match their brand's structure, not yours; the variant can override the full email HTML while still using `{{$tenant.*}}` variables inside.
* **Combined tenant + language** — set both the **Tenant** and **Locale** fields on one variant (and add conditions on trigger data or user properties if needed), so you can layer tenant customization on top of [multi-lingual templates](/docs/multi-lingual-template).

### Creating a tenant variant


  **Open the template and add a new variant**
    In the template editor's left panel, click the **+** next to **All Variants** and choose **New Variant**.
  

  **Add a tenant condition**
    In the Create Variant modal, set the **Tenant** field to your tenant id — not a condition (a condition on `tenant_id` reads the trigger payload). Pick the channels this variant applies to; picking a channel the template doesn't have yet adds that channel to the template for everyone, with its own default variant.
  

  **Edit the variant's content**
    Edit the subject, body, or channel-specific content the same way you would the default template. Brand variables still work inside the variant.
  

  **Commit and test**
    Commit the template, then trigger the workflow with a `tenant_id` matching the variant to see it render. Tenants whose `tenant_id` doesn't match will continue to see the default template.
  


<Tip>
  Keep the default template as the canonical content and treat variants as focused overrides — this keeps maintenance predictable. A variant targets exactly one tenant and there is no `in` operator, so if two tenants need the same override, duplicate the variant and change its Tenant. Sub-tenants don't inherit a parent tenant's variants.
</Tip>

See [Template Variants](/docs/template-variants) for the full variant reference — condition operators, evaluation order, and variant limits.

## FAQ


  ### Should I use brand variables or a template variant?
    Use `$tenant.*` variables when the content is the same and only tenant-specific *values* change (logo, primary color, product name, support email) — one shared template stays maintainable and every new tenant just needs its properties populated. Use a [template variant](/docs/template-variants) when the *content itself* differs — a different CTA, an extra section, a tenant-specific layout, or a legal footer only one tenant needs.
  

  ### What happens if a tenant doesn't have a matching variant?
    Only variants whose Tenant matches the send's `tenant_id` exactly (or that have no Tenant) are candidates, and the first match is used. If no variant matches, the default template is used — so you can safely add a variant for one tenant without affecting anyone else.
  

  ### Do brand variables still work inside a variant?
    Yes. `{{$tenant.*}}` variables substitute in every variant, including the default. A variant overrides the *content*, not the variable resolution — so a tenant variant can still render `{{$tenant.logo}}` and get the tenant's logo.
  

  ### Can a variant enable a different set of channels than the default template?
    No. Channels are enabled per template, not per variant. Picking channels when you create a variant creates the variant in each picked channel (and adds any channel the template doesn't have yet, for everyone). Each channel picks its variant independently, so if a tenant has variants only for Email + In-App Inbox, the other channels still send their default content. To stop a channel for one tenant, use the tenant's `blocked_channels`.
  

  ### Can I combine tenant conditions with language or user-property conditions?
    Yes. Set the tenant with the variant's **Tenant** field and the language with its **Locale** field (the recipient's locale comes from `$locale`, falling back to `$preferred_language`); conditions can add trigger-data or user-property rules on top. Common pattern: one variant per tenant for content differences, plus multi-lingual [translations](/docs/multi-lingual-template) inside each variant for language differences.
  


## Next steps

<CardGroup cols={2}>
  <Card title="Template Variants" icon="code-branch" href="/docs/template-variants">
    Learn the full variant model — conditions, evaluation order, and multi-lingual support.
  </Card>

  <Card title="Tenant Workflows" icon="sitemap" href="/docs/tenant-workflows">
    Trigger a workflow with a `tenant_id` and see brand variables and variants resolve at runtime.
  </Card>

  <Card title="Multi-lingual Templates" icon="language" href="/docs/multi-lingual-template">
    Combine tenant variants with per-language translations for global multi-tenant apps.
  </Card>

  <Card title="Managing Tenants" icon="wrench" href="/docs/tenant-management">
    Create tenants, set brand properties, and manage the tenant lifecycle.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
