# Web Push Content Schema

For variants with `channel: "webpush"`.

**Schema URL:** `https://schema.suprsend.com/template/v2/channel/webpush_schema.json`

## Fields

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| $schema | string | No |  |
| templating_language | string | No |  |
| header | string | Yes | message title/header |
| body | string | Yes | message text/body |
| icon_url | string | No |  |
| image_url | string | No | image url |
| action_url | string | No | action url/deeplink |
| badge_url | string | No | badge url |
| dir | string | No |  |
| vibrate | array | No |  |
| sound | string | No |  |
| is_sticky | boolean | No |  |
| is_silent | boolean | No |  |
| renotify | boolean | No |  |
| group | string | No |  |
| lang | string | No |  |
| buttons | array | No |  |
| extra_payload | object | No | extra payload. dict of key-value pairs |
| ttl | any | No | push message time-to-live. Optional. Stored null when missing or empty. Send-time default is 1h when stored null |

`header` (max 500 characters) and `body` (max 4000 characters) are required — longer values fail validation on save.

### Blocks commit

These are saved, but recorded as variant errors; the template can't be committed until they're fixed:

- `renotify: true` with an empty `group`. Renotify needs a `group`, which becomes the notification tag.
- `is_silent: true` combined with `vibrate` or `sound`.

### What actually reaches the browser

- **`icon_url`** is set per variant. If you omit it, it is saved as an empty string (the schema's `{{$tenant.logo}}` default is not applied) and no icon is sent. Set it explicitly, for example `"icon_url": "{{{$tenant.logo}}}"`.
- **`extra_payload` and `lang` are not delivered.** They are accepted and stored, but the notification's `data` carries only the click URLs and SuprSend's notification ids. Don't build service-worker logic on them.
- **Button `id`** is always replaced with an id built from the workflow slug and the button `text`. Omit it; buttons are identified by their text.
- `group` is sent as the notification `tag`. A new notification with the same group replaces the previous one.

### `dir` values

- `auto`
- `ltr`
- `rtl`

`vibrate` is an array of positive integers (alternating vibration / pause durations in ms — service worker reads it directly).

### `ttl` (time-to-live)

How long the push service keeps the notification for a browser that is offline. Optional — when it is omitted or its `value` is empty, it is stored as `null` and the send-time default is 1 hour.

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| type | string | No | fixed: value is a relative duration. dynamic: value is resolved at send time and is not checked as a duration |
| value | string | No | fixed: relative duration (XXdXXhXXmXXs), 1s..28d. dynamic: resolved at send time, not checked as a duration |

- `fixed` — `value` is a relative duration such as `30m`, `6h` or `2d12h` (no spaces), from `1s` to `28d`. Anything else is a variant error and blocks commit.
- `dynamic` — `value` is resolved at send time (for example `{{ push_ttl }}` from the trigger data) and is not checked on save. If it doesn't resolve to a TTL between 1s and 28d, the 1 hour default is used.

```json
"ttl": { "type": "fixed", "value": "6h" }
```

Use a short TTL for time-sensitive pushes (OTP, live alerts) so a stale notification isn't delivered when the browser comes back online.

### URLs and special characters

Push content is not HTML, but `{{ }}` still HTML-escapes its output (`&` → `&amp;`, `=` → `&#x3D;`, `'` → `&#x27;`) and nothing reverses it. A whole URL in `{{ }}` (for example an avatar URL with a query string) arrives broken. Use triple braces `{{{ }}}` for any variable that holds a URL or may contain those characters.

## Buttons

Up to 2 entries in `buttons[]`:

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| id | string | No |  |
| text | string | Yes |  |
| url | string | Yes |  |
| icon | string | No |  |

Set `text`, `url` and optionally `icon`. Any `id` you set is replaced on save.

## Examples

### Simple notification

```json
{
  "header": "Build complete",
  "body": "{{{ repo }}} – {{{ branch }}} built in {{{ duration }}}",
  "icon_url": "{{{ $tenant.logo }}}",
  "action_url": "https://acme.com/builds/{{ build.id }}"
}
```

### Notification with actions and badge

```json
{
  "header": "{{{ sender.name }}} sent a message",
  "body": "{{{ message.preview }}}",
  "icon_url": "{{{ sender.avatar_url }}}",
  "badge_url": "https://cdn.acme.com/badge.png",
  "action_url": "https://acme.com/chat/{{ thread.id }}",
  "buttons": [
    { "text": "Reply",   "url": "https://acme.com/chat/{{ thread.id }}?reply=1" },
    { "text": "Dismiss", "url": "https://acme.com/chat/{{ thread.id }}?dismiss=1" }
  ],
  "renotify": true,
  "group": "chat-{{ thread.id }}"
}
```

## Documentation

**Verified behaviour (overrides the docs below):** the scenario tables show URL variables like `{{product_image_url}}`. Use `{{{product_image_url}}}` in `image_url`, `icon_url`, `action_url` and button `url` so query strings aren't HTML-escaped.

# Web Push

> Design web push notification templates in SuprSend with title, body, image, action URL, and buttons, plus a live Windows and macOS preview of your content.

The Web Push editor is a form with title, body, image, action URL, and buttons - with a live preview on the right (toggle between Windows and macOS). Content is personalised with [Handlebars](https://docs.suprsend.com/docs/handlebars-helpers.md) variables (`{{variable_name}}`).


Web Push editor with Windows/macOS preview toggle

## Web Push fields

**Title** - single-line heading. Keep under 40 characters (Windows truncates aggressively; macOS is more generous). Supports Handlebars variables.

**Large Icon** - shown to the right of the notification text. Set it per template in the **Icon** field (recommended 256 × 256 px). The field is empty by default, so no icon is sent unless you set one.

**Body** - 2-3 lines max. One sentence with a clear CTA is ideal. Supports Handlebars variables.

**Banner Image URL** - *optional.* 2:1 aspect ratio (recommended 720x480), under 200 KB for instant rendering. Formats: PNG, JPG, JPEG.

**Action URL** - URL opened on notification click. Always include one - without it, clicking does nothing. Supports Handlebars variables.

**Action Buttons** - *optional.* Up to 2 buttons with action-oriented labels (2-3 words: "View Order", "Shop Now"). Supports Handlebars. Only visible on Chromium browsers (Chrome, Edge, Brave) - on Firefox and Safari, only the title, body, and click action are shown.

## Adding dynamic content

You can add variables in the template to personalise it for each recipient. Variables are replaced with actual data at send time.

**1. Add variables in the Variables panel**

Add sample data in the **Variables panel** (Input Payload section) on the left side of the editor. This powers auto-suggestions and the live preview. For the full guide, see [Adding dynamic content](https://docs.suprsend.com/docs/templates.md#the-variables-panel).

**2. Use variables in the template**

Type `{{` in any field - matching variables appear as auto-suggestions. You can also type variable names manually following [Handlebars syntax](https://handlebarsjs.com/guide/#what-is-handlebars).

**Examples using this sample data:**

```json json theme={"system"}
{
  "event": {
    "order_id": "11200123",
    "first_name": "Emma"
  },
  "product_name": "RayBan Sunglasses",
  "product_image_url": "https://yourapp.com/images/product.jpg"
}
```

* **Nested variable:** `{{event.order_id}}` → renders as `11200123`
* **Variable with space in name:** `{{event.[first name]}}`

The preview section shows sample values rendered in real-time. If a variable isn't rendering, check:

1. The variable is defined in the Variables panel.
2. The variable name matches the Handlebars syntax exactly.

> **Warning:**
>
> If a variable cannot be rendered at send time (missing or mismatched data), SuprSend discards the Web Push notification for that user. Other channels in the same template group are still sent.

## Preview and test

The right panel shows a live notification preview (toggle Windows / macOS). Variables render using data from the **Variables panel**.

Click **Test** in the top-right corner to send a real web push to a real browser. In the editor this uses the **draft version**; from the live view it uses the **live version**. See [Testing a Template](https://docs.suprsend.com/docs/templates.md#test) for the full guide.

## Commit

Click **Commit** in the top bar to publish the current draft as a new live version. Add an optional description for versioning.

## Common scenarios

### Back-in-stock alert

| Field | Value |
| - | - |
| Title | `Back in stock: {{product_name}}` |
| Body | `The item you were watching is available again.` |
| Banner Image URL | `{{product_image_url}}` |
| Action URL | `https://yourapp.com/product/{{product_id}}` |
| Button 1 | `Buy Now` → `https://yourapp.com/cart/add/{{product_id}}` |

### New content published

| Field | Value |
| - | - |
| Title | `New article: {{article_title}}` |
| Body | `{{article_excerpt}}` |
| Banner Image URL | `{{cover_image_url}}` |
| Action URL | `https://yourblog.com/{{article_slug}}` |

### Price drop

| Field | Value |
| - | - |
| Title | `Price dropped on {{product_name}}` |
| Body | `Now {{new_price}} (was {{old_price}})` |
| Action URL | `https://yourapp.com/product/{{product_id}}` |
| Button 1 | `View Deal` → `https://yourapp.com/product/{{product_id}}` |
| Button 2 | `Add to Cart` → `https://yourapp.com/cart/add/{{product_id}}` |

## Frequently asked questions

### Which browsers support which features?

| Feature | Chrome | Firefox | Safari (macOS) | Edge |
| - | - | - | - | - |
| Title + Body | Yes | Yes | Yes | Yes |
| Banner Image | Yes | Yes | No | Yes |
| Action Buttons | Yes (up to 2) | No | No | Yes (up to 2) |
| Large Icon | Yes | Yes | No | Yes |

Action buttons only render on Chromium browsers. Design your notification so the core message is in the title + body, with buttons as an enhancement.

### How do I change the large icon?

Set it in the template's **Icon** field (recommended 256 × 256 px). The field is empty by default, so set it on each template that should show an icon.

### How often should I send web push notifications?

Web push has higher opt-out rates than other channels. Send only high-value, time-sensitive notifications to maintain subscriber trust. Over-sending is the fastest way to lose subscribers.

### What happens if a variable is missing at send time?

SuprSend discards the Web Push notification for that user. Other channels in the same template group are still sent if they render successfully.
