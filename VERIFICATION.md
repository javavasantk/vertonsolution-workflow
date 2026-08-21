# Project Polaris Verification Notes

## Visual review — 2026-08-21

The public home, catalog, AeroForge lab, pricing, projects, showcase, schools, and contact routes were captured at **1280px** and **375px** widths. The layout retained the dark violet/gold visual system, visible typography, card hierarchy, responsive single-column stacking, legible form controls, and accessible primary actions at both breakpoints.

The light-mode browser capture of the home route was also reviewed. It preserved the hierarchy of the Playfair headings, black/charcoal text on pale surfaces, violet primary actions, gold accents, card borders, and the simulator panel’s darker measurement surface. The contrast remained legible across catalog cards, pathway rows, controls, CTA bands, and footer content.

The light-mode **pricing** review confirmed that the plan comparisons, feature checkmarks, disabled configuration-required actions, Razorpay notice, ledger panel, and footer remain readable on pale card surfaces. The light-mode **authentication** review confirmed that labels, required markers, inputs, tabs, password affordance, gradient submission control, and Google action retain clear contrast and focusable visual boundaries.

The pricing route deliberately displays the configuration-required state until Razorpay credentials are supplied. The AeroForge lab correctly presents Explorer-level trial saving as an upgrade action. Functional workspace, premium trial, credential, and Co-Pilot flows were separately exercised through controlled browser validation and then cleaned from the database.

## Test review

`pnpm test` passed: 5 files, 11 assertions. Coverage includes session logout, Google OAuth credential configuration, Razorpay signature and webhook verification, subscription gates, Explorer restrictions for trial saving and Co-Pilot access, and AeroForge solver behaviour.

## Deferred external acceptance checks

1. Add Razorpay credentials and confirm a live/test order, payment verification, webhook event, and end-of-cycle provider cancellation.
2. Register the deployed Google callback URL in Google Cloud and complete a real Google consent login.

## Integration disposition

Google OAuth is configured. The final pre-delivery check reconfirmed an authorization redirect to Google, an `HttpOnly` state cookie with `SameSite=Lax`, safe state/error callback recovery, and visible user guidance. A real consent return remains a normal post-publish acceptance step because it must use the production callback URL.

Razorpay activation is **deferred at the user’s request**. The application contains the secure order, signature-verification, signed-webhook, subscription-record, provider cancellation, and end-of-period access paths, but test/live credentials and recurring Razorpay Plan IDs have not been supplied. Once available, perform the checkout, webhook, cancellation, and grace-period acceptance checks listed above.
