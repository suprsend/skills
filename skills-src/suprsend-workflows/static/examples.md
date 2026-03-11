### Trigger via API (cURL)

```bash
curl -X POST "https://hub.suprsend.com/trigger/" \
  -H "Authorization: Bearer <WORKSPACE_KEY>:<WORKSPACE_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "order-confirmation",
    "recipients": [
      {
        "distinct_id": "user-123",
        "$email": ["user@example.com"]
      }
    ],
    "data": {
      "order_id": "ORD-456",
      "amount": "$29.99",
      "item_name": "Premium Widget"
    }
  }'
```

### Trigger via Node.js SDK

```javascript
const { SuprSend } = require("@suprsend/node-sdk");

const supr = new SuprSend("WORKSPACE_KEY", "WORKSPACE_SECRET");

const workflow = supr.workflows.trigger({
  workflow: "order-confirmation",
  recipients: [{ distinct_id: "user-123" }],
  data: { order_id: "ORD-456", amount: "$29.99" },
});

await workflow;
```

### Trigger via Python SDK

```python
from suprsend import Suprsend

supr = Suprsend("WORKSPACE_KEY", "WORKSPACE_SECRET")

workflow = supr.workflows.trigger(
    workflow="order-confirmation",
    recipients=[{"distinct_id": "user-123"}],
    data={"order_id": "ORD-456", "amount": "$29.99"},
)
```
