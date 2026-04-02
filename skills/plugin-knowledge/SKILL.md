---
name: plugin-knowledge
description: Knowledge base for pz-* plugin system in Project Zero Next. Use when the user asks about plugins, payment integrations, plugin configuration, or PluginModule usage.
user-invocable: false
---

# pz-* Plugin System Knowledge

## Plugin Architecture

Project Zero Next has 25 available plugins as npm packages under `@akinon/pz-*`. Partners install them with `yarn add @akinon/pz-<name>`.

Plugins are dynamically loaded via the `PluginModule` component from `@akinon/next/components/plugin-module`.

## How Plugins Work

1. **Install:** `yarn add @akinon/pz-<name>`
2. **Activate:** Add plugin name to `src/plugins.js` array
3. **Use:** `<PluginModule component={Component.X} props={{}} />`
4. **Configure:** Add settings to `src/settings.js` under `plugins[pluginName]`

Settings from `settings.js` are automatically injected as props to plugin components.
Reducers and middlewares use fallback patterns - missing plugins don't break the app.

## Plugin Categories

- **Payment Methods:** apple-pay, bkm, credit-payment, cybersource-uc, flow-payment, google-pay, gpay, masterpass, masterpass-rest, pay-on-delivery, saved-card
- **BNPL:** haso, hepsipay, tabby-extension, tamara-extension
- **Quick Checkout:** akifast (requires one-click-checkout), one-click-checkout
- **Shopping Features:** basket-gift-pack, checkout-gift-pack, click-collect, multi-basket, similar-products, virtual-try-on
- **Business:** b2b
- **Utility:** otp

## Using PluginModule

```tsx
import PluginModule, { Component } from '@akinon/next/components/plugin-module'

<PluginModule
  component={Component.BasketGiftPack}
  props={{ basketItem, translations: { ... } }}
/>
```

## Plugins with Pre-registered Redux State

These reducers are already registered in `@akinon/next`. No setup needed:
- `masterpass` -> masterpassReducer (pz-masterpass)
- `masterpassRest` -> masterpassRestReducer (pz-masterpass-rest)
- `otp` -> otpReducer (pz-otp)
- `savedCard` -> savedCardReducer (pz-saved-card)
- `cybersource_uc` -> cyberSourceUcReducer (pz-cybersource-uc)

## Plugins NOT in PluginModule (direct import)

These are imported directly rather than through PluginModule:
- `pz-apple-pay` -> `import ApplePayView from '@akinon/pz-apple-pay'`
- `pz-tabby-extension` -> `import { TabbyPaymentGateway } from '@akinon/pz-tabby-extension'`
- `pz-tamara-extension` -> `import { TamaraPaymentGateway } from '@akinon/pz-tamara-extension'`
- `pz-cybersource-uc` -> `import { CyberSourceUcPaymentOption } from '@akinon/pz-cybersource-uc'`

## Payment Gateway Plugins (require page creation)

These need dedicated pages at `src/app/[commerce]/[locale]/[currency]/payment-gateway/{name}/page.tsx` and API routes at `src/app/api/{name}-check-availability/route.ts`:
- pz-haso, pz-tabby-extension, pz-tamara-extension

## Plugin Props Pattern

All plugins support customization:
- `translations` -- override default text labels
- `customUIRender` -- complete UI replacement function
- `renderer` -- partial render function overrides
- `classes` -- CSS class overrides (via tailwind-merge)
- `settings` -- auto-injected from settings.js
