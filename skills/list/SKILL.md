---
name: list
description: List all available pz-* plugins grouped by category with live version data from npm
---

# Available pz-* Plugins

You MUST use the `list_plugins` MCP tool to fetch the current plugin list from the npm registry. Do NOT use hardcoded data or search local files.

Call `list_plugins` with category: "all"

Present the returned data as-is. After displaying, suggest:
- `/pz-next:install <plugin-name>` to install a plugin
- `/pz-next:info <plugin-name>` for detailed information
- `/pz-next:status` to see currently installed plugins
