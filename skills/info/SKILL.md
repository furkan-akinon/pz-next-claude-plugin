---
name: info
description: Show detailed information about a specific pz-* plugin with live npm data
argument-hint: <plugin-name>
---

# Plugin Info: "$ARGUMENTS"

Call the `get_plugin_info` MCP tool from the `pz-next-registry` server with the plugin name "$ARGUMENTS".

This returns: latest version, all published versions, dependencies, peer dependencies, category, and last publish date.

Additionally, check if the plugin is currently installed in this project:
1. Check if `node_modules/@akinon/$ARGUMENTS` exists
2. Check if the plugin is listed in `src/plugins.js`

Present both the live npm data and the local installation status.

Then suggest: "Run `/pz-next:install $ARGUMENTS` to install and configure this plugin."
