# RoadResQ Architecture and Product Execution Plan

## 1. Purpose

This document defines a practical execution path for evolving RoadResQ from its current mechanic discovery platform into a marketplace experience inspired by platforms such as Uber, Rapido, Swiggy, and Zomato.

This version is intentionally grounded in the **current codebase**, not an idealized future-only structure.

---

## 2. Current Reality

RoadResQ today is strongest in these areas:

- public discovery
- map and list browsing
- local SEO pages
- mechanic onboarding and verification
- admin CRUD and moderation

Current reusable strengths already exist in:

- public landing and discovery pages
- map filters and bottom sheets
- mechanic detail and review flows
- mechanic verification dashboard
- admin layout, reviews, settings, and mechanic management
- current light and dark theme handling

The application is still a single React app with shared routes and pages. That is acceptable for the current stage and should remain the working model for now.

However, page-level organization should start preparing for future extraction into separate projects.

Recommended screen grouping inside the current frontend:

```text
src/
├── pages/
│   ├── public/
│   ├── customer/
│   ├── partner/
│   └── admin/
```

This is not a multi-project split yet.

It is a structure-preparation step so that:

- public pages can later move into a public project
- customer request flows can later move into a customer project
- partner operational flows can later move into a partner project
- admin screens can later move into an admin project

---

## 3. Non-Negotiable Implementation Guardrails

These constraints must guide every future phase.

## A. Database and Seeder Safety

- Do **not** modify seeders.
- Do **not** remove, rename, or repurpose existing fields in:
  - `ServiceType`
  - `VehicleType`
  - `SpecificService`
  - `Mechanic`
- If data model changes are needed, use:
  - new tables
  - additive nullable columns
  - additive foreign keys

## B. Frontend Reuse

- Reuse current files and screens wherever possible.
- Extend current list/map/bottom-sheet flows before creating parallel apps.
- Preserve the current design language and existing light/dark theme behavior.
- While reusing files, gradually regroup page files into `public`, `customer`, `partner`, and `admin` folders under `src/pages`.

## C. Architecture Discipline

- Do not split into multiple frontend apps yet.
- Do not introduce micro-frontends.
- Do not build advanced realtime or AI-driven dispatch before the request lifecycle is stable.

---

## 4. Product Reframe

The target product is not just a mechanic directory.

It should evolve into a request lifecycle platform:

1. discover nearby supply
2. capture a real help request
3. assign the right mechanic
4. fulfil the service
5. support quoting/payment where needed
6. operate reliably at city scale

This means the roadmap should move from:

`directory -> request capture -> manual ops -> active fulfilment -> monetization -> scale`

not directly from:

`directory -> full Uber-like automation`

---

## 5. Reuse Map for Current Codebase

## A. Public / Discovery Assets to Reuse

- `LandingPage.tsx`
- `ListPage.tsx`
- `MapPage.tsx`
- `MechanicBottomSheet.tsx`
- `MechanicDetailsModal.tsx`
- `VehicleSelector.tsx`
- `ServiceSelector.tsx`
- `LocationContext.tsx`
- SEO/city/service landing pages

## B. Partner / Mechanic Assets to Reuse

- `MechanicForm.tsx`
- `MechanicDashboard.tsx`
- verification and claim flows

## C. Admin Assets to Reuse

- `AdminLayout.tsx`
- `AdminDashboard.tsx`
- `AdminMechanics.tsx`
- `AdminVerificationRequests.tsx`
- `AdminUsers.tsx`
- `AdminReviews.tsx`
- `AdminSettings.tsx`
- `AdminCities.tsx`

## D. Theme Assets to Reuse

- `ThemeContext.tsx`
- existing light/dark token patterns
- current Tailwind utility conventions

---

## 6. Backend Reframe

The current backend is primarily:

- public mechanic listing APIs
- admin APIs
- mechanic verification/account-related flows

To support marketplace behavior, new domains should be added without destabilizing current core data.

Recommended new domains:

- customer profile
- customer vehicles
- customer requests
- request assignments
- request timelines
- quotes
- payments
- subscriptions
- support tickets
- audit logs

These should be introduced incrementally.

---

## 7. Revised Phase Order

The old plan was strong in vision but too aggressive compared with the current codebase. The revised order is:

### Phase 1

Request capture on top of current discovery screens.

### Phase 2

Manual marketplace operations before automation.

### Phase 3

Active service lifecycle and proof of fulfilment.

### Phase 4

Quote approval and payment readiness.

### Phase 5

Subscription and trusted partner layer.

### Phase 6

Realtime operations and dispatch control.

### Phase 7

Analytics and marketplace intelligence.

### Phase 8

Multi-city growth and platform scale.

---

## 8. Customer Experience Strategy

Customer experience should evolve in the smallest safe steps.

## Phase 1 to 2 customer experience

- browse freely as guest
- select location, vehicle, and service from current flows
- request help from current map/list experience
- authenticate only at final confirmation
- receive honest status updates

## Phase 3 onward

- see request progress
- contact mechanic/support
- approve quotes when needed
- complete review and payment flows

---

## 9. Partner Experience Strategy

Do not create a full partner app immediately.

Short-term:

- extend current mechanic dashboard and login flows
- introduce job inbox and job actions
- add operational states gradually

Medium-term:

- improve online/offline availability
- add active job handling
- add quote creation

Long-term:

- separate partner app only if usage and operational complexity justify it

---

## 10. Admin Experience Strategy

Admin remains the operational backbone during the transition.

The correct order is:

1. basic request queue
2. request detail and manual assignment
3. timeline and cancellation visibility
4. support queue and audit controls
5. live operations map

This avoids overbuilding advanced ops tools before the core request pipeline exists.

---

## 11. Legal and Product Messaging Alignment

Before monetization launches, RoadResQ must reconcile product messaging with actual platform behavior.

Current content still reflects a low-monetization directory-style service in some places. Before Phase 4 and Phase 5 go live:

- Terms must reflect payment reality
- pricing communication must be explicit
- refund/cancellation policies must be published
- premium/trusted partner logic must be clearly explained

---

## 12. Technical Principles

## A. API Principles

- backend is the source of truth for state
- frontend route guards improve UX but do not enforce security
- public browse endpoints remain public
- request, quote, payment, and subscription flows must be authenticated and validated server-side

## B. State Principles

- design around request state transitions
- reject invalid transitions server-side
- prefer explicit statuses over vague booleans

## C. Frontend Principles

- mobile-first for customer and mechanic flows
- desktop-first for admin
- one strong primary action per screen
- reuse current theme and components before inventing new patterns

---

## 13. Recommended Future Monorepo Trigger

Stay with one React app until at least one of these becomes true:

- separate teams own separate apps
- deployments need to be independent
- customer and admin bundles diverge significantly
- mobile-specific partner/customer surfaces outgrow the shared app

Until then, keep one app with stronger domain boundaries.

Those domain boundaries should start at the page-folder level first, before any real repository or deployment split.

---

## 14. Definition of Success

A phase is complete only when:

- the happy path works
- loading, empty, and error states exist
- current screens are not regressed
- light and dark theme remain consistent
- core protected tables were not broken
- new backend changes are additive

---

## 15. Summary

RoadResQ should evolve using the assets it already has.

The right strategy is:

- preserve current discovery strength
- add request capture first
- use manual operations before automation
- monetize only after fulfilment is real
- scale only after workflow is reliable

That path is much safer for this codebase and much more compatible with your current frontend, backend, theme, and core tables.
