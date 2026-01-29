// App version tracking for beta testing and iterative releases.
// Bump this version with each release so saved deals record which
// calculator version produced them. This also lets the stable and
// beta builds coexist — deploy the stable bundle at /calculator and
// the beta bundle at /calculator-beta (or behind a feature flag).

export const APP_VERSION = '1.0.0';

// Channel can be toggled per-build via the VITE_APP_CHANNEL env var.
// In WordPress you can deploy two separate builds:
//   stable  → the production calculator users see today
//   beta    → the pre-release build testers use
export const APP_CHANNEL: 'stable' | 'beta' =
  (import.meta.env.VITE_APP_CHANNEL as 'stable' | 'beta') || 'stable';
