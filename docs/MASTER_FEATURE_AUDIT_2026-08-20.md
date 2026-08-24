# RoadResQ Master Full-Stack Feature Audit

Date: August 20, 2026

Scope reviewed:

- `vehicle-frontend`
- `vehicle-backend`
- frontend routes, pages, components, and role flows
- backend routes, controllers, models, and validation
- current customer, partner, admin, and public modules
- lifecycle, support, notifications, payments, analytics, and security posture

Important audit note:

- This report is based on the current repository state.
- This is an audit-first report.
- No new implementation is proposed here until the audit is reviewed.

---

# Executive Summary

RoadResQ already has a strong multi-role foundation.

Main strengths:

- public, customer, partner, and admin modules already exist
- backend models and routes cover most core marketplace entities
- customer request lifecycle, quote flow, and admin live operations are materially implemented
- city, zone, dispatch scoring, analytics, and support entities already exist
- current architecture is reusable and can later be split into separate apps

Main weaknesses:

- payment flow is still mock/manual-readiness, not real payment automation
- no centralized automation engine, queue, scheduler, or background jobs
- no real-time WebSocket/push architecture found
- test coverage is effectively missing in application code
- request lifecycle consistency was improved recently, but some older screens and legacy pages still coexist
- security has at least one critical issue: hardcoded JWT secret in backend
- frontend bundle size is heavy, especially map-related chunks

Priority summary:

- `P0`: security secret handling, real payment/business truth gaps, missing test safety for core flows
- `P1`: automation engine, re-dispatch reliability, support context enrichment, notification delivery architecture, lifecycle consistency cleanup
- `P2`: UX simplification, accessibility improvements, richer personalization, map/load optimization
- `P3`: advanced fraud scoring, full push/WhatsApp orchestration, deeper recommendation systems

---

# A. Current Feature Inventory

| Feature | Screen | API | Backend | Database | Status | Notes |
|---|---|---|---|---|---|---|
| Public landing and brand pages | Public pages | Indirect | Static/frontend only | None | EXISTS | SEO/public presence exists |
| Service discovery pages | `/services`, `/cities`, city/service pages | `/public/services`, `/public/vehicles`, `/public/specific-services`, city config routes | `publicController`, `settingsController`, `regionalConfigController` | `ServiceType`, `VehicleType`, `SpecificService`, `CityConfig`, `ZoneConfig` | EXISTS | Good foundation |
| Public mechanic discovery list/map | `ListPage`, `MapPage`, `MapCNPage` | `/public/mechanics`, `/public/route` | `publicController` | `Mechanic` | PARTIAL | Discovery exists, not deeply tied to customer request funnel |
| Emergency hub | `EmergencyHubPage` | None required | Frontend/content driven | None | EXISTS | Safety content exists |
| Mechanic onboarding submission | `SubmitMechanicPage` | `/public/mechanics/register` | `publicController` | `Mechanic`, `VerificationRequest` | EXISTS | Good public acquisition flow |
| Mechanic verification claim/setup | `VerifyStartPage`, `VerifyFlowPage` | `/public/check-email`, `/public/send-otp`, `/public/verify-otp`, `/public/setup-account` | `publicController`, `authController` | `User`, `Otp`, `Mechanic` | EXISTS | Legacy + current flow overlap |
| Customer OTP login | Customer auth entry flow | `/customer/auth/send-otp`, `/customer/auth/verify-otp` | `customerController` | `User`, `Otp`, `CustomerProfile` | EXISTS | Recently hardened |
| Customer home dashboard | `CustomerHomePage` | `/customer/profile`, `/customer/requests/history` | `customerController` | `CustomerProfile`, `CustomerRequest` | PARTIAL | Strong core, but home personalization still limited |
| Customer request creation | `CustomerRequestFlow` | `/customer/requests` | `customerController` | `CustomerRequest` | EXISTS | Core flow works |
| Customer searching state | `CustomerSearchingPage` | `/customer/requests/:id/status` | `requestOperationsController` | `CustomerRequest`, `RequestDispatchAttempt` | PARTIAL | Good UI, but limited live channel sophistication |
| Customer live request tracking | `CustomerActiveServicePage`, `CustomerRequestStatusPage` | `/customer/requests/:id/status` | `requestOperationsController` | `CustomerRequest`, `RequestTimelineEvent`, `RequestAssignment` | EXISTS | Much improved recently |
| Customer quote review | `CustomerQuotePage` | `/customer/requests/:id/quote`, approve/reject routes | `requestOperationsController` | `RequestQuote`, `RequestQuoteLineItem` | EXISTS | Good structure |
| Customer payment stage | `CustomerPaymentPage` | `/customer/requests/:id/payment/initiate`, `/payment/status` | `requestOperationsController` | `PaymentTransaction` | WEAK | Not a real gateway flow yet |
| Customer rating flow | `CustomerRatingPage` | No strong rating completion API found in customer request flow routes | mixed | `Review` exists | PARTIAL | Rating UI exists, end-to-end service rating linkage unclear |
| Customer request history | `CustomerRequestsHistoryPage` | `/customer/requests/history` | `customerController` | `CustomerRequest` | EXISTS | Recently aligned to real statuses |
| Customer saved vehicles | `CustomerVehiclesPage` | `/customer/profile` | `customerController` | `CustomerProfile` | EXISTS | Stored in profile JSON-like structure |
| Customer saved locations | `CustomerSavedLocationsPage` | `/customer/profile` | `customerController` | `CustomerProfile` | EXISTS | Stored in profile |
| Customer notifications | `CustomerNotificationsPage` | `/customer/notifications` | `customerController` | `CustomerRequest`, `SupportTicket`, `PaymentTransaction` | PARTIAL | Dynamic feed exists, delivery engine does not |
| Customer support tickets | `CustomerSupportPage` | `/customer/support/tickets` | `customerController` | `SupportTicket` | EXISTS | Request-linked support now exists |
| Customer profile, logout, delete account | `CustomerProfilePage` | `/customer/profile`, `/customer/account` | `customerController` | `CustomerProfile`, `User` | EXISTS | Live now |
| Partner dashboard | `PartnerDashboard` | `/mechanic/jobs`, `/mechanic/performance/insights`, `/mechanic/earnings` | `requestOperationsController`, `analyticsController`, `financeController` | multiple | PARTIAL | Useful, but automation depth limited |
| Partner requests hub | `PartnerRequestsPage` | `/mechanic/jobs`, accept/reject routes | `requestOperationsController` | `CustomerRequest`, `RequestAssignment` | EXISTS | Recently lifecycle-aligned |
| Partner active job flow | `PartnerActiveJobPage` | `/mechanic/jobs/:id`, `/mechanic/jobs/:id/status` | `requestOperationsController` | `CustomerRequest`, `RequestTimelineEvent` | EXISTS | Main mobile execution view exists |
| Partner quote creation | `PartnerQuotePage` | `/mechanic/jobs/:id/quote` | `requestOperationsController` | `RequestQuote`, `RequestQuoteLineItem` | EXISTS | Good backbone |
| Partner completion flow | `PartnerCompleteJobPage` | `/mechanic/jobs/:id/status` | `requestOperationsController` | `CustomerRequest`, `PaymentTransaction` | PARTIAL | Completion exists, OTP/payment realism limited |
| Partner availability / live state | `PartnerAvailabilityPage` | `/mechanic/live/go-online`, `/go-offline`, `/live/location` | `requestOperationsController` | `MechanicLiveState` | EXISTS | Strong core |
| Partner earnings | `PartnerEarningsPage` | `/mechanic/earnings` | `financeController` | `PartnerEarning`, `PayoutSettlement` | PARTIAL | Earnings data exists, settlement automation not complete |
| Partner notifications | `PartnerNotificationsPage` | no clear dedicated backend notification API | frontend only / derived | possible activity tables only | WEAK | UI exists, delivery engine absent |
| Partner support | `PartnerSupportPage` | no clear dedicated partner support API | limited | `SupportTicket` only customer/admin linked today | PARTIAL | Support UI exists, not role-complete |
| Admin dashboard | `AdminDashboard`, `AdminOpsDashboard` | `/admin/dashboard` | `dashboardController` | aggregated | EXISTS | Classic + v2 coexist |
| Admin live ops | `AdminLiveOperations` | `/admin/live/requests`, `/admin/live/mechanics` | `requestOperationsController` | request/live models | EXISTS | Strong operational view |
| Admin dispatch board | `AdminDispatch` | `/admin/requests/:id/dispatch/override`, live routes | `requestOperationsController`, `analyticsController` | `DispatchOverride`, `DispatchScoreSnapshot` | EXISTS | Manual override exists |
| Admin request hub | `AdminRequestsHub` | `/admin/requests`, `/admin/requests/:id` | `customerController` | `CustomerRequest` and related tables | EXISTS | Good ops surface |
| Admin customers | `AdminCustomers` | `/admin/customers` | `customerController` | `User`, `CustomerProfile` | EXISTS | Good management view |
| Admin partners | `AdminPartners` | `/admin/mechanics`, trust-status routes | `mechanicController` | `Mechanic`, `TrustedPartnerAudit` | EXISTS | Good management base |
| Admin payments | `AdminPayments` | `/admin/finance/settlements`, `/admin/payments/issues` | `financeController`, `requestOperationsController` | `PaymentTransaction`, `PayoutSettlement` | PARTIAL | Good visibility, weak automation |
| Admin support | `AdminSupport` | `/admin/support/tickets`, update route | `requestOperationsController` | `SupportTicket` | EXISTS | Strong enough for current stage |
| Admin analytics | `AdminAnalytics` | multiple `/admin/analytics/*` | `analyticsController` | analytics snapshot tables | PARTIAL | Good start, event ingestion still thin |
| Admin services/settings | `AdminServices`, `AdminSettings` | vehicle/service/specific-service routes | `settingsController`, `regionalConfigController` | service and regional tables | EXISTS | Respect core data constraints |
| Admin cities/zones/pricing | `AdminCities` | `/admin/cities`, `/admin/zones`, pricing rules | `regionalConfigController` | `CityConfig`, `ZoneConfig`, `RegionalPricingRule`, `ServiceAvailabilityRule` | EXISTS | Strong config backbone |
| Admin notifications view | `AdminNotifications` | mostly derived current data | frontend summary | mixed | WEAK | Coverage UI exists more than engine |
| Admin audit logs | `AdminAuditLogs` | `/admin/activity-logs` | `dashboardController` | `ActivityLog` | PARTIAL | Exists, but audit breadth unclear |
| Roles and user admin | `AdminRoles`, `AdminUsers` | `/admin/users` and role auth | `userController`, `authMiddleware` | `User`, `Role` | PARTIAL | Route-based authorization exists, finer permissions limited |

---

# B. Missing Features

| Feature | Area | Why Needed | Priority |
|---|---|---|---|
| Real payment gateway integration | Customer / Finance | Current payment flow records mock readiness instead of true collection/reconciliation | P0 |
| Central automation engine | Backend / Ops | Business automation is spread across controllers; no event-rule-action engine | P1 |
| Background job / queue system | Backend / Ops | Needed for retries, notifications, settlement processing, fraud checks, document reminders | P1 |
| Real push notification delivery | Customer / Partner | In-app views exist, but no push delivery layer found | P1 |
| SMS / WhatsApp operational notification pipeline | Customer / Partner | Required for low-connectivity roadside assistance reliability | P1 |
| Customer saved payment methods | Customer | Reduces payment friction and repeat checkout effort | P2 |
| Guided diagnosis flow | Customer | Could reduce wrong service selection and typing | P2 |
| Partner-facing support ticket API | Partner | Partner support UI exists but backend pathway is incomplete | P1 |
| Fraud signal scoring workflow | Admin / Ops | Models and concepts exist, but no operational fraud engine found | P2 |
| Refund and partial refund automation | Payments | Needed for disputes, failed service, and cash/digital reconciliation | P1 |
| Quote expiry enforcement UX/system | Customer / Partner | Quote states exist, but strong expiry behavior not evident | P2 |
| Real chat / live messaging | Customer / Partner | Call/share exist, but live communication is still limited | P2 |
| Offline sync / reconnect strategy | Customer / Partner | Poor network is common in roadside scenarios | P1 |
| App-level accessibility audit fixes | All | Many pages likely need form/dialog/focus improvements | P2 |
| Application tests | Full stack | Current repo lacks application test suite | P0 |

---

# C. Partial Features

| Feature | Existing | Missing | Required Change |
|---|---|---|---|
| Customer notifications | Dynamic notification feed from requests, tickets, payments | No channel delivery engine, preferences, dedupe policy, retry policy | Create notification service and channel adapters |
| Customer support | Request-linked ticket creation and list | FAQ, attachment flow, richer escalation, auto-context rendering in UI | Extend support entity usage and customer support UX |
| Payment flow | Quote -> payment readiness -> payment record | Real gateway, failure handling, refunds, saved methods, reconciliation | Replace mock readiness with configurable payment orchestration |
| Partner support | Support screen exists | No clearly complete partner ticket backend | Add partner ticket API and shared support model handling |
| Partner earnings | Earnings endpoint and pages exist | Settlement clarity, cash vs digital split UX, adjustments and payout lifecycle | Expand finance automation and partner payout views |
| Admin analytics | Customer/partner/financial/zone analytics routes exist | Event depth, longitudinal reliability, more operational exception analytics | Strengthen analytics event ingestion |
| Dispatch scoring | Dispatch scoring endpoints and snapshots exist | Deeper live auto-dispatch transparency and operational alerts | Build operator-friendly score/rule explanations |
| Customer smart defaults | Saved vehicles and locations exist | Faster one-tap “use last vehicle + current GPS” behavior not fully optimized | Simplify request flow defaults |
| Request lifecycle consistency | Shared helper now exists in frontend and constants in backend | Legacy pages and duplicated old assumptions still exist in parts of codebase | Remove remaining divergent lifecycle logic |
| Audit logs | Activity log route and screen exist | Not all sensitive actions clearly shown as fully auditable | Expand action coverage |

---

# D. UX Friction

| Screen | Current Steps | Problem | Recommended Steps |
|---|---|---|---|
| Customer request creation | service -> issue -> vehicle -> location -> details -> submit | Can still feel multi-step for repeat users | Preselect last vehicle + current location + recent service when safe |
| Customer payment | quote -> readiness button -> status | Feels operational/test-like, not customer-grade payment UX | Move to simple pay-now flow with success/failure handling |
| Customer support | open support -> choose linked request -> type subject/description | Good improvement, but still asks for data system often already knows | Auto-prefill current active request and support category from context |
| Partner active job | multiple manual state taps | Good but still manual-heavy during roadside work | Add safe automation suggestions and fewer required state taps |
| Partner requests | tab-based job selection | Fine, but low-information cards could be more action-ready | Surface ETA, trust, and quick accept/reject context more clearly |
| Admin dispatch | manual request selection -> partner search -> override | Works, but still exception-heavy even for normal low-supply cases | Add stronger automatic re-dispatch and exception filtering |
| Public discovery to customer request | list/map/emergency/public pages separate from request funnel | Public discovery and customer emergency conversion are not tightly unified | Add smoother transition from discovery to request creation |

---

# E. Automation Opportunities

| Manual Process | Current | Automation | Benefit |
|---|---|---|---|
| Customer re-entry of vehicle/location | Saved in profile but not always one-tap reused | Auto-use last vehicle + GPS + recent service | Faster booking |
| Partner lifecycle progression | Mostly manual button taps | Suggest or auto-advance safe states with confirmation | Less roadside friction |
| Re-dispatch after cancellation/no-show | Some manual/admin intervention and controller logic | Central automatic re-dispatch rule set | Better customer continuity |
| Support context gathering | Ticket linked to request, but user still writes issue manually | Auto-attach request timeline, payment status, partner status | Faster support resolution |
| Settlement processing | Admin finance views exist | Scheduled settlement preparation and exception queue | Less manual finance work |
| Notification sending | Mostly in-app representations | Event-driven notification pipeline | Better reliability |
| Document/KYC reminders | Some data exists | Scheduled expiry reminders | Better partner compliance |
| Fraud monitoring | Tables/models suggest base capability | Risk-scored rule engine with admin review queue | Lower abuse risk |
| Analytics event completeness | GA page tracking and backend analytics endpoints exist | Central event service and event standards | Better product visibility |

---

# F. Duplicate Features

| Feature | Location 1 | Location 2 | Recommended Source of Truth |
|---|---|---|---|
| Admin live operations page | `src/pages/admin/AdminLiveOperations.tsx` | `src/pages/AdminLiveOperations.tsx` | `src/pages/admin/AdminLiveOperations.tsx` |
| Admin dispatch/live style generations | older root-level admin pages | routed `src/pages/admin/*` pages | `src/pages/admin/*` |
| Customer live request status experience | `CustomerActiveServicePage` | `CustomerRequestStatusPage` | Keep one primary customer request status experience |
| Partner legacy mechanic flows | legacy `mechanic-*` pages/routes | newer `/partner/*` routes | `/partner/*` should become source of truth |
| Public/partner route overlap on `/partner` | public marketing partner page | partner authenticated area also on `/partner` | Separate marketing and app entry paths eventually |

---

# G. Broken / Inconsistent Features

| Feature | Problem | Root Cause | Fix |
|---|---|---|---|
| Payment customer experience | Payment is not real payment | Backend stores mock/manual capture readiness only | Implement true payment orchestration |
| Notification system consistency | Screens show notifications but channel system is incomplete | No dedicated notification service/channel engine found | Add event-driven notification backend |
| Partner support completeness | Partner support screen exists but lacks full backend depth | Support model is mainly customer/admin centered | Extend support APIs for partner role |
| Request lifecycle historic inconsistency | Different screens previously used different status names | Old UI layers diverged from backend state machine | Continue consolidating around shared lifecycle contracts |
| Admin duplication | Duplicate admin pages still exist in repo | Old and new admin iterations were kept together | Retire or archive unused duplicates |
| Real-time expectations | “Live” UX relies largely on polling and derived logs | No WebSocket/realtime subscription architecture found | Add realtime transport where needed |

---

# H. Edge Cases

| Scenario | Current Behavior | Required Behavior | Priority |
|---|---|---|---|
| GPS denied | Some fallback/manual behavior exists | Clear fallback picker + explanation + retry | P1 |
| No partner found | Searching page now handles failure path | Add schedule, support, alternative service, and better recovery metrics | P1 |
| Partner cancels after accept | Some lifecycle/admin support exists | Automatic re-dispatch + customer ETA refresh + partner reliability signal | P1 |
| Partner no-show | Status exists | Detect inactivity + alert + reassign + audit | P1 |
| Payment fails | Payment status supports failure | Need actual retry/recovery and customer messaging flow | P1 |
| Quote expires | Quote statuses exist | Need expiry timer and forced revalidation | P2 |
| Session expires | Refresh token flow exists | Better role-based redirect + unsaved work handling | P2 |
| Duplicate request | No strong visible prevention layer found | Detect and suggest existing active request | P1 |
| Duplicate payment | Model can store records, but hard protection not evident | Idempotency and duplicate prevention required | P1 |
| Partner network loss during active job | Poll-based UX may stale | Offline banner + stale state + retry + audit | P1 |
| Admin dispatch conflict | Some override routes exist | Need clearer conflict detection and audit visibility | P2 |

---

# I. Accessibility Issues

| Screen | Issue | Impact | Fix |
|---|---|---|---|
| Map-heavy views | Heavy visual interaction and pin-based context | Hard for keyboard and screen-reader users | Add list-first alternatives and descriptive summaries |
| Customer/partner action screens | Some icon buttons and map controls may lack full accessible labeling consistency | Reduced accessibility and discoverability | Audit icon-only controls and dialog semantics |
| Forms across support/profile/request flows | Error messaging is mostly visual/toast based | Screen-reader users may miss validation context | Add inline accessible error descriptions and ARIA messaging |
| Status badges | Status often relies on color + small badge text | Low-vision risk | Ensure stronger text labels and contrast |
| Motion-heavy screens | Framer Motion used widely | Reduced-motion users may need alternatives | Respect reduced-motion preference across animated flows |

---

# J. Performance Issues

| Area | Problem | Impact | Fix |
|---|---|---|---|
| Frontend bundle | Build reports very large map/admin chunks, including >500 kB warnings | Slower mobile load and worse first interaction | More route/code splitting and map isolation |
| Map libraries | Both Leaflet and MapLibre stacks exist | Larger bundle and duplicated map ecosystem cost | Standardize usage where possible |
| Polling-based live flows | Multiple pages poll every few seconds/seconds | Extra network load and stale periods | Move critical live flows toward shared live transport |
| Admin heavy pages | Large data tables and analytics pages may grow without virtualization | Scalability risk | Add pagination/virtualization where needed |
| Duplicate legacy pages/components | Repo retains overlapping implementations | Maintenance and bundle overhead | Remove or archive unused legacy screens |

---

# K. Security Issues

| Area | Problem | Risk | Fix |
|---|---|---|---|
| JWT handling | JWT secret is hardcoded in backend source | Critical credential exposure and invalid environment separation | Move to environment variable immediately | 
| Token storage | Frontend stores access/refresh tokens in `localStorage` | XSS impact is amplified | Move toward safer token strategy where feasible |
| Role model | Authorization is role-based but coarse | Fine-grained admin permission gaps | Expand permission matrix beyond broad roles |
| API protections | Validation exists broadly | Need stronger rate limiting and abuse controls | Add rate limiting for auth, OTP, payments, and support |
| Sensitive data | Mechanic/customer/admin data surfaces are broad in admin | Need careful least-privilege review | Audit response payload minimization |
| Tests for auth/security flows | No application tests found | Security regressions easier to introduce | Add automated auth/permission tests |

---

# Feature Classification Summary

## Already Implemented Well

- customer OTP login
- customer request creation
- customer request tracking
- customer support ticket linkage
- customer profile, saved vehicles, saved locations
- partner request accept/reject/update flow
- quote creation and approval path
- admin live operations
- admin dispatch override
- admin request management
- city/zone/pricing configuration foundations

## Partially Implemented

- notifications
- payment operations
- partner support
- analytics depth
- settlement automation
- lifecycle consistency across all legacy surfaces

## Missing or Weak

- real payment gateway
- central automation engine
- job queue / scheduler
- real push/SMS/WhatsApp orchestration
- strong fraud signals workflow
- production-grade offline/reconnect handling
- application tests

---

# Recommended Priority Plan

## P0

- move JWT secret to environment variable
- design and implement real payment flow architecture
- add test coverage for auth, customer request creation, quote, payment, and admin override paths

## P1

- centralize automation for re-dispatch, failed payment, no-show, expiry, and notification triggers
- build real notification engine with channel strategy
- strengthen partner support and settlement automation
- improve duplicate request/payment handling

## P2

- reduce customer taps with stronger smart defaults
- improve support context automation
- fix accessibility gaps and reduced-motion behavior
- optimize map and admin bundle cost

## P3

- richer recommendation engine
- advanced fraud scoring
- deeper personalization and subscription intelligence

---

# Final Product View

Current RoadResQ is already beyond MVP in structure.

It is not missing everything.

It already has:

- real marketplace entities
- real role-based application areas
- real admin operations capability
- real request lifecycle handling
- real quote/support/config foundations

The biggest next leap is not “more screens”.

The biggest next leap is:

- stronger automation
- real payment truth
- fewer user steps
- more reliable notifications
- stronger security
- less duplicate/legacy surface area
- more operational exception handling instead of manual handling

