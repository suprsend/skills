# iOS Push Content Schema

For variants with `channel: "iospush"`.

**Schema URL:** `https://schema.suprsend.com/template/v2/channel/iospush_schema.json`

## Fields

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| $schema | string | No |  |
| templating_language | string | No |  |
| header | string | Yes | message title/header |
| body | string | Yes | message text/body |
| image_url | string | No | image url |
| action_url | string | No | action url/deeplink |
| badge | integer | No | badge count |
| sound | string | No |  |
| content_available | integer | No |  |
| mutable_content | integer | No |  |
| thread_identifier | string | No |  |
| notification_type | string | No |  |
| via_suprsend | boolean | No |  |

`header` (max 500 characters) and `body` (max 4000 characters) are required — longer values fail validation on save. Author only `header`, `body`, `image_url`, `action_url` and `sound`.

### Fields SuprSend controls (don't set them)

These are overwritten on save or at send time, whatever you put in the variant:

- `badge` — **never sent.** It is reset to 0 before rendering and left out of the APNs payload, so SuprSend never sets or increments the app badge. Manage the badge count in your app.
- `content_available` — always `1`. An alert (title + body) is always shown; an iOS push template can't be a silent push.
- `mutable_content` — always `1`, so a Notification Service Extension can attach the `image_url` media.
- `thread_identifier` — always overwritten with the workflow's notification category slug (sent as `aps.thread_identifier`); a custom value is discarded, so don't set it.
- `notification_type`, `via_suprsend`, `templating_language` — fixed values.

### URLs and special characters

Push content is not HTML, but `{{ }}` still HTML-escapes its output (`&` → `&amp;`, `=` → `&#x3D;`, `'` → `&#x27;`) and nothing reverses it. A whole URL in `{{ }}` (for example a signed image URL with a query string) arrives broken. Use triple braces `{{{ }}}` for any variable that holds a URL or may contain those characters.

## Examples

### Simple notification

```json
{
  "header": "New message",
  "body": "{{{ sender.name }}}: {{{ message.preview }}}",
  "sound": "default"
}
```

### Rich notification with image attachment

```json
{
  "header": "Order shipped",
  "body": "Your order #{{ order.id }} is on its way",
  "image_url": "{{{ order.cover_image }}}",
  "action_url": "acme://orders/{{ order.id }}"
}
```

## Documentation

**Verified behaviour (overrides the docs below):** the scenario tables show URL variables like `{{product_image_url}}`. Use `{{{product_image_url}}}` in `image_url` and `action_url` so query strings aren't HTML-escaped.

# iOS Push

> Design iOS push notification templates in SuprSend with title, body, image, deep link, and action buttons, previewed live on a lock screen mockup.

The iOS Push editor is a form with title, body, image, and action URL - with a live lock screen preview on the right. Content is personalised with [Handlebars](/docs/handlebars-helpers) variables (`{{variable_name}}`).


## iOS Push fields

**Title** - single-line heading. Keep under 30 characters - iOS truncates on the lock screen. Supports Handlebars variables.

**Body** - multi-line message text. Front-load key info in the first line (4 lines visible in expanded view). Supports Handlebars variables.

**Image URL** - *optional.* Public URL for a rich notification image (PNG, JPG, JPEG, min 1024x1024 for best rendering). GIFs play in the expanded view. Requires a Notification Service Extension in your app - the SuprSend iOS SDK includes this by default. See [iOS SDK integration](/docs/ios-integration).

**Action URL** - *optional.* URL opened on tap. Always set one - without it, tapping opens the app's default screen. Supports deep links and Handlebars variables.

> **Note:**
  **Expo SDK support**

  When delivering iOS Push via the [Expo SDK](/docs/expo-push-notifications), all fields on this page are supported **except Image URL**. Rich notification images are not delivered through Expo.


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
        "product_image_url": "https://yourapp.com/images/product.jpg"
      }
      ```
    

    * **Nested variable:** `{{event.location.city}}` → renders as `San Francisco`
    * **Variable with space in name:** `{{event.[first name]}}`

    The preview section shows sample values rendered in real-time. If a variable isn't rendering, check:

    1. The variable is defined in the Variables panel.
    2. The variable name matches the Handlebars syntax exactly.
  


> **Warning:**
  If a variable cannot be rendered at send time (missing or mismatched data), SuprSend discards the iOS Push notification for that user. Other channels in the same template group are still sent.


## Preview and test

The right panel shows a live iOS lock screen preview, updated in real time as you edit. Variables render using data from the **Variables panel**.

Click **Test** in the top-right corner to send a real push notification to a real device. This uses the **live version** - commit your changes before testing. See [Testing a Template](/docs/templates#test) for the full guide.

## Commit

Click **Commit** in the top bar to publish the current draft as a new live version. Add an optional description for versioning.

## Common scenarios


  ### Delivery update
    | Field | Value |
    | - | - |
    | Title | `Your order is out for delivery` |
    | Body | `Order #{{order_id}} will arrive by {{eta}}. Tap to track.` |
    | Image URL | `{{product_image_url}}` |
    | Action URL | `https://yourapp.com/track/{{order_id}}` |
  

  ### Social engagement
    | Field | Value |
    | - | - |
    | Title | `{{actor_name}} liked your post` |
    | Body | `"{{post_excerpt}}"` |
    | Action URL | `yourapp://posts/{{post_id}}` |
  

  ### Restock reminder
    | Field | Value |
    | - | - |
    | Title | `Running low?` |
    | Body | `It might be time to restock {{product_name}}.` |
    | Image URL | `{{product_image_url}}` |
    | Action URL | `https://yourapp.com/product/{{product_id}}` |
  


## Frequently asked questions


  ### Why aren't images showing in my push notification?
    Your app needs a **Notification Service Extension** to display rich media (images, GIFs). The SuprSend iOS SDK includes this by default. If you're not using the SDK, add the extension manually. Supported formats: JPEG, PNG, GIF. Max size: 10 MB. Images display in the expanded notification view (long-press or swipe down). See [iOS SDK integration](/docs/ios-integration).
    **Expo SDK:** Image URL is **not** supported when delivering via the [Expo SDK](/docs/expo-push-notifications) — images will not render on Expo apps.
  

  ### How do deep links work in iOS push?
    The **Action URL** supports three URL types:

    | URL type | Format | Behaviour |
    | - | - | - |
    | Web URL | `https://yourapp.com/orders/123` | Opens in Safari (or your app if [Universal Links](https://developer.apple.com/ios/universal-links/) are configured) |
    | Custom scheme | `yourapp://orders/123` | Opens the matching view controller in your app |
    | Universal Link | `https://yourapp.com/orders/123` (Associated Domains) | Opens your app directly |

    Prefer Universal Links - they work as both web fallback and in-app deep links.
  

  ### How does badge count work?
    SuprSend does not set the app badge. The template `badge` field is ignored and no `badge` key is sent to APNs. Set and clear the badge count from your app (for example, from your unread count).
  

  ### What happens if a variable is missing at send time?
    SuprSend discards the iOS Push notification for that user. Other channels in the same template group are still sent if they render successfully.
  


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
