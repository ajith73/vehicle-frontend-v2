# RoadResQ Current Application Architecture

Last updated: August 20, 2026

---

# 1. Purpose

This document describes what is currently developed in the RoadResQ application.

It is not a future vision file.

It is a simple summary of:

- current application modules
- current user types
- current screens
- current working flows
- important backend-supported features

---

# 2. Product Direction

RoadResQ is currently built as a multi-role roadside assistance platform with marketplace behavior inspired by:

- Ola / Uber for live request dispatch
- Rapido for fast nearby partner allocation
- Swiggy / Zomato / Instamart style operational tracking and real-time service states

The current system is focused on:

- customer emergency and service request flow
- partner job acceptance and service execution
- admin operations, dispatch, support, analytics, and configuration
- public website, SEO pages, and service discovery

The existing frontend theme, layout system, and reusable components are being reused across modules.

---

# 3. Current Application Areas

The application currently has 4 main areas:

## 3.1 Public Website

Purpose:

- brand presence
- SEO pages
- service discovery
- city discovery
- trust-building content
- mechanic onboarding entry

## 3.2 Customer App

Purpose:

- login by OTP
- create roadside help request
- track live request
- manage vehicles and saved locations
- manage profile
- raise support tickets
- view notifications

## 3.3 Partner App

Purpose:

- receive assigned jobs
- accept or reject jobs
- update job lifecycle
- create quotes
- complete jobs
- manage availability, earnings, account, and support

## 3.4 Admin App

Purpose:

- manage operations
- monitor live requests and partners
- manual dispatch override
- support escalation
- customer and partner management
- payments and analytics
- services, SEO, roles, notifications, and audit views

---

# 4. Current User Types

## 4.1 Public User

Can:

- browse landing and content pages
- explore services and cities
- open emergency help information
- submit mechanic onboarding details

## 4.2 Customer

Can:

- log in using OTP
- manage profile
- save vehicles
- save locations
- create a service request
- track request status
- review quotes
- record payment readiness
- submit support tickets
- view notifications
- delete account

## 4.3 Partner

Can:

- view available assigned jobs
- accept or reject requests
- move job through service states
- submit quotes
- complete jobs
- view earnings and performance
- manage availability and account details

## 4.4 Admin

Can:

- monitor dashboard and live operations
- review requests
- override dispatch
- escalate support
- manage customers and partners
- review payment and settlement data
- manage services, SEO, analytics, and operational settings

---

# 5. Current Frontend Structure

The frontend currently runs in one project, but the application is already organized by role and can later move into separate apps.

Current role-based page grouping:

```text
src/
├── pages/
│   ├── public/
│   ├── customer/
│   ├── partner/
│   └── admin/
```

Current architectural direction:

- public screens stay SEO-first and responsive
- customer and partner screens are mobile-first
- admin screens are desktop-first
- reusable UI and theme are shared across all areas

---

# 6. Current Public Screens

Main public routes currently available:

- `/`
- `/submit`
- `/donate`
- `/why-road-resq`
- `/contact`
- `/about`
- `/terms`
- `/privacy`
- `/verify-start`
- `/services`
- `/cities`
- `/how-it-works`
- `/cities/:citySlug`
- `/services/:serviceSlug/in/:citySlug`
- `/partner`
- `/list`
- `/map`
- `/mapcn`
- `/emergency`
- `/feedback`

Simple summary:

- `LandingPage`: main brand and CTA page
- `ServicesPage`: service overview page
- `CitiesPage`: city coverage overview page
- `HowItWorksPage`: process explanation page
- `CityLandingPage`: city-focused SEO page
- `ServiceCityLandingPage`: service + city SEO page
- `EmergencyHubPage`: emergency numbers and emergency-first help path
- `ListPage` and `MapPage`: public discovery of mechanics and service points
- `SubmitMechanicPage`: partner onboarding submission flow

---

# 7. Current Customer Screens

Current customer routes:

- `/customer`
- `/customer/request`
- `/customer/request/searching`
- `/customer/request/:id`
- `/customer/request/:id/quote`
- `/customer/request/:id/payment`
- `/customer/request/:id/rating`
- `/customer/requests`
- `/customer/vehicles`
- `/customer/locations`
- `/customer/notifications`
- `/customer/support`
- `/customer/profile`

Simple summary:

- `CustomerHomePage`: customer dashboard, active request snapshot, recent history
- `CustomerRequestFlow`: create a new request
- `CustomerSearchingPage`: searching and no-partner flow
- `CustomerActiveServicePage`: live service screen with emergency and support actions
- `CustomerQuotePage`: quote review and customer decision
- `CustomerPaymentPage`: payment stage UI
- `CustomerRatingPage`: post-service rating flow
- `CustomerRequestsHistoryPage`: active, completed, and cancelled request history
- `CustomerVehiclesPage`: saved vehicle management
- `CustomerSavedLocationsPage`: saved location management
- `CustomerNotificationsPage`: dynamic notification feed
- `CustomerSupportPage`: real support ticket creation and ticket history
- `CustomerProfilePage`: profile, emergency hub actions, logout, and delete account

---

# 8. Current Partner Screens

Current partner routes:

- `/partner`
- `/partner/requests`
- `/partner/earnings`
- `/partner/performance`
- `/partner/account`
- `/partner/request/:id`
- `/partner/request/:id/quote`
- `/partner/request/:id/complete`
- `/partner/services`
- `/partner/availability`
- `/partner/notifications`
- `/partner/support`

Simple summary:

- `PartnerDashboard`: main partner summary dashboard
- `PartnerRequestsPage`: available, active, completed, and cancelled job tabs
- `PartnerActiveJobPage`: live job execution screen
- `PartnerQuotePage`: quote creation and update
- `PartnerCompleteJobPage`: final completion flow
- `PartnerEarningsPage`: earnings summary
- `PartnerPerformancePage`: partner performance insights
- `PartnerAvailabilityPage`: availability management
- `PartnerServicesPage`: service capability view
- `PartnerNotificationsPage`: partner notification UI
- `PartnerSupportPage`: partner help and support UI
- `PartnerAccountPage`: partner account screen

Legacy screens still exist too:

- mechanic profile
- mechanic dashboard
- verify flow pages

These support earlier flows and fallback use cases.

---

# 9. Current Admin Screens

Current admin routes include classic admin screens and newer `v2` operational screens.

## 9.1 Classic Admin Screens

- `/admin/dashboard`
- `/admin/mechanics`
- `/admin/mechanics/new`
- `/admin/mechanics/:id/edit`
- `/admin/mechanics/bulk-upload`
- `/admin/mechanics/gmaps-import`
- `/admin/verifications`
- `/admin/update-requests`
- `/admin/update-requests/:id/edit`
- `/admin/feedback`
- `/admin/donations`
- `/admin/settings`
- `/admin/reviews`
- `/admin/users`
- `/admin/cities`
- `/admin/settlements`

## 9.2 Admin V2 Screens

- `/admin/v2/dashboard`
- `/admin/v2/live-ops`
- `/admin/v2/dispatch`
- `/admin/v2/requests`
- `/admin/v2/customers`
- `/admin/v2/partners`
- `/admin/v2/payments`
- `/admin/v2/support`
- `/admin/v2/analytics`
- `/admin/v2/services`
- `/admin/v2/seo`
- `/admin/v2/notifications`
- `/admin/v2/audit-logs`
- `/admin/v2/roles`

Simple summary:

- `AdminOpsDashboard`: high-level live operational dashboard
- `AdminLiveOperations`: live request and supply monitoring
- `AdminDispatch`: manual dispatch override board
- `AdminRequestsHub`: request list, details, and timeline view
- `AdminCustomers`: customer management view
- `AdminPartners`: partner management view
- `AdminPayments`: financial and payment issue view
- `AdminSupport`: support ticket management
- `AdminAnalytics`: analytics tabs for marketplace and finance
- `AdminServices`: service configuration view
- `AdminSeo`: city/page SEO content management
- `AdminNotifications`: operational notification coverage view
- `AdminAuditLogs`: audit visibility view
- `AdminRoles`: role and access UI
- `AdminCities`: city, zone, and regional configuration view

---

# 10. Current Backend-Supported Customer Features

Currently supported:

- OTP send and verify
- membership plan listing
- membership status
- membership subscribe
- customer request creation
- request status lookup
- quote approve or reject
- payment initiation readiness
- request cancellation
- profile get and update
- request history
- dynamic notifications
- support ticket list and create
- account delete

Important implemented hardening:

- customer profile APIs now tolerate partially older database schema states
- request creation response is aligned with frontend flow
- support and notification flows are connected to real backend data

---

# 11. Current Backend-Supported Operations Features

Currently supported:

- admin live request feed
- admin live mechanic feed
- admin request list and request details
- manual dispatch override
- support escalation
- admin customer list
- admin support ticket list and update
- admin analytics APIs
- request lifecycle timeline events
- quote creation and decision flow
- payment record flow

---

# 12. Current Core Request Lifecycle

The current system is already working around this practical lifecycle:

```text
SUBMITTED
UNDER_REVIEW
ASSIGNING
ASSIGNED
ACCEPTED
EN_ROUTE
ARRIVED
SERVICE_STARTED
SERVICE_COMPLETED
```

Current failure / exit states:

```text
NO_RESPONSE
REJECTED_BY_MECHANIC
CUSTOMER_NO_RESPONSE
MECHANIC_NO_SHOW
SERVICE_CANCELLED
CANCELLED_BY_CUSTOMER
CANCELLED_BY_ADMIN
```

Commercial states currently supported:

```text
QUOTE_PENDING
QUOTE_SUBMITTED
QUOTE_APPROVED
QUOTE_REJECTED

PAYMENT_NOT_READY
PAYMENT_PENDING
PAYMENT_COMPLETED
PAYMENT_FAILED
```

The frontend now has shared request lifecycle helpers so customer, partner, and admin screens can use more consistent labels and behavior.

---

# 13. Current Customer Flow

Simple current flow:

```text
Open app
→ Login by OTP
→ Set or confirm profile
→ Select vehicle
→ Select service and issue
→ Add location
→ Create request
→ Searching
→ Partner assigned
→ Partner accepts
→ Partner en route
→ Partner arrives
→ Quote if needed
→ Customer decision
→ Service execution
→ Payment readiness
→ Rating
→ History
```

Current support additions in this flow:

- emergency hub access
- location sharing
- support ticket creation
- notifications
- cancellation reasons

---

# 14. Current Partner Flow

Simple current flow:

```text
Partner opens dashboard
→ View assigned / available jobs
→ Accept or reject job
→ Mark en route
→ Mark arrived
→ Start service
→ Create quote if required
→ Complete job
→ View earnings and performance
```

Current support around this flow:

- availability state
- request status update actions
- quote management
- account and support pages

---

# 15. Current Admin Flow

Simple current flow:

```text
Admin logs in
→ Open dashboard
→ Monitor live requests and supply
→ Review request details
→ Reassign or override dispatch if needed
→ Escalate support
→ Track payments, customers, partners, and analytics
→ Use city / SEO / service / settings tools for operations
```

Current admin strengths:

- live operations visibility
- request timeline visibility
- manual dispatch control
- support ticket handling
- marketplace analytics views

---

# 16. Current Emergency and Support Flow

Emergency and support capability currently available:

- emergency hub page
- customer emergency actions from profile and live request area
- location sharing
- RoadResQ support contact path
- request-linked support tickets
- admin support escalation handling

Current intent:

- severe incidents should move to emergency contacts first
- service recovery then continues inside RoadResQ flows

---

# 17. Current Map and Discovery Behavior

Maps and discovery currently exist in multiple places:

- public map discovery
- public mechanic listing
- customer live request context
- partner job map preview
- admin live operations visual map-like layout

Current practical rule:

- maps are used where they help discovery or operations
- text, cards, and actions still remain primary for most screens

---

# 18. Current Reusable System Behavior

The application already reuses:

- common layouts
- shared theme
- cards
- buttons
- tables
- form patterns
- request timeline view
- support action blocks
- toast feedback
- motion and animation patterns

This helps future separation into dedicated public, customer, partner, and admin projects.

---

# 19. Current Known Architecture Status

What is already strong:

- multi-role structure is in place
- main screens exist for all core roles
- customer request flow is connected to backend
- admin operations module is significantly expanded
- support and notification layers are now more dynamic
- public SEO pages and discovery pages exist

What is still evolving:

- some legacy screens still exist beside newer role-based screens
- some partner and admin edge-case behavior still needs more live verification
- some modules are still stronger on UI structure than full real-time depth
- final project split into separate public/customer/partner/admin apps has not happened yet

---

# 20. Recommended Use of This Document

Use this document when you want to understand:

- what is already built
- which roles are already covered
- which screens already exist
- which flows are already active
- where future refactoring should start

For future roadmap and deeper design direction, continue using:

- `ARCHITECTURE.md`
- `ARCHITECTURE_v2.md`
- `PHASE1.md` to `PHASE8.md`

