---
name: info
description: Show detailed information about a specific pz-* plugin
argument-hint: <plugin-name>
disable-model-invocation: true
---

# Plugin Info: "$ARGUMENTS"

Read the plugin's installed package to provide detailed information. Follow these steps:

1. Determine the package name: if "$ARGUMENTS" starts with "pz-", use it. Otherwise prepend "pz-".
2. Read `node_modules/@akinon/<package-name>/package.json` for dependencies and metadata
3. Read `node_modules/@akinon/<package-name>/README.md` for documentation (if exists)
4. Read `node_modules/@akinon/<package-name>/src/index.ts` or `src/index.tsx` for exports
5. Check if the plugin is listed in `src/plugins.js`

If the package is NOT installed (node_modules not found), tell the user to run:
```bash
yarn add @akinon/<package-name>
```

Present the information in this format:

## [Plugin Name]

**Status:** Installed / Not Installed
**Description:** (from README or package.json)
**Version:** (from package.json)

### Exports
- Components: (list all)
- Hooks: (list all)
- Types: (list all)
- Reducers: (if any)
- Middlewares: (if any)

### Dependencies
- Peer dependencies
- Plugin dependencies (e.g., pz-akifast requires pz-one-click-checkout)

### Required Configuration
- Settings needed in src/settings.js
- Translation keys needed in public/locales/
- Routes/rewrites needed
- Environment variables (if any)

### Usage Example
Show a basic PluginModule usage example for the main component.

Then suggest: "Run `/pz-next:install <name>` to install and configure this plugin."
