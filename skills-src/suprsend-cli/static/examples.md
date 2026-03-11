### Trigger a workflow with data

```bash
suprsend workflow trigger welcome-email \
  --to '{"distinct_id": "user-123"}' \
  --data '{"name": "Alice", "plan": "pro"}'
```

### Export workflow as JSON

```bash
suprsend workflow get welcome-email --format json > workflow.json
```

### List all templates with filtering

```bash
suprsend template list --channel email --status active
```
