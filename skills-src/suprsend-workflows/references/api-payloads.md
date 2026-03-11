# API Payload Examples

## Trigger Workflow — Minimal Payload

```json
{
  "workflow": "welcome-email",
  "recipients": [
    { "distinct_id": "user-123" }
  ],
  "data": {
    "name": "Jane"
  }
}
```

## Trigger Workflow — Full Payload

```json
{
  "workflow": "order-shipped",
  "actor": {
    "distinct_id": "admin-1",
    "name": "System"
  },
  "recipients": [
    {
      "distinct_id": "user-456",
      "$email": ["user@example.com"],
      "$sms": ["+15551234567"],
      "$channels": ["email", "sms"],
      "$timezone": "America/New_York",
      "$preferred_language": "en"
    }
  ],
  "data": {
    "order_id": "ORD-789",
    "tracking_url": "https://track.example.com/ORD-789",
    "estimated_delivery": "March 15, 2026"
  },
  "tenant_id": "brand-abc",
  "idempotency_key": "ship-ORD-789"
}
```

## Trigger Workflow — Multiple Recipients

```json
{
  "workflow": "flash-sale",
  "recipients": [
    { "distinct_id": "user-1" },
    { "distinct_id": "user-2" },
    { "distinct_id": "user-3" }
  ],
  "data": {
    "sale_name": "Spring Flash Sale",
    "discount": "30%",
    "end_date": "2026-03-20"
  }
}
```

## Trigger Workflow — With Actor

```json
{
  "workflow": "comment-notification",
  "actor": {
    "distinct_id": "commenter-123",
    "name": "Alice"
  },
  "recipients": [
    { "distinct_id": "post-author-456" }
  ],
  "data": {
    "comment_text": "Great post!",
    "post_title": "Getting Started with SuprSend"
  }
}
```

## Recipient Object — All Channel Fields

| Field | Type | Description |
|-------|------|-------------|
| `distinct_id` | string | Unique user identifier |
| `$email` | string[] | Email addresses |
| `$sms` | string[] | Phone numbers (E.164 format) |
| `$whatsapp` | string[] | WhatsApp numbers |
| `$androidpush` | object[] | Android push tokens |
| `$iospush` | object[] | iOS push tokens |
| `$webpush` | object[] | Web push subscriptions |
| `$slack` | object[] | Slack identities |
| `$ms_teams` | object[] | MS Teams identities |
| `$channels` | string[] | Preferred channels list |
| `$timezone` | string | IANA timezone |
| `$preferred_language` | string | ISO language code |
| `$skip_create` | boolean | Skip auto user creation |
