# War Room Calculator — Code Review & WordPress Readiness Report

**Date:** January 29, 2026
**Version reviewed:** Pre-1.0 (commit 5546be2)
**Reviewer scope:** Multi-user safety, database functionality, beta-testing readiness, calculation accuracy

---

## 1. Multi-User / WordPress Integration Review

### What's already solid
- **Row-Level Security (RLS)** is enabled on both `profiles` and `property_analyses` tables. Each user can only read/write their own data at the database level.
- **Supabase Auth** handles session management per-browser with JWT tokens stored in `localStorage`. Multiple users on different machines/browsers are fully isolated.
- **Auto-created profiles** via database trigger on signup — no race conditions.
- **Protected routes** properly redirect unauthenticated users to `/auth`.

### Issues found & fixed
| Issue | Severity | Status |
|-------|----------|--------|
| Dashboard query relied solely on RLS with no client-side `user_id` filter. If RLS were ever misconfigured, all users' data would leak. | Medium | **Fixed** — added `.eq('user_id', user.id)` as defense-in-depth. |
| Auto-save sent `user_id` in the UPDATE payload (unnecessary and could theoretically be manipulated). | Low | **Fixed** — `user_id` is now only sent on INSERT (new analysis creation). |

### WordPress embedding notes
- This is a React SPA using `BrowserRouter` (URL-path-based routing). When embedded in WordPress:
  - **Option A (recommended):** Deploy as a standalone subdomain (e.g., `app.warroom.com`) or a dedicated WordPress page with an iframe/embed.
  - **Option B:** Use `HashRouter` instead of `BrowserRouter` to avoid conflicts with WordPress's URL routing. This is a one-line change in `App.tsx` if needed.
  - **Server config:** If using Option A with a custom domain, the web server must return `index.html` for all routes (standard SPA fallback). WordPress hosting with a subfolder deploy would need `.htaccess` or Nginx rewrite rules.
- **CORS:** Supabase handles CORS on its end. The WordPress domain just needs to be allowed in Supabase project settings (Dashboard → Auth → URL Configuration).
- **Multiple tabs:** If a user opens the same analysis in two tabs, the last save wins. There's no conflict resolution — this is acceptable for a calculator tool but worth noting.

---

## 2. Database Functionality — Save, Return, New Deals

### Current capabilities (all working)
- **Save deals:** Auto-saves on tab change + manual save button. All 60+ fields are persisted.
- **Return to saved deals:** Dashboard lists all analyses with name, address, price, and last-updated date. Clicking "View" loads all fields back.
- **Start new deals:** "New Analysis" button prompts for a name, creates a DB record, and navigates to the editor.
- **Delete deals:** Confirmation dialog before deletion.

### What was added
- **`app_version` column** on `property_analyses` — every save now stamps which calculator version produced it. This is critical for:
  - Identifying deals saved with a buggy beta version
  - Migrating data if calculation formulas change between versions
  - Auditing which version a user was running when they report a problem

---

## 3. Beta Testing Infrastructure

### Version tracking system (added)
- `src/lib/version.ts` exports `APP_VERSION` (semver) and `APP_CHANNEL` (`'stable'` | `'beta'`).
- Channel is controlled via the `VITE_APP_CHANNEL` environment variable at build time.
- Every saved analysis now records `app_version` in the database.

### Recommended deployment strategy for beta testing

```
WordPress Site
├── /calculator        → Stable build (VITE_APP_CHANNEL=stable)
│                        Users see this. Don't touch it.
│
└── /calculator-beta   → Beta build (VITE_APP_CHANNEL=beta)
                         Testers use this. Deploy freely.
```

**How to execute:**
1. Build stable: `VITE_APP_CHANNEL=stable npm run build` → deploy to `/calculator`
2. Build beta: `VITE_APP_CHANNEL=beta npm run build` → deploy to `/calculator-beta`
3. Both builds share the same Supabase database, so testers see their real deals.
4. When beta is validated, promote it to stable by rebuilding with `VITE_APP_CHANNEL=stable` and bumping `APP_VERSION` in `version.ts`.

### Iteration workflow
1. Collect user feedback during beta period
2. Fix issues on a development branch
3. Deploy fixes to `/calculator-beta` for re-testing
4. Once confirmed, bump version (e.g., `1.0.0` → `1.1.0`), rebuild, deploy to `/calculator`
5. Repeat

---

## 4. Calculation Accuracy Review

### Critical bug fixed: Equity buildup used wrong math
- **Before:** Principal paydown was calculated as `loanAmount / loanTermYears` (linear — assumes equal principal payments each year). This is **wrong** for standard amortized mortgages where early payments are mostly interest.
- **After:** Replaced with `calculatePrincipalPaidDown()` which walks the actual amortization schedule month-by-month.
- **Impact:** Year 1 equity was being **overestimated** significantly. For a $240K loan at 7% over 30 years:
  - Old (linear): ~$8,000/year principal paydown
  - Correct (amortized): ~$3,200 in year 1
  - This means year-1 equity was overstated by roughly $4,800.

### Bug fixed: 0% interest rate crashed the mortgage calculation
- `calculateMonthlyMortgage` returned 0 when `annualRate <= 0`. A 0% interest loan (e.g., seller financing) still has a payment of `principal / totalMonths`. Fixed.

### Calculations verified as correct
| Formula | Status |
|---------|--------|
| Monthly mortgage (amortization) | Correct |
| LTR cash flow (rent - all expenses) | Correct |
| Cash-on-cash return | Correct |
| Cap rate (NOI / purchase price) | Correct |
| 10-year cumulative ROI with rent appreciation | Correct |
| STR gross income (nightly rate × occupancy + cleaning) | Correct |
| STR break-even occupancy | Correct |
| Flip net profit (ARV - all costs) | Correct |
| Flip ROI (profit / total investment) | Correct |
| Flip My ROI (profit / cash invested) | Correct |
| Refinance waterfall logic | Correct |

### Minor accuracy note (not changed — by design)
- The 10-year ROI calculation assumes property taxes and insurance stay flat while rent appreciates. In reality, taxes often increase with property value. This is a reasonable simplification for a calculator tool but could be noted in the UI as an assumption.
- STR seasonality uses a simple average of high/low multipliers rather than weighted months. This is fine for estimates.

---

## 5. Additional Observations (no changes made — informational)

### Things that work well and should not be touched
- **UI/UX:** The military "War Room" theming, color scheme, layout, and responsive design are polished. No changes made per client request.
- **Auto-save mechanism:** Works correctly. The `isAutoSaving` ref prevents concurrent saves.
- **Form input handling:** The `InputField` and `SyncedInputField` components handle focus/blur/formatting correctly.
- **Supabase client configuration:** Properly uses env vars, persistent sessions, and auto-refresh tokens.

### Things to watch during beta
- **Large number inputs:** No upper bound validation on fields like purchase price. A user entering `999999999999` won't break the math but could produce confusing results.
- **Negative inputs:** The calculator accepts negative numbers in some fields (e.g., negative appreciation rate). This is actually useful (depreciation scenario) but may confuse users.
- **Session expiry:** Supabase tokens auto-refresh, but if a user leaves the tab open for days and the refresh fails, the next save will silently fail. The auto-save error is caught and logged to console but not shown to the user.
- **No "undo" or "revision history":** If a user accidentally overwrites good data, there's no way to recover. Consider adding this in a future version.

---

## Summary of Changes Made

| File | Change |
|------|--------|
| `src/lib/calculations.ts` | Fixed principal paydown to use actual amortization math; fixed 0% interest rate handling; added `calculatePrincipalPaidDown` function |
| `src/pages/Analyze.tsx` | Added version import; stamps `app_version` on every save; removed `user_id` from update payloads |
| `src/pages/Dashboard.tsx` | Added explicit `user_id` filter + `user` dependency to fetch effect |
| `src/lib/version.ts` | **New file** — app version and channel tracking |
| `supabase/migrations/20260129000000_add_app_version.sql` | **New migration** — adds `app_version` column |
| `REVIEW.md` | **This document** |

No styling, layout, or color changes were made.
