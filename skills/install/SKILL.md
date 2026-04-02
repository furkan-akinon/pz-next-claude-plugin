---
name: install
description: Install and fully configure a pz-* plugin in a projectzeronext project. Handles package install, plugins.js, settings, translations, component integration.
argument-hint: <plugin-name>
disable-model-invocation: true
---

# Install Plugin: "$ARGUMENTS"

You are installing a pz-* plugin into a projectzeronext application. Partners clone projectzeronext and install packages from npm. They do NOT have the monorepo.

## Project Structure (Partner)

```
projectzeronext/
├── src/
│   ├── app/[commerce]/[locale]/[currency]/   # App Router pages
│   ├── views/                                 # View components
│   ├── components/                            # UI components
│   ├── plugins.js                             # Active plugin list
│   ├── settings.js                            # App config
│   └── routes/                                # Route definitions
├── public/locales/{en,tr}/                    # Translation files
├── package.json
└── node_modules/@akinon/                      # Installed from npm
```

## General Installation Procedure

### Step 1: Install the npm package
```bash
yarn add @akinon/pz-$ARGUMENTS
```

### Step 2: Add to plugins.js
Read `src/plugins.js` and add the plugin name (without `@akinon/` prefix) to the exported array. Example: `'pz-masterpass-rest'`

### Step 3: Plugin-specific integration
Follow the plugin-specific steps from the catalog below.

### Step 4: Verify
Run `yarn dev` and check the browser console for errors.

---

## Plugin Catalog

Find "$ARGUMENTS" below and follow ALL listed steps.

---

### pz-akifast

**Purpose:** Fast checkout and quick login.

**Prerequisite:** `pz-one-click-checkout` must be installed first.
```bash
yarn add @akinon/pz-one-click-checkout @akinon/pz-akifast
```

**Settings (src/settings.js):**
```javascript
plugins: {
  'pz-akifast': {
    quickLogin: false,  // show on login page
    pdp: false,         // show on product detail page
    basket: false       // show on basket page
  }
}
```

**Component Integration:**
```tsx
import PluginModule, { Component } from '@akinon/next/components/plugin-module'

// Login page - quick login button
<PluginModule component={Component.AkifastQuickLoginButton} props={{}} />

// PDP or basket - checkout button
<PluginModule component={Component.AkifastCheckoutButton} props={{ product, productQuantity }} />
```

---

### pz-apple-pay

**Purpose:** Apple Pay payment integration.

```bash
yarn add @akinon/pz-apple-pay
```

**Note:** This plugin is imported directly, NOT via PluginModule.

**Component Integration:**
1. Create `src/views/checkout/steps/payment/options/apple-pay.tsx`:
```tsx
'use client'
import ApplePayView from '@akinon/pz-apple-pay'

export default function ApplePayOption(props) {
  return <ApplePayView {...props} />
}
```

2. Add to `PaymentOptionViews` in `src/views/checkout/steps/payment/index.tsx`:
```tsx
import ApplePayOption from './options/apple-pay'

export const PaymentOptionViews: Array<CheckoutPaymentOption> = [
  { slug: 'apple-pay', view: ApplePayOption }
]
```

---

### pz-b2b

**Purpose:** B2B quotations, saved carts, multi-store selection.

```bash
yarn add @akinon/pz-b2b
```

**Routes (src/routes/index.ts):**
Add to `ACCOUNT_ROUTES`:
```typescript
ACCOUNT_MY_QUOTATIONS = '/users/my-quotations'
```

**Rewrites (src/settings.js):**
```javascript
rewrites: [
  // ... existing rewrites
  { source: ROUTES.BASKET, destination: '/basket-b2b' },
  { source: ROUTES.ACCOUNT_MY_QUOTATIONS, destination: '/account/my-quotations' }
]
```

**Account Menu (src/views/account/account-menu.tsx):**
Add quotations link:
```tsx
{ label: t('account.base.menu.my_quotations'), href: ROUTES.ACCOUNT_MY_QUOTATIONS }
```

**Translations (public/locales/en/):**

account.json:
```json
{ "base": { "menu": { "my_quotations": "My Quotations" } } }
```

product.json:
```json
{ "store_select_modal": { "title": "Select Store", "store_name": "Store Name", "quantity": "Quantity", "add_to_basket": "Add to Basket", "valid_quantity": "Please enter a valid quantity" } }
```

basket.json:
```json
{ "b2b": { "my_cart": "My Cart", "back_to_shopping": "Back to Shopping", "save_cart": "Save Cart", "request_quote": "Request Quote", "total_price": "Total Price", "empty": "Your cart is empty" } }
```

**Component Integration:**
```tsx
import PluginModule, { Component } from '@akinon/next/components/plugin-module'

// Basket page (replaces default basket)
<PluginModule component={Component.BasketB2B} props={{}} />

// Account quotations page
<PluginModule component={Component.MyQuotationsB2B} props={{}} />

// Product info page - store selection
import { useB2b } from '@akinon/pz-b2b'
const { openSelectStoreModal, setOpenSelectStoreModal, divisions, B2bButton } = useB2b()
```

---

### pz-basket-gift-pack

**Purpose:** Gift packaging for basket items.

```bash
yarn add @akinon/pz-basket-gift-pack
```

**No special config needed.**

```tsx
import PluginModule, { Component } from '@akinon/next/components/plugin-module'

<PluginModule
  component={Component.BasketGiftPack}
  props={{
    basketItem,
    useModal: true,
    translations: {
      addGiftPack: 'Add Gift Pack',
      removeGiftPack: 'Remove Gift Pack',
      giftPackAdded: 'Gift Pack Added'
    }
  }}
/>
```

---

### pz-bkm

**Purpose:** BKM Express payment method.

```bash
yarn add @akinon/pz-bkm
```

**Component Integration:**
Add to `PaymentOptionViews` in `src/views/checkout/steps/payment/index.tsx`:
```tsx
{ slug: 'bkm_express', view: (props) => <PluginModule component={Component.BKMExpress} props={props} /> }
```

---

### pz-checkout-gift-pack

**Purpose:** Gift packaging during checkout.

```bash
yarn add @akinon/pz-checkout-gift-pack
```

**Component Integration:**
```tsx
<PluginModule component={Component.CheckoutGiftPack} props={{ maxNoteLength: 160 }} />
```

---

### pz-click-collect

**Purpose:** Click and Collect store pickup.

```bash
yarn add @akinon/pz-click-collect
```

**Component Integration:**
Add in checkout delivery step:
```tsx
<PluginModule
  component={Component.ClickCollect}
  props={{
    addressTypeParam: 'shippingAddressPk',
    translations: {
      deliveryFromTheStore: 'Delivery from the Store',
      deliveryStore: 'Delivery Store'
    }
  }}
/>
```

---

### pz-credit-payment

**Purpose:** Shopping credit / installment payment.

```bash
yarn add @akinon/pz-credit-payment
```

**Component Integration:**
```tsx
<PluginModule
  component={Component.CreditPayment}
  props={{
    agreementCheckbox: <AgreementCheckbox />,
    translations: { title: 'Shopping Credit', buttonName: 'Place Order' }
  }}
/>
```

---

### pz-cybersource-uc

**Purpose:** CyberSource Ultimate Commerce payment.

```bash
yarn add @akinon/pz-cybersource-uc
```

**Note:** Imported directly, NOT via PluginModule. Reducer and middleware are pre-registered in `@akinon/next`.

```tsx
import { CyberSourceUcPaymentOption } from '@akinon/pz-cybersource-uc'

<CyberSourceUcPaymentOption {...paymentProps} />
```

---

### pz-flow-payment

**Purpose:** Checkout.com Flow hosted payment form.

```bash
yarn add @akinon/pz-flow-payment
```

```tsx
<PluginModule
  component={Component.FlowPayment}
  props={{ environment: 'sandbox', locale: 'en' }}
/>
```

---

### pz-google-pay

**Purpose:** Google Pay payment.

```bash
yarn add @akinon/pz-google-pay
```

1. Create `src/views/checkout/steps/payment/options/google-pay.tsx`:
```tsx
'use client'
import PluginModule, { Component } from '@akinon/next/components/plugin-module'

export default function GooglePayOption(props) {
  return <PluginModule component={Component.GooglePay} props={props} />
}
```

2. Add to `PaymentOptionViews`:
```tsx
{ slug: 'google-pay', view: GooglePayOption }
```

---

### pz-gpay

**Purpose:** Garanti Pay (Turkish payment).

```bash
yarn add @akinon/pz-gpay
```

Add to `PaymentOptionViews`:
```tsx
{ slug: 'gpay', view: (props) => <PluginModule component={Component.GPay} props={props} /> }
```

---

### pz-haso

**Purpose:** HASO Buy Now Pay Later payment gateway.

```bash
yarn add @akinon/pz-haso
```

**Environment Variables (.env):**
```env
HASO_EXTENSION_URL=<haso-api-url>
HASO_HASH_KEY=<haso-hash-key>
```

**Create Payment Gateway Page:**
`src/app/[commerce]/[locale]/[currency]/payment-gateway/haso/page.tsx`:
```tsx
import PluginModule, { Component } from '@akinon/next/components/plugin-module'

export default function HasoPage({ searchParams }) {
  return (
    <PluginModule
      component={Component.HasoPaymentGateway}
      props={{ sessionId: searchParams.sessionId, currency: 'TRY', locale: 'tr' }}
    />
  )
}
```

**Create API Route:**
`src/app/api/haso-check-availability/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const response = await fetch(`${process.env.HASO_EXTENSION_URL}/check-availability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  return NextResponse.json(await response.json())
}
```

---

### pz-hepsipay

**Purpose:** Hepsipay wallet payment.

```bash
yarn add @akinon/pz-hepsipay
```

```tsx
<PluginModule
  component={Component.Hepsipay}
  props={{
    agreementCheckbox: <AgreementCheckbox />,
    translations: {
      placeholderInput: 'Pay with Hepsipay',
      availableWarning: 'Hepsipay is not available',
      agreementError: 'Please accept the agreement'
    }
  }}
/>
```

---

### pz-masterpass

**Purpose:** Mastercard Masterpass with card management, OTP, linking.

```bash
yarn add @akinon/pz-masterpass
```

**Reducer:** Pre-registered in `@akinon/next` as `masterpass`. No action needed.

```tsx
<PluginModule component={Component.MasterpassProvider} props={{ additionalParams: {} }}>
  <PluginModule component={Component.MasterpassCardList} props={{}} />
  <PluginModule component={Component.MasterpassCardRegistration} props={{}} />
  <PluginModule component={Component.MasterpassDeleteConfirmationModal} props={{}} />
  <PluginModule component={Component.MasterpassOtpModal} props={{}} />
  <PluginModule component={Component.MasterpassLinkModal} props={{}} />
</PluginModule>
```

---

### pz-masterpass-rest

**Purpose:** Modern Masterpass REST API.

```bash
yarn add @akinon/pz-masterpass-rest
```

**Reducer:** Pre-registered in `@akinon/next` as `masterpassRest`. No action needed.

**CRITICAL - Copy SDK to public:**
```bash
cp node_modules/@akinon/pz-masterpass-rest/assets/masterpass-javascript-sdk-web.min.js public/
```

```tsx
<PluginModule
  component={Component.MasterpassRest}
  props={{ locale: 'tr', currency: 'TRY' }}
/>
```

---

### pz-multi-basket

**Purpose:** Multiple separate baskets.

```bash
yarn add @akinon/pz-multi-basket
```

**Settings (src/settings.js):**
```javascript
plugins: { multiBasket: true }
```

```tsx
<PluginModule component={Component.MultiBasket} props={{ BasketItem: YourBasketItemComponent }} />
```

---

### pz-one-click-checkout

**Purpose:** One-click checkout with payment providers.

```bash
yarn add @akinon/pz-one-click-checkout
```

```tsx
<PluginModule
  component={Component.OneClickCheckoutButtons}
  props={{ product, productQuantity: 1, clearBasket: false }}
/>
```

---

### pz-otp

**Purpose:** OTP input component.

```bash
yarn add @akinon/pz-otp
```

**Reducer:** Pre-registered in `@akinon/next` as `otp`. No action needed.

```tsx
<PluginModule component={Component.Otp} props={{}} />
```

Use `showPopup` / `hidePopup` Redux actions to control visibility.

---

### pz-pay-on-delivery

**Purpose:** Cash on delivery payment.

```bash
yarn add @akinon/pz-pay-on-delivery
```

```tsx
<PluginModule
  component={Component.PayOnDelivery}
  props={{
    agreementCheckbox: <AgreementCheckbox />,
    translations: {
      paymentInformationTitle: 'Pay on Delivery',
      totalAmountText: 'Total Amount',
      placeOrderText: 'Place Order'
    }
  }}
/>
```

---

### pz-saved-card

**Purpose:** Saved card payment with Iyzico.

```bash
yarn add @akinon/pz-saved-card
```

**Reducer + Middleware:** Pre-registered in `@akinon/next`. No action needed.

Standard: `<PluginModule component={Component.SavedCard} props={paymentProps} />`
Iyzico: `<PluginModule component={Component.IyzicoSavedCard} props={paymentProps} />`

---

### pz-similar-products

**Purpose:** Image-based similar product search.

```bash
yarn add @akinon/pz-similar-products
```

Multiple entry points:
```tsx
// Product page
<PluginModule component={Component.SimilarProductsPlugin} props={{ product }} />

// Header search
<PluginModule component={Component.HeaderImageSearchFeature} props={{}} />

// Image search button
<PluginModule component={Component.ImageSearchButton} props={{}} />

// Results page
<PluginModule component={Component.SimilarProductsModal} props={{}} />
<PluginModule component={Component.SimilarProductsFilterSidebar} props={{}} />
<PluginModule component={Component.SimilarProductsResultsGrid} props={{}} />
```

---

### pz-tabby-extension

**Purpose:** Tabby BNPL payment gateway.

```bash
yarn add @akinon/pz-tabby-extension
```

**Note:** Imported directly, NOT via PluginModule.

**Create Page:** `src/app/[commerce]/[locale]/[currency]/payment-gateway/tabby/page.tsx`:
```tsx
import { TabbyPaymentGateway } from '@akinon/pz-tabby-extension'

export default function TabbyPage({ searchParams }) {
  return <TabbyPaymentGateway sessionId={searchParams.sessionId} />
}
```

**Create API Route:** `src/app/api/tabby-check-availability/route.ts`

---

### pz-tamara-extension

**Purpose:** Tamara BNPL payment gateway.

```bash
yarn add @akinon/pz-tamara-extension
```

**Note:** Imported directly, NOT via PluginModule.

**Create Page:** `src/app/[commerce]/[locale]/[currency]/payment-gateway/tamara/page.tsx`:
```tsx
import { TamaraPaymentGateway } from '@akinon/pz-tamara-extension'

export default function TamaraPage({ searchParams }) {
  return <TamaraPaymentGateway sessionId={searchParams.sessionId} />
}
```

**Create API Route:** `src/app/api/tamara-check-availability/route.ts`

---

### pz-virtual-try-on

**Purpose:** AR virtual try-on with barcode scanning.

```bash
yarn add @akinon/pz-virtual-try-on
```

```tsx
// Product page
<PluginModule component={Component.VirtualTryOnPlugin} props={{ product }} />

// Basket
<PluginModule component={Component.BasketVirtualTryOn} props={{ basketItem }} />

// Barcode scanner
<PluginModule component={Component.BarcodeScannerPlugin} props={{}} />
```

---

## After Installation

1. Run `yarn dev` to verify the plugin loads
2. Check browser console for missing dependencies or config errors
3. Test the plugin in its relevant page (checkout, basket, PDP, etc.)

## Troubleshooting

- **Not rendering:** Check `src/plugins.js` includes the plugin name
- **Module not found:** Run `yarn add @akinon/pz-<name>` - package may not be installed
- **Payment option not showing:** The backend must also have the payment option configured
- **Translation missing:** Add required keys to `public/locales/{en,tr}/` JSON files
