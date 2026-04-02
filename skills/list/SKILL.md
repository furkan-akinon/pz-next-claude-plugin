---
name: list
description: List all available pz-* plugins grouped by category
disable-model-invocation: true
---

# Available pz-* Plugins

List the following plugins grouped by category:

## Payment Methods
| Plugin | Description |
|--------|-------------|
| `pz-apple-pay` | Apple Pay payment integration |
| `pz-bkm` | BKM Express payment method |
| `pz-credit-payment` | Shopping credit / installment payment |
| `pz-cybersource-uc` | CyberSource Ultimate Commerce payment |
| `pz-flow-payment` | Checkout.com Flow hosted payment form |
| `pz-google-pay` | Google Pay payment integration |
| `pz-gpay` | Garanti Pay (Turkish payment method) |
| `pz-masterpass` | Mastercard Masterpass with card management |
| `pz-masterpass-rest` | Modern Masterpass REST API integration |
| `pz-pay-on-delivery` | Cash on delivery payment |
| `pz-saved-card` | Saved card payment with Iyzico support |

## Buy Now Pay Later
| Plugin | Description |
|--------|-------------|
| `pz-haso` | HASO BNPL payment gateway |
| `pz-hepsipay` | Hepsipay wallet payment |
| `pz-tabby-extension` | Tabby BNPL payment gateway |
| `pz-tamara-extension` | Tamara BNPL payment gateway |

## Quick Checkout
| Plugin | Description |
|--------|-------------|
| `pz-akifast` | Fast checkout and quick login (requires pz-one-click-checkout) |
| `pz-one-click-checkout` | One-click checkout with payment providers |

## Shopping Features
| Plugin | Description |
|--------|-------------|
| `pz-basket-gift-pack` | Gift packaging for basket items |
| `pz-checkout-gift-pack` | Gift packaging during checkout |
| `pz-click-collect` | Click and Collect store pickup |
| `pz-multi-basket` | Multiple separate baskets |
| `pz-similar-products` | Image-based similar product search |
| `pz-virtual-try-on` | AR virtual try-on with barcode scanning |

## Business
| Plugin | Description |
|--------|-------------|
| `pz-b2b` | B2B quotations, saved carts, multi-store |

## Utility
| Plugin | Description |
|--------|-------------|
| `pz-otp` | OTP input component for verification flows |

Use `/pz-next:install <plugin-name>` to install a plugin.
Use `/pz-next:info <plugin-name>` for detailed information.
Use `/pz-next:status` to see currently installed plugins.
