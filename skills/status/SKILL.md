---
name: status
description: Show currently installed pz-* plugins and check for available updates
---

# Installed Plugins Status

You MUST use the `check_updates` MCP tool to compare installed versions against npm. Do NOT manually check npm or guess versions.

Steps:
1. Read `src/plugins.js` to get the list of active plugins
2. Call `check_updates` with project_path set to the current working directory
3. Present the returned update comparison table
4. Flag any plugins in `src/plugins.js` that are missing from `package.json`
