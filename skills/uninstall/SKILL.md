---
name: uninstall
description: Uninstall a pz-* plugin and clean up all integration points
argument-hint: <plugin-name>
disable-model-invocation: true
---

# Uninstall Plugin: "$ARGUMENTS"

You are removing a pz-* plugin from a projectzeronext application.

## Step 1: Remove from plugins.js
Read `src/plugins.js` and remove the plugin name from the array.

## Step 2: Remove component usages
Search the `src/` directory for:
- `Component.{PluginComponentName}` references
- `import.*@akinon/pz-$ARGUMENTS` references
Remove or comment out these usages. Warn the user about each location found.

## Step 3: Remove settings
Check `src/settings.js` for plugin-specific settings and remove them.

## Step 4: Remove translations
List translation keys specific to this plugin in `public/locales/`. Let user decide whether to remove.

## Step 5: Remove pages and API routes
Check for plugin-specific files:
- `src/app/[commerce]/[locale]/[currency]/payment-gateway/*/page.tsx`
- `src/app/api/*-check-availability/route.ts`

## Step 6: Remove assets
Check for plugin assets in `public/` directory (e.g., masterpass SDK files).

## Step 7: Remove npm package
```bash
yarn remove @akinon/pz-$ARGUMENTS
```

## Important
- Always confirm with the user before deleting files
- Reducers and middlewares in `@akinon/next` use fallback patterns - they handle missing plugins gracefully, no action needed
