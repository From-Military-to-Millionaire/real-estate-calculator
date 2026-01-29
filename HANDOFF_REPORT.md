# War Room Calculator — Handoff Report

**Prepared for:** Alex
**Date:** January 29, 2026
**Project:** War Room Real Estate Investment Calculator

---

## What You Gave Us

A real estate investment calculator built as a web application. It lets users analyze properties across three strategies — Long-Term Rentals, Short-Term Rentals (Airbnb), and Fix & Flip — side by side. The app was functional but needed a review before going live with multiple users on your WordPress site.

---

## What We Did

### 1. Full Code Review

We reviewed every part of the application for errors, security issues, and multi-user readiness. Here's the summary:

**What was already working well:**
- User login and signup system
- Each user's data is private and isolated (other users cannot see your deals)
- Saving, loading, and deleting deals
- The overall look, layout, and branding ("War Room" military theme) — untouched per your request

**What we found and fixed:**

| Issue | What It Means | Impact |
|-------|--------------|--------|
| Equity calculation was using simplified math | The calculator was estimating how much of your mortgage you've paid off using a shortcut instead of real amortization math. This made equity numbers too optimistic in the early years. | **Year 1 equity was overstated by roughly $4,800** on a typical deal. Now uses the correct month-by-month calculation. |
| 0% interest rate broke the calculator | If someone entered 0% interest (like seller financing), the mortgage payment showed as $0. | Fixed — now correctly divides the loan over the term. |
| Missing safety filter on user data | The app relied on a single layer of security to keep users' deals private. We added a second layer as a safety net. | No data was at risk, but this is best practice. |
| Save function sent unnecessary data | When updating a deal, the app was sending the user's identity info when it didn't need to. | Cleaned up — user identity is only sent when creating a new deal. |

### 2. Set Up the Database

Your calculator needs a database to store user accounts and saved deals. We set up a new database using **Supabase** (a trusted, industry-standard cloud database service). This includes:

- **User profiles** — automatically created when someone signs up
- **Saved deals** — all 60+ fields for each property analysis
- **Privacy rules** — every user can only see their own deals
- **Auto-timestamps** — tracks when deals were created and last updated
- **Version tracking** — every saved deal now records which version of the calculator created it

**Your Supabase project:** `real_estate_calc` on the FMTM account

### 3. Prepared for Deployment on GitHub

The app is now configured to run on **GitHub Pages** — a free hosting service built into GitHub. This means:

- No monthly hosting fees
- Automatic deployment — when code is updated on the main branch, the app rebuilds and goes live automatically
- Your app will be accessible at a GitHub URL that can be embedded into WordPress

**What was configured:**
- Routing system updated to work with GitHub Pages
- Automatic build-and-deploy pipeline (GitHub Actions)
- Supabase credentials stored securely as encrypted secrets in GitHub

### 4. Built-In Beta Testing Support

Since you'll be collecting feedback from users over the coming months, we added infrastructure to support that:

- **Version numbers** — the app now tracks its version (starting at 1.0.0). Every deal saved records which version created it. When users report issues, you can trace them back to a specific version.
- **Stable vs. Beta builds** — the app supports running two versions at once. Your users see the stable version. Testers can use a separate beta version. When the beta is approved, it becomes the new stable version. This way, the live calculator is never disrupted by ongoing development.

---

## What You Need to Do

### Already Completed
- [x] Database created and configured in Supabase
- [x] SQL tables, security rules, and triggers all set up
- [x] Supabase credentials added to GitHub as secrets
- [x] Code reviewed, bugs fixed, and pushed to GitHub

### You Need to Do These

1. **Enable GitHub Pages**
   - Go to your GitHub repository → **Settings** → **Pages**
   - Under "Build and deployment", set Source to **"GitHub Actions"**

2. **Merge the code to the main branch**
   - On the repository page, you'll see a prompt to create a Pull Request for the branch `claude/review-wordpress-multiuser-RL7wk`
   - Create the Pull Request and merge it into `main`
   - This will automatically trigger the build and deploy

3. **Verify the live app**
   - After the merge, go to the **Actions** tab in GitHub
   - Wait for the build to show a green checkmark
   - Visit the live URL: `https://from-military-to-millionaire.github.io/real-estate-calculator/`
   - Test: sign up, create a deal, enter numbers, save it, go to dashboard, reopen it

4. **Embed in WordPress**
   - On the WordPress page where you want the calculator, add a **Custom HTML** block with:
   ```html
   <iframe
     src="https://from-military-to-millionaire.github.io/real-estate-calculator/"
     width="100%"
     height="900"
     style="border:none;"
     allow="clipboard-write"
   ></iframe>
   ```
   - Adjust the `height` value as needed to fit your page layout

5. **Configure Supabase for your WordPress domain**
   - In Supabase Dashboard → **Authentication** → **URL Configuration**
   - Add your WordPress site's URL to the **Redirect URLs** list
   - This allows the login system to work when embedded in WordPress

---

## What the User Experience Looks Like

1. A user visits your WordPress page and sees the calculator embedded on the page
2. They sign up with email and password (or log in if returning)
3. They create a new deal, name it, and start entering property numbers
4. The calculator instantly shows results for Long-Term Rental, Short-Term Rental, and Fix & Flip — side by side
5. Their work auto-saves as they switch between tabs
6. They can return anytime, see all their saved deals on a dashboard, and pick up where they left off
7. Each user only sees their own deals — fully private

---

## Going Forward — Beta Testing & Updates

When you're ready to start collecting feedback:

1. Share the live link with beta testers
2. Collect feedback (wrong numbers, confusing layout, feature requests)
3. We make fixes and improvements on a separate branch
4. Those changes can be deployed to a separate beta URL for testing without affecting the live calculator
5. Once approved, we merge to main and bump the version (1.0.0 → 1.1.0, etc.)
6. Repeat as needed

---

## Technical Details (For Your Reference)

| Item | Detail |
|------|--------|
| **Frontend** | React + TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **Hosting** | GitHub Pages (free) |
| **Current Version** | 1.0.0 |
| **Repository** | `From-Military-to-Millionaire/real-estate-calculator` |
| **Supabase Project** | `real_estate_calc` (FMTM account) |
| **Live URL (after deploy)** | `https://from-military-to-millionaire.github.io/real-estate-calculator/` |

---

*No changes were made to the calculator's appearance, colors, layout, or branding. All changes were functional — fixing calculation accuracy, adding database support, and preparing for deployment.*
