---
name: info
description: Show detailed information about a specific pz-* plugin with live npm data
argument-hint: <plugin-name>
---

# Plugin Info: "$ARGUMENTS"

You MUST use the `get_plugin_info` MCP tool to fetch live data from the npm registry. Do NOT search local files or grep the codebase for plugin information.

Call `get_plugin_info` with name: "$ARGUMENTS"

Present the returned npm data (version, dependencies, peer dependencies, publish history).

Then suggest: "Run `/pz-next:install $ARGUMENTS` to install and configure this plugin."
