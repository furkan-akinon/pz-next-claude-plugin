---
name: status
description: Show currently installed pz-* plugins and check for available updates
---

# Installed Plugins Status

1. Read `src/plugins.js` to get the list of active plugins in this project.

2. Call the `check_updates` MCP tool from the `pz-next-registry` server with the current project path to compare installed versions against latest npm versions.

3. Present the results as a combined table showing:
   - Plugin name
   - Installed version
   - Latest version
   - Whether an update is available

4. Check for issues:
   - Plugins in `src/plugins.js` but not in `package.json`
   - Missing `node_modules/@akinon/pz-*` directories for active plugins
   - Missing peer dependencies (e.g., `pz-akifast` requires `pz-one-click-checkout`)
