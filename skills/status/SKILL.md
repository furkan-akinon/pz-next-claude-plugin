---
name: status
description: Show currently installed pz-* plugins and their status
disable-model-invocation: true
---

# Installed Plugins Status

Read `src/plugins.js` and show the currently active plugins.

Cross-reference with the full list of 25 available plugins:
pz-akifast, pz-apple-pay, pz-b2b, pz-basket-gift-pack, pz-bkm, pz-checkout-gift-pack, pz-click-collect, pz-credit-payment, pz-cybersource-uc, pz-flow-payment, pz-google-pay, pz-gpay, pz-haso, pz-hepsipay, pz-masterpass, pz-masterpass-rest, pz-multi-basket, pz-one-click-checkout, pz-otp, pz-pay-on-delivery, pz-saved-card, pz-similar-products, pz-tabby-extension, pz-tamara-extension, pz-virtual-try-on

Present as a table:

| Plugin | Status | Category |
|--------|--------|----------|

Also check for issues:
- Duplicate entries in plugins.js
- Missing npm packages (check if node_modules/@akinon/pz-<name> exists for each active plugin)
- Missing peer dependencies (e.g., pz-akifast requires pz-one-click-checkout)
