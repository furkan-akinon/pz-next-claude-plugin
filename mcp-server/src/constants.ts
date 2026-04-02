import type { PluginCategory } from './types.js';

export const NPM_REGISTRY_URL = 'https://registry.npmjs.org';
export const NPM_SCOPE = '@akinon';
export const PLUGIN_PREFIX = 'pz-';

export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const REQUEST_TIMEOUT_MS = 15_000; // 15 seconds
export const MAX_RETRIES = 2;
export const RETRY_DELAY_MS = 1_000;

export const PLUGIN_CATEGORIES: Record<string, PluginCategory> = {
  'pz-apple-pay': 'payment',
  'pz-bkm': 'payment',
  'pz-credit-payment': 'payment',
  'pz-cybersource-uc': 'payment',
  'pz-flow-payment': 'payment',
  'pz-google-pay': 'payment',
  'pz-gpay': 'payment',
  'pz-masterpass': 'payment',
  'pz-masterpass-rest': 'payment',
  'pz-pay-on-delivery': 'payment',
  'pz-saved-card': 'payment',
  'pz-haso': 'bnpl',
  'pz-hepsipay': 'bnpl',
  'pz-tabby-extension': 'bnpl',
  'pz-tamara-extension': 'bnpl',
  'pz-akifast': 'quick-checkout',
  'pz-one-click-checkout': 'quick-checkout',
  'pz-basket-gift-pack': 'shopping',
  'pz-checkout-gift-pack': 'shopping',
  'pz-click-collect': 'shopping',
  'pz-multi-basket': 'shopping',
  'pz-similar-products': 'shopping',
  'pz-virtual-try-on': 'shopping',
  'pz-b2b': 'business',
  'pz-otp': 'utility',
};

export const CATEGORY_LABELS: Record<PluginCategory, string> = {
  payment: 'Payment Methods',
  bnpl: 'Buy Now Pay Later',
  'quick-checkout': 'Quick Checkout',
  shopping: 'Shopping Features',
  business: 'Business',
  utility: 'Utility',
  unknown: 'Other',
};
