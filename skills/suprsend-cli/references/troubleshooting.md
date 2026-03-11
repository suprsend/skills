# Troubleshooting

## Common Issues

### "Not authenticated" error
Run `suprsend login` to authenticate, or set `SUPRSEND_WORKSPACE_KEY` and `SUPRSEND_WORKSPACE_SECRET` environment variables.

### "Workspace not found" error
Check available workspaces with `suprsend workspace list` and switch with `suprsend workspace switch <name>`.

### Template push fails
Ensure the template file is valid JSON and matches the expected schema. Validate with `suprsend template validate <path>`.
