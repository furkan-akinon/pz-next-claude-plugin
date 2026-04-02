---
name: list
description: List all available pz-* plugins grouped by category with live version data from npm
---

# Available pz-* Plugins

Call the `list_plugins` MCP tool from the `pz-next-registry` server to fetch the current plugin list from the npm registry.

If the user provides a category argument, pass it to the tool. Valid categories: `payment`, `bnpl`, `quick-checkout`, `shopping`, `business`, `utility`, `all`.

After displaying the results, suggest:
- Use `/pz-next:install <plugin-name>` to install a plugin.
- Use `/pz-next:info <plugin-name>` for detailed information.
- Use `/pz-next:status` to see currently installed plugins.
