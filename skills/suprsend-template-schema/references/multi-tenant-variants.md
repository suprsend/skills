# Multi-tenant Variants

Use a per-tenant variant when a template needs different content (subject line, copy, branding, attachments) for different tenants of the same workflow. Set the variant's `tenant_id` to the tenant slug; leave it `null` for the default fallback.

Selection: when a template is sent for a specific `tenant_id`, SuprSend prefers the variant matching that `tenant_id` over the `tenant_id: null` variant (for the same channel + locale + condition match). If no tenant-specific variant exists, the `null` variant is used.

For tenant *variables* (logo, colors, properties) that just need substituting into shared content, prefer using `{{$brand.<property>}}` inside a single variant — see the doc below for the full variable set.

## Documentation

```
# Tenant Templates

> Learn how to use tenant components and variables in your notification templates.

## Overview

Use tenant properties in templates to dynamically render tenant-specific content. One template works for all tenants—SuprSend replaces variables with tenant-specific values at runtime.

## Email Template Design

Tenant variables in other channels are referred as `$brand.<property>` in templates. For email template designer, you get pre-built tenant component to automatically get the branded header, footer, and buttons for a tenant.


  **Find and add tenant component**
    Inside email template designer, find tenant component in the right side content menu and add it to your template.

    

    
  

  **Select relevant block type**
    Select relevant block type (header, footer, buttons) from the right panel.

    

    
  

  **Customize the selected block**
    Tenant blocks use the tenant's primary color and logo by default. Click any block to customize colors, padding, and styling from the right panel. To insert tenant variables anywhere in a block, use `{{$brand.<property>}}`. See the full list of [available variables](/docs/tenant-templates#available-variables).
  


## Customizing other channels templates

You can customize other channels using tenant variables as `{{$brand.<property>}}` in the template.

## Available Variables

Use `{{$brand.<property>}}` in handlebars templates and `data["$brand"].<property>` in JSONNET templates. Variables are replaced at runtime with the tenant’s properties (from the `tenant_id` passed when sending).

**Basic**

| Variable             | Description                       |
| -------------------- | --------------------------------- |
| `$brand.tenant_id`   | Tenant identifier (max 64 chars). |
| `$brand.tenant_name` | Display name for the tenant.      |
| `$brand.logo`        | URL of the tenant’s logo image.   |

**Colors**

| Variable                 | Description                  |
| ------------------------ | ---------------------------- |
| `$brand.primary_color`   | Primary brand color (hex).   |
| `$brand.secondary_color` | Secondary brand color (hex). |
| `$brand.tertiary_color`  | Tertiary brand color (hex).  |

**Social links**

| Variable                        | Description                   |
| ------------------------------- | ----------------------------- |
| `$brand.social_links.website`   | Website URL.                  |
| `$brand.social_links.facebook`  | Facebook profile or page URL. |
| `$brand.social_links.twitter`   | Twitter/X profile URL.        |
| `$brand.social_links.instagram` | Instagram profile URL.        |

**Custom properties**

| Variable                  | Description                                                                     |
| ------------------------- | ------------------------------------------------------------------------------- |
| `$brand.properties.<key>` | Any custom property set on the tenant (e.g. `$brand.properties.support_email`). |
```
