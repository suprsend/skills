# WhatsApp Content Schema

For variants with `channel: "whatsapp"`.

**Schema URL:** `https://schema.suprsend.com/template/v2/channel/whatsapp_basic_interactive_schema.json`

> **Note.** WhatsApp templates must be approved before they can be sent. `needs_vendor_approval` is always `true` for WhatsApp. Approval starts when the template is **committed** (not when the variant is saved):
> - If the template's primary WhatsApp vendor is **Meta Cloud API** (`cloud_api`) or **Twilio**, SuprSend uploads the template for approval automatically.
> - For any other WhatsApp vendor, nothing is uploaded: create/approve the template in the vendor's portal, then record the approval for the variant in SuprSend (including the vendor's template ID).
> - If an approval already exists for identical approval content, its status is reused instead of resubmitting.
>
> `vendor_approvals` is read-only and not part of the variant JSON you author.

## Fields

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| $schema | string | No |  |
| templating_language | string | No |  |
| category | string | Yes |  |
| subcategory | string | Yes |  |
| header | any | No |  |
| body | any | Yes |  |
| footer | any | No |  |
| button_type | string | No |  |
| buttons | array | No |  |

`category`, `subcategory`, and `body` are required. `subcategory` is fixed to `basic_interactive`.

**Updates replace the whole content.** Unlike other channels, a WhatsApp content update is not merged with the stored content — always send the complete object (header, footer, buttons included), or omitted parts are lost.

### `category` values

- `UTILITY`
- `MARKETING`

Only these two are accepted — there is no `AUTHENTICATION` category, so OTP-style authentication templates can't be created here.

### `button_type` values

- `CALL_TO_ACTION`
- `QUICK_REPLY`
- `NONE`

When `button_type` is `CALL_TO_ACTION` or `QUICK_REPLY`, at least one entry in `buttons` is required. When `button_type` is missing or `NONE`, `buttons` is **cleared on save** — always set `button_type` when you send buttons.

## Validation rules (checked on save; a variant with errors can't be committed)

**Restricted Handlebars.** In `header.text`, `body.text`, `footer.text`, button `text`, `url_static_part` and `url_dynamic_part`, only plain variables (`{{ order.id }}`) and inline helpers are allowed. Block helpers (`{{#if}}`, `{{#each}}`, …), partials (`{{> …}}`) and comments (`{{! …}}`) are rejected. Each variable becomes a positional parameter (`{{1}}`, `{{2}}`, …) in the approval submission. The translation helper `{{t "key"}}` always fails at send in WhatsApp; localize with one variant per `locale`.

**Mock data must cover every variable.** The template's mock data (the sample data in the Variables panel) is rendered to produce the example values sent for approval. Every variable in the header, body, `media_url` and `url_dynamic_part` must render to a **non-empty** value, otherwise the variant gets a `mock_data issue` error and the template can't be committed. Set mock data before committing.

| Part | Limits |
| --- | --- |
| `header.text` (`TEXT`) | ≤ 60 characters; at most 1 variable |
| `header.media_url` | ≤ 2000 characters; may contain variables (rendered with mock data for the example) |
| `body.text` | ≤ 1024 characters; must not **start or end** with a variable — put text before the first and after the last variable |
| `footer.text` | ≤ 60 characters; no variables |
| Button `text` (all types) | ≤ 25 characters; no variables |
| `CALL_TO_ACTION` buttons | only `URL` and `PHONE_NUMBER` types; at most 2 `URL` + 1 `PHONE_NUMBER` (can't mix with quick replies) |
| `QUICK_REPLY` buttons | only `QUICK_REPLY` type; at most 10; every button `text` must be unique |
| `phone_number` | literal number matching `^\+?[0-9]{10,20}$` — digits only, optional leading `+`, no spaces or variables |
| `url_static_part` | ≤ 2000 characters; no variables |
| `url_dynamic_part` | exactly one variable and nothing else, e.g. `{{ order.id }}` |

Character counts treat each variable as one character.

## Header

Header is optional; when present:

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| format | string | Yes |  |
| text | string | No |  |
| media_url | string | No |  |
| filename | string | No |  |

### Header `format` values

- `TEXT`
- `DOCUMENT`
- `IMAGE`
- `VIDEO`

- `TEXT` — requires `text`.
- `DOCUMENT` / `IMAGE` / `VIDEO` — require `media_url`.

## Body

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| text | string | Yes |  |

## Footer

Optional.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| text | string | Yes |  |

## Buttons

`buttons[]` is a discriminated union on `type`:

### `URL` button

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| type | string | Yes |  |
| text | string | Yes |  |
| url_type | string | Yes |  |
| url_static_part | string | Yes |  |
| url_dynamic_part | string | No |  |

`url_type: "dynamic"` requires `url_dynamic_part` (appended to `url_static_part` at send time). With `url_type: "static"`, `url_dynamic_part` is cleared.

### `PHONE_NUMBER` button

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| type | string | Yes |  |
| text | string | Yes |  |
| phone_number | string | Yes |  |

### `QUICK_REPLY` button

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| type | string | Yes |  |
| text | string | Yes |  |

## Examples

### Text-only utility message

```json
{
  "category": "UTILITY",
  "subcategory": "basic_interactive",
  "body": { "text": "Hi {{{ first_name }}}, your order {{ order.id }} has shipped and should arrive by {{ order.eta }}. Reply HELP if you need anything." }
}
```

The body starts and ends with plain text (a variable at either end is rejected). Mock data must give `first_name`, `order.id` and `order.eta` non-empty values.

### Dynamic tracking-link button

```json
{
  "category": "UTILITY",
  "subcategory": "basic_interactive",
  "body": { "text": "Your order {{ order.id }} is on its way. Tap below to track it." },
  "button_type": "CALL_TO_ACTION",
  "buttons": [
    {
      "type": "URL",
      "text": "Track order",
      "url_type": "dynamic",
      "url_static_part": "https://acme.com/track/",
      "url_dynamic_part": "{{ order.id }}"
    }
  ]
}
```

Put links in a URL button rather than in the body: the static part is fixed at approval, and the single variable in `url_dynamic_part` is appended at send time.

### Header image + call-to-action button

```json
{
  "category": "MARKETING",
  "subcategory": "basic_interactive",
  "header": { "format": "IMAGE", "media_url": "https://cdn.acme.com/promo.jpg" },
  "body": { "text": "Flash sale ends tonight. Tap to shop." },
  "footer": { "text": "Acme Co" },
  "button_type": "CALL_TO_ACTION",
  "buttons": [
    { "type": "URL", "text": "Shop now", "url_type": "static", "url_static_part": "https://acme.com/sale" }
  ]
}
```

## Documentation

# WhatsApp

> Design WhatsApp notification templates with header, body, footer, and buttons - with Meta approval and a live conversation preview.

The WhatsApp editor is a structured form (header, body, footer, buttons) with a live WhatsApp conversation preview on the right. Content is personalised with [Handlebars](/docs/handlebars-helpers) variables (`{{variable_name}}`).


> **Note:**
  To send WhatsApp messages, you need a WhatsApp vendor integrated with SuprSend. See [WhatsApp vendor integrations](/docs/karix-whatsapp) for the vendor list and setup.


***

## WhatsApp fields

**Template Category** - every WhatsApp template must be categorised. See [Choosing the right category](#choosing-the-right-category) below.

**Type** - `Text` or `Media`. Determines the header format.

**Header (Text type)** - bold text shown above the body. Max 60 characters. Emojis are not supported. Supports at most one Handlebars variable.

**Header (Media type)** - choose a media format: Image (.jpg, .png - recommended 800x418 px, max 5 MB), Video (.mp4 - max 16 MB, under 30s), or Document (.pdf - max 100 MB, set a descriptive filename). Provide a public URL - supports dynamic URLs with variables like `{{media_url}}`. Fully dynamic media URLs are treated as one variable.

**Body** - main message content. Max 1024 characters. Must not start or end with a variable. Multi-line, supports Handlebars variables and [WhatsApp formatting](#formatting-whatsapp-messages) (`*bold*`, `_italic_`, `~strikethrough~`). HTML and Markdown do not work.

**Footer** — short text below the body in lighter font. Max 60 characters. Variables are not supported. For Marketing templates, include opt-out language (for example, "Reply STOP to opt out") — improves approval rates.

**Buttons** - choose Call to Action, Quick Reply, or None.

* **Call to Action** — up to 3 buttons: at most 2 **Visit Website** buttons and 1 **Call Phone Number** button; button text max 25 characters. **Visit Website** redirects to a URL (Static or Dynamic — one variable at the **end** only, for example `https://yourapp.com/product/{{id}}`). **Call Phone Number** initiates a call.
* **Quick Reply** — up to 10 tap-to-reply buttons, each with unique text (max 25 characters). Variables and emojis are not allowed in button text.


## Adding dynamic content

You can add variables in the template to personalise it for each recipient. Variables are replaced with actual data at send time.


  **Add variables in the Variables panel**
    Add sample data in the **Variables panel** (Input Payload section) on the left side of the editor. This powers auto-suggestions and the live preview. For the full guide, see [Adding dynamic content](/docs/templates#the-variables-panel).
  

  **Use variables in the template**
    Type `{{` in any field - matching variables appear as auto-suggestions. You can also type variable names manually following [Handlebars syntax](https://handlebarsjs.com/guide/#what-is-handlebars).

    **Examples using this sample data:**

    
      ```json json theme={"system"}
      {
        "event": {
          "location": {
            "city": "San Francisco",
            "state": "California"
          },
          "order_id": "11200123",
          "first_name": "Joe"
        },
        "tracking_url": "https://yourapp.com/track/11200123"
      }
      ```
    

    * **Nested variable:** `{{event.location.city}}` → renders as `San Francisco`
    * **Variable with space in name:** `{{event.[first name]}}`

    The preview section shows sample values rendered in real-time. If a variable isn't rendering, check:

    1. The variable is defined in the Variables panel.
    2. The variable name matches the Handlebars syntax exactly.
  


<Info>
  When SuprSend submits your template to Meta for approval, named Handlebars variables like `{{order_id}}` are automatically converted to Meta's positional format (`{{1}}`, `{{2}}`). You always write named variables - SuprSend handles the conversion.
</Info>

> **Warning:**
  If a variable cannot be rendered at send time (missing or mismatched data), SuprSend discards the WhatsApp notification for that user. Other channels in the same template group are still sent.


## Preview and test

The right panel shows a live WhatsApp conversation preview, updated in real time as you fill in fields. Variables render using data from the **Variables panel**.

Click **Test** in the top-right corner to send a real WhatsApp message. This uses the **live version** - commit and get approval before testing. See [Testing a Template](/docs/templates#test) for the full guide.

## Commit

Click **Commit** in the top bar to publish the current draft. The template enters **Approval Pending** state. SuprSend submits it for approval automatically only when the WhatsApp vendor is Meta Cloud API or Twilio; with other vendors, get the template approved in the vendor's portal and record the approval in SuprSend. You'll be notified when approved or rejected. Once approved, the version goes **Live** and is used for all subsequent workflow triggers.

> **Warning:**
  WhatsApp templates **cannot be tested until approved**. The Test button uses the live (approved) version. If the template is still pending approval, testing is not available.


***

## Approval flow

Every WhatsApp template must be approved by Meta before it can be sent. This applies globally, not just in specific regions.


  **Design and commit**
    Author the template content and click **Commit**. The version enters **Approval Pending** state.
  

  **Meta reviews the template**
    With Meta Cloud API or Twilio as the WhatsApp vendor, SuprSend submits the template automatically; with other vendors, approve it in the vendor's portal and record the approval in SuprSend. Most templates are approved within minutes to hours (up to 24 hours in some cases).
  

  **Live or revise**
    On approval, the version goes **Live**. On rejection, it returns to **Draft** for revision.
  


Templates pending approval are visible in the **Approvals** tab on the [template listing page](/docs/templates#managing-templates). For content guidelines to avoid rejection, see [WhatsApp Template Guidelines](/docs/whatsapp-template-guidelines).

<Tip>
  **AI prompt - check approval likelihood:** *"Review this WhatsApp template for Meta approval. Category: \[UTILITY/MARKETING]. Header: \[text]. Body: \[paste]. Footer: \[text]. Buttons: \[describe]. Check category match, prohibited content, variable placement, character limits, and formatting. Suggest fixes."*
</Tip>

## Choosing the right category

WhatsApp enforces different rules and pricing for each category. Choosing the wrong category is the most common reason for rejection. SuprSend WhatsApp templates support only **Utility** and **Marketing** — there is no Authentication category.

| Category | Use when | Examples |
| - | - | - |
| **Utility** | Responding to a user action. Transactional or service updates. | Order confirmation, shipping update, payment receipt, appointment reminder |
| **Marketing** | Proactively reaching out with promotions or re-engagement. Requires opt-in. | Flash sale, product recommendation, abandoned cart nudge |

> **Warning:**
  WhatsApp may **reclassify** your template if the content doesn't match the selected category. A "Utility" template with promotional language may be reclassified as "Marketing" - with different pricing and opt-in requirements.


## Formatting WhatsApp messages

WhatsApp has its own text formatting syntax. **HTML and Markdown do not work.**

| Format | Syntax |
| - | - |
| **Bold** | `*text*` |
| *Italic* | `_text_` |
| ~~Strikethrough~~ | `~text~` |
| `Monospace` | ` ```text``` ` |

***

## Common scenarios


  ### Utility - order shipped
    | Field | Value |
    | - | - |
    | Category | Utility |
    | Header | `Order Shipped` |
    | Body | `Hi {{customer_name}}, your order #{{order_id}} has been shipped! Expected delivery: {{delivery_date}}.` |
    | Footer | `SuprSend Logistics` |
    | Button | Track Order → `https://yourapp.com/track/{{order_id}}` |
  

  ### Marketing - flash sale
    | Field | Value |
    | - | - |
    | Category | Marketing |
    | Header | `Flash Sale` |
    | Body | `Hi {{$recipient.name}}, our biggest sale starts now! Up to 50% off on all products.` |
    | Footer | `Reply STOP to opt out` |
    | Button | Shop Now → `https://yourapp.com/sale` |
  

  ### Utility - appointment reminder with buttons
    | Field | Value |
    | - | - |
    | Category | Utility |
    | Body | `Reminder: Your appointment with {{provider_name}} is on {{appointment_date}} at {{appointment_time}}.` |
    | Button 1 (Quick Reply) | `Confirm` |
    | Button 2 (Quick Reply) | `Reschedule` |
  


## Best practices

* **Avoid rejection** - don't mix categories, avoid placeholder-heavy text with no clear purpose, and don't use URL shorteners in the body.
* **Variable placement** - every variable needs a non-empty example value in the Variables panel (mock data) — commit is blocked otherwise. WhatsApp uses these during approval review.
* **Template pausing** - WhatsApp may pause templates with low quality scores (high block/report rates). Monitor quality in the vendor portal.

## Frequently asked questions


  ### Why was my WhatsApp template rejected?
    Common reasons: content doesn't match the selected category, too many variables without clear context, URL shorteners in the body, or example values that don't make sense. Review the [WhatsApp Template Guidelines](/docs/whatsapp-template-guidelines) and resubmit.
  

  ### How long does approval take?
    Most templates are approved within minutes to hours. In some cases, up to 24 hours. SuprSend submits automatically only with Meta Cloud API or Twilio as the WhatsApp vendor (other vendors need the approval recorded in SuprSend) - you'll be notified when the status changes.
  

  ### Can I edit a template after it's approved?
    No. To make changes, edit in draft mode and commit again. The new version goes through approval separately.
  

  ### What happens if WhatsApp pauses my template?
    The template stops being sent until the quality score recovers. Fix the content and monitor in your vendor portal (for example, WhatsApp Business Manager).
  

  ### How do dynamic URLs work in buttons?
    One variable allowed at the **end** only — for example, `https://yourapp.com/product/{{id}}`. The static prefix must be a valid URL on its own.
  

  ### Can I send WhatsApp in multiple languages?
    Yes - use [template variants](/docs/template-variants). Each language variant goes through approval separately. The default variant acts as the fallback.
  

  ### Can I test a template before approval?
    No. WhatsApp templates can only be tested after they are committed and approved by Meta. The Test button uses the live (approved) version.
  

  ### What happens if a variable is missing at send time?
    SuprSend discards the WhatsApp notification for that user. Other channels in the same template group are still sent.
  


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
