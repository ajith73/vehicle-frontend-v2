# RoadResQ Frontend Current State

Last updated: September 1, 2026

## Scope

This document describes the current frontend state for the Customer and Partner applications inside `vehicle-frontend`.

It covers:

- screens and routes
- main sections inside each screen
- data shown on each section
- frontend API calls
- live/realtime behavior
- primary user flows
- scenario-based behavior currently visible in the frontend

This is a current-state document based on the code now in the repository. It is not a future roadmap document.

## Shared Frontend Foundations

### Shared route shells

- Customer shell: `src/components/layout/CustomerLayout.tsx`
- Partner shell: `src/components/layout/PartnerLayout.tsx`

### Shared customer navigation

Desktop and mobile customer shell currently exposes:

- Home
- Map
- List
- Requests
- Support
- Trusted
- Settings
- Profile
- Login / Register when not signed in

### Shared partner navigation

Desktop and mobile partner shell currently exposes:

- Home
- Requests
- Earnings
- Performance
- Account

Partner shell also handles:

- online/offline toggle
- theme toggle on desktop
- logout
- approval gate redirect to legacy verification dashboard until profile is approved

### Shared data context

File: `src/contexts/DataContext.tsx`

Shared cached data used across customer flows:

- vehicles list from `/public/vehicles`
- services list from `/public/services`
- customer profile from `/customer/profile`
- cached mechanic result sets for list/map/landing usage

### Realtime foundation

Pages use `openRealtimeStream(...)` for live updates.

Current realtime areas in customer and partner flows:

- customer active request stream
- customer searching stream
- customer notifications stream
- customer support tickets stream
- partner jobs stream
- partner active job stream
- partner earnings stream
- partner notifications stream
- partner support tickets stream
- partner settlements stream

## Customer Application

## Customer Route Map

- `/customer/login`
- `/customer/login?action=register`
- `/customer/login?action=reset`
- `/customer`
- `/customer/request`
- `/customer/request/searching?id=:id`
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
- `/customer/trusted-partners`
- `/customer/membership`
- `/customer/settings`
- `/emergency`

## Customer Auth

### Screen

Route: `/customer/login`

File: `src/pages/customer/CustomerAuthPage.tsx`

### Supported states

- login
- register
- forgot password
- reset password

### Register flow states

- `INITIAL`
- `OTP_SENT`
- `OTP_VERIFIED`

### Current sections

- portal header
- login form
- register form
- 6-box OTP input with paste support
- resend OTP timer
- forgot password form
- reset password form

### Current validations and rules

- customer screen only allows customer login
- partner screen only allows partner login
- email validation
- Indian mobile validation with 10 digits
- duplicate email check
- duplicate customer mobile check
- terms acceptance check for registration

### APIs

- `POST /api/auth/login`
- `POST /api/public/check-email`
- `POST /api/public/send-otp`
- `POST /api/public/verify-otp`
- `POST /api/auth/register`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Customer auth scenarios

- customer login success redirects to `/customer`
- wrong-role login shows role-specific error returned by backend
- duplicate email blocks registration before OTP continuation
- duplicate mobile blocks customer registration
- forgot password and reset password are available in same screen flow

## Customer Home

### Screen

Route: `/customer`

File: `src/pages/customer/CustomerHomePage.tsx`

### Sections

- location card
- vehicle card
- rotating promo banner
- primary "Request Help Now" CTA
- active request card
- quick services grid
- recent services
- member and safety shortcuts

### Data shown

- selected location name and location message
- default saved vehicle
- active request status if any request is still in progress
- quick service categories from service master data
- recent completed requests
- links to membership, trusted partners, notifications, support

### APIs and data sources

- `GET /api/customer/requests/history`
- shared `GET /api/customer/profile`
- shared `GET /api/public/services`
- location context for GPS/manual location state

### Scenarios

- if no location is resolved, location popup opens
- if user is not logged in, protected shortcuts redirect to customer login
- if active request exists, user can jump back into tracking flow
- if no vehicle exists, vehicle card pushes user toward vehicle setup

## Customer Request Flow

### Screen

Route: `/customer/request`

File: `src/pages/customer/CustomerRequestFlow.tsx`

### Current step order

1. Problem selection
2. Vehicle selection and add vehicle
3. Choose location
4. Additional details
5. Confirm request

### Step 1: Problem selection

Sections:

- service tiles grid
- retry empty state when services fail to load

Data shown:

- service image
- service name

APIs:

- shared `GET /api/public/services`
- fallback `GET /api/public/services`

Behavior:

- selecting a service moves directly to next step
- no separate continue button is required here

### Step 2: Vehicle selection

Sections:

- saved vehicle list
- add new vehicle form always visible

Data shown:

- make
- model
- plate
- vehicle type
- fuel type

APIs:

- shared `GET /api/customer/profile`
- `PUT /api/customer/profile` to save appended `savedVehicles`

Behavior:

- clicking a saved vehicle moves directly to location step
- new vehicle can be saved and continued in one action

### Step 3: Choose location

Sections:

- map preview
- selected address card
- edit address button
- live location button
- saved locations list
- nearby mechanics list when available

Data shown:

- selected full address
- pinned coordinates through map state
- saved locations
- nearby filtered mechanics with name, area/city, distance, availability

APIs:

- location popup geocoding search
- `GET /api/public/mechanics?lat&lng&radius&availability&limit&service&vehicle`
- `PUT /api/customer/profile` from popup when saving a location

Behavior:

- live location can refresh pinned address
- saved locations can reapply coordinates
- nearby mechanic list is filtered by selected service and vehicle type
- mechanic selection is optional; first available mechanic is preselected when available

### Step 4: Additional details

Sections:

- notes textarea
- request summary helper note

Data shown:

- free-text issue notes

APIs:

- no direct API on this step

### Step 5: Confirm request

Sections:

- left progress rail
- summary cards for problem, vehicle, pinned location, selected mechanic
- additional details summary
- help CTA
- confirm CTA

Data shown:

- chosen service
- chosen vehicle
- pinned address
- selected mechanic or random assignment fallback
- detail notes

APIs:

- `POST /api/customer/requests`

Payload highlights:

- `mechanicId` when user-selected mechanic exists
- `serviceTypeId`
- `vehicleTypeId`
- `vehicleLabel`
- `issueSummary`
- `issueDetails`
- `latitude`
- `longitude`
- `addressText`

### Request flow scenarios

- service unavailable: retry state shown
- no saved vehicle: add vehicle inside same step
- no saved location: choose live/manual location
- no mechanic found before submit: request can still continue with random/platform assignment
- backend validation failure: toast error shown
- success: navigates to searching screen

## Customer Searching

### Screen

Route: `/customer/request/searching?id=:id`

File: `src/pages/customer/CustomerSearchingPage.tsx`

### Sections

- full-screen map
- customer marker
- nearby partner markers
- live status header
- desktop left status card
- mobile bottom sheet card

### Data shown

- request service
- request vehicle
- request location
- current search radius
- visible nearby mechanic count
- search state or failure state

### APIs and realtime

- realtime stream: `GET /api/customer/requests/:id/stream`
- fallback: `GET /api/customer/requests/:id/status`
- nearby mechanics refresh: `GET /api/public/mechanics?...`
- cancel: `PUT /api/customer/requests/:id/cancel`

### Behavior

- default search window runs for 1 minute
- if still searching after timeout, screen moves to failed state
- user can expand search radius and restart a new 1-minute search window
- if request status leaves searching states, screen redirects to active request page

## Customer Active Request

### Screen

Route: `/customer/request/:id`

File: `src/pages/customer/CustomerActiveServicePage.tsx`

### Sections

- live request summary
- request status timeline/state card
- quote alert section when quote is submitted
- cancel request section

### Data shown

- current request status
- assigned partner/request details
- cancellation options
- quote-ready callout when applicable

### APIs and realtime

- realtime stream: `GET /api/customer/requests/:id/stream`
- fallback status fetch: `GET /api/customer/requests/:id/status`
- cancel: `PUT /api/customer/requests/:id/cancel`

### Behavior

- quote CTA appears when `quoteStatus === QUOTE_SUBMITTED`
- cancel reason is selectable before cancellation
- status transitions reflect backend lifecycle

## Customer Quote

### Screen

Route: `/customer/request/:id/quote`

File: `src/pages/customer/CustomerQuotePage.tsx`

### Sections

- quote header
- problem identified
- recommended service
- cost breakdown
- total amount
- approve and reject actions

### Data shown

- partner name
- notes
- line items
- tax amount
- fee amount
- total amount

### APIs

- `GET /api/customer/requests/:id/quote`
- `POST /api/customer/requests/:id/quote/approve`
- `POST /api/customer/requests/:id/quote/reject`

### Behavior

- approve redirects to payment
- reject returns to active request screen
- empty quote state is shown when quote is not ready yet

## Customer Payment

### Screen

Route: `/customer/request/:id/payment`

File: `src/pages/customer/CustomerPaymentPage.tsx`

### Sections

- checkout header
- service summary
- total breakdown
- payment method chooser
- mock Razorpay tester popup
- payment success state
- payment failure state

### Data shown

- quote summary
- line items
- tax plus fee amount
- total payable
- partner name
- latest payment method/status when present

### APIs

- `GET /api/customer/requests/:id/quote`
- `GET /api/customer/requests/:id/payment/status`
- `POST /api/customer/requests/:id/payment/initiate`

### Current payment behavior

- Razorpay is not integrated yet
- frontend currently uses mock success and mock failure actions
- payment retry is supported in the mock flow

## Customer Rating

### Screen

Route: `/customer/request/:id/rating`

File: `src/pages/customer/CustomerRatingPage.tsx`

### Current state

- frontend completion/rating screen exists
- currently used as the post-service feedback end state

## Customer Request History

### Screen

Route: `/customer/requests`

File: `src/pages/customer/CustomerRequestsHistoryPage.tsx`

### Sections

- status tabs
- request cards list
- empty state

### Data shown

- issue summary
- location
- request status
- request date
- final or quoted amount

### APIs

- `GET /api/customer/requests/history`

### Tabs

- active
- completed
- cancelled

## Customer Vehicles

### Screen

Route: `/customer/vehicles`

File: `src/pages/customer/CustomerVehiclesPage.tsx`

### Sections

- header
- vehicle list
- add vehicle modal/form
- edit vehicle modal/form
- empty state

### Data shown

- make
- model
- plate
- type
- fuel type

### APIs

- shared `GET /api/customer/profile`
- `PUT /api/customer/profile` to add/edit/remove from `savedVehicles`

## Customer Saved Locations

### Screen

Route: `/customer/locations`

File: `src/pages/customer/CustomerSavedLocationsPage.tsx`

### Sections

- header
- saved location list
- add location form
- edit location form
- empty state

### Data shown

- saved label such as Home or Work
- full address text
- saved coordinates

### APIs

- shared `GET /api/customer/profile`
- `PUT /api/customer/profile` to add/edit/remove from `savedLocations`

## Customer Notifications

### Screen

Route: `/customer/notifications`

File: `src/pages/customer/CustomerNotificationsPage.tsx`

### Sections

- notifications header
- unread summary
- notifications feed
- empty state

### Data shown

- notification title/message
- read/unread state
- time ordering based on returned feed

### APIs and realtime

- `GET /api/customer/notifications`
- realtime stream: `/api/customer/notifications`

## Customer Support

### Screen

Route: `/customer/support`

File: `src/pages/customer/CustomerSupportPage.tsx`

### Sections

- header
- quick help categories
- create ticket form
- request selector
- ticket history

### Data shown

- issue category
- linked request
- subject
- description
- evidence notes
- ticket status and recent tickets

### APIs and realtime

- `GET /api/customer/requests/history`
- `GET /api/customer/support/tickets`
- `POST /api/customer/support/tickets`
- realtime stream: `/api/customer/support/tickets`

### Support scenarios

- active request support
- payment issue ticket
- cancellation issue ticket
- safety issue ticket
- technical issue ticket

## Customer Profile

### Screen

Route: `/customer/profile`

File: `src/pages/customer/CustomerProfilePage.tsx`

### Sections

- profile summary card
- account details
- profile edit modal/form
- password change area
- shortcuts
- logout
- delete account

### Data shown

- display name
- email
- phone
- profile picture when set

### APIs

- shared `GET /api/customer/profile`
- `PUT /api/customer/profile`
- `PUT /api/auth/password`
- `DELETE /api/customer/account`

### Lifecycle note

- deleted customer accounts are intended to be able to register again later

## Customer Trusted Partners

### Screen

Route: `/customer/trusted-partners`

File: `src/pages/customer/CustomerTrustedPartnersPage.tsx`

### Sections

- membership-aware header
- trusted partner cards
- membership CTA

### Data shown

- partner name
- trust/verification state
- active membership tier

### APIs

- `GET /api/public/mechanics?trustedOnly=true&sort=Available&limit=24`
- `GET /api/customer/membership/status`

## Customer Membership

### Screen

Route: `/customer/membership`

File: `src/pages/MembershipPlansPage.tsx`

### Sections

- membership intro
- current status
- plan cards
- guest/customer guidance note

### Data shown

- tier
- plan name
- description
- price
- billing cycle
- platform fee discount
- priority support flag
- trusted-only access flag
- active plan state

### APIs

- `GET /api/customer/membership/plans`
- `GET /api/customer/membership/status`
- `POST /api/customer/membership/subscribe`

## Customer Settings

### Screen

Route: `/customer/settings`

File: `src/pages/customer/CustomerSettingsPage.tsx`

### Sections

- settings overview header
- preference groups
- current scope note

### Data shown

- live notification preference
- marketing notification preference
- request/safety preference groups shown by UI state

### Current note

- this screen is primarily frontend preference UI at present
- it is not yet wired as a full backend settings center

## Customer Safety and Emergency

### Screens

- `/emergency`
- support and safety shortcuts from home and request flows

### Current practical coverage in frontend

- emergency entry point exists
- support escalation exists
- cancellation and quote checkpoints exist
- OTP is part of partner completion flow, but customer-side OTP visibility still depends on backend request state data being present in UI-relevant steps

## Partner Application

## Partner Route Map

- `/partner/login`
- `/partner/login?action=register`
- `/partner/login?action=reset`
- `/partner`
- `/partner/requests`
- `/partner/request/:id`
- `/partner/request/:id/quote`
- `/partner/request/:id/complete`
- `/partner/earnings`
- `/partner/performance`
- `/partner/account`
- `/partner/services`
- `/partner/availability`
- `/partner/notifications`
- `/partner/support`
- `/partner/documents`
- `/partner/verification`
- `/partner/settlements`
- legacy verification routes: `/mechanic-dashboard/:id`, `/verify-flow/:id`

## Partner Auth and Approval Gate

### Screen

Route: `/partner/login`

File: `src/pages/partner/PartnerAuthPage.tsx`

Implementation note:

- this wraps `CustomerAuthPage` with `portalOverride="PARTNER"`

### Current partner-specific behavior

- partner screen only allows partner accounts to login
- registration uses email OTP verification flow
- optional business search is present during initial registration step
- strong password validation is enforced for partner registration
- unapproved partner users are redirected to legacy verification dashboard flow
- approved users can enter new `/partner/*` application shell

### APIs

- same auth APIs as customer auth
- optional business search: `GET /api/public/mechanics?...`

## Partner Dashboard

### Screen

Route: `/partner`

File: `src/pages/partner/PartnerDashboard.tsx`

### Sections

- dashboard header
- online/offline toggle
- earnings summary hero
- metric cards
- active job section
- area status section
- shortcuts
- incoming request modal

### Data shown

- today earnings
- weekly growth-style indicator
- jobs completed
- hours online
- rating or score
- live notifications count
- current active job summary
- nearby demand/request availability summary

### APIs and realtime

- realtime stream: `GET /api/mechanic/jobs/stream`
- fallback: `GET /api/mechanic/jobs`
- `GET /api/mechanic/earnings`
- `GET /api/mechanic/performance/insights`
- `GET /api/public/mechanics/:id`
- `POST /api/mechanic/live/go-online`
- `POST /api/mechanic/live/go-offline`
- `POST /api/mechanic/jobs/:id/accept`
- `POST /api/mechanic/jobs/:id/reject`

### Scenarios

- incoming assigned request appears as popup modal
- accept opens active job flow
- reject returns job feed to waiting state
- offline partner can go online directly from dashboard

## Partner Requests Hub

### Screen

Route: `/partner/requests`

File: `src/pages/partner/PartnerRequestsPage.tsx`

### Sections

- requests header
- tabs
- available jobs list
- active jobs list
- completed jobs list
- cancelled jobs list

### Data shown

- issue summary
- address
- lifecycle label
- earned amount for completed jobs

### APIs and realtime

- realtime stream: `GET /api/mechanic/jobs/stream`
- fallback: `GET /api/mechanic/jobs`
- `POST /api/mechanic/jobs/:id/accept`
- `POST /api/mechanic/jobs/:id/reject`

### Transition coverage

- available -> accept/reject
- active -> open active job
- completed -> read-only detail access
- cancelled -> read-only status visibility

## Partner Active Job

### Screen

Route: `/partner/request/:id`

File: `src/pages/partner/PartnerActiveJobPage.tsx`

### Sections

- job header
- live map and route
- customer/job summary
- route summary
- lifecycle action buttons
- inspection and quote guidance

### Data shown

- request details
- customer/location details
- route distance and duration
- current lifecycle status

### APIs and realtime

- realtime stream: `GET /api/mechanic/jobs/:id/stream`
- fallback: `GET /api/mechanic/jobs/:id`
- status updates: `POST/PUT /api/mechanic/jobs/:id/status`
- route preview: `GET /api/public/route`

### Lifecycle actions currently surfaced

- accept-related live state continuation
- en route
- arrived
- start service
- open quote flow
- complete flow

## Partner Quote

### Screen

Route: `/partner/request/:id/quote`

File: `src/pages/partner/PartnerQuotePage.tsx`

### Sections

- quote builder header
- dynamic line items
- notes area
- total summary
- submit action

### Data shown

- line item title
- quantity/cost
- notes
- total quote

### APIs

- `POST /api/mechanic/jobs/:id/quote`

### Current rule

- frontend strips UI-only `id` values from line items before submit

## Partner Complete Job

### Screen

Route: `/partner/request/:id/complete`

File: `src/pages/partner/PartnerCompleteJobPage.tsx`

### Sections

- completion header
- final amount summary
- OTP input
- complete action
- success state

### Data shown

- total amount
- completion OTP entry

### APIs

- `GET /api/mechanic/jobs/:id`
- status update: `POST/PUT /api/mechanic/jobs/:id/status`

## Partner Earnings

### Screen

Route: `/partner/earnings`

File: `src/pages/partner/PartnerEarningsPage.tsx`

### Sections

- earnings header
- period selector
- net earnings hero
- metric cards
- earnings transaction list

### Data shown

- today
- week
- month
- total
- pending
- settled
- platform fee
- gross
- net
- cash collected
- online payments
- refund adjustments
- cancellation compensation
- payout-related transaction data

### APIs and realtime

- `GET /api/mechanic/earnings`
- realtime stream: `/api/mechanic/earnings`

## Partner Performance

### Screen

Route: `/partner/performance`

File: `src/pages/partner/PartnerPerformancePage.tsx`

### Sections

- performance header
- partner score summary
- metric cards

### Data shown

- partner score
- acceptance rate
- completion rate
- reject rate
- quote approval rate
- online hours
- average ETA

### APIs

- `GET /api/mechanic/performance/insights`

## Partner Account

### Screen

Route: `/partner/account`

File: `src/pages/partner/PartnerAccountPage.tsx`

### Sections

- account header
- profile summary
- service and area summary
- verification and documents shortcuts
- bank and settlements shortcut
- notifications shortcut
- support shortcut
- password change area
- logout area

### Data shown

- business name or partner name
- verification level
- trusted partner state
- service/area summary

### APIs

- `GET /api/public/mechanics/:id`
- `PUT /api/auth/password`

## Partner Services

### Screen

Route: `/partner/services`

File: `src/pages/partner/PartnerServicesPage.tsx`

### Current state

- frontend service toggles screen exists
- currently behaves as local UI state, not full backend-managed service configuration

## Partner Availability

### Screen

Route: `/partner/availability`

File: `src/pages/partner/PartnerAvailabilityPage.tsx`

### Sections

- header
- current availability card
- online/offline actions

### APIs

- `POST /api/mechanic/live/go-online`
- `POST /api/mechanic/live/go-offline`

## Partner Notifications

### Screen

Route: `/partner/notifications`

File: `src/pages/partner/PartnerNotificationsPage.tsx`

### Sections

- notifications header
- unread summary
- notifications feed
- empty state

### Data shown

- partner alerts
- read/unread state
- live incoming updates

### APIs and realtime

- `GET /api/mechanic/notifications`
- realtime stream: `/api/mechanic/notifications`

## Partner Support

### Screen

Route: `/partner/support`

File: `src/pages/partner/PartnerSupportPage.tsx`

### Sections

- support header
- quick help
- open ticket form
- linked job selector
- recent tickets

### Data shown

- support category
- linked job
- issue details
- ticket status history

### APIs and realtime

- `GET /api/mechanic/jobs`
- `GET /api/mechanic/support/tickets`
- `POST /api/mechanic/support/tickets`
- realtime stream: `/api/mechanic/support/tickets`

## Partner Documents

### Screen

Route: `/partner/documents`

File: `src/pages/partner/PartnerDocumentsPage.tsx`

### Sections

- documents header
- business/profile summary
- submitted proof/document view

### APIs

- `GET /api/public/mechanics/:id`

## Partner Verification

### Screen

Route: `/partner/verification`

File: `src/pages/partner/PartnerVerificationPage.tsx`

### Sections

- verification header
- status summary
- verification level card
- trusted partner status
- reviewer remarks

### APIs

- `GET /api/public/mechanics/:id`

### Scenarios

- approved
- pending
- rejected

## Partner Settlements

### Screen

Route: `/partner/settlements`

File: `src/pages/partner/PartnerSettlementsPage.tsx`

### Sections

- settlements header
- payout status summary
- settlement history
- bank or UPI withdrawal guidance

### Data shown

- payout status
- settlement entries
- bank/UPI withdrawal-related information

### APIs and realtime

- `GET /api/mechanic/earnings`
- realtime stream: `/api/mechanic/earnings`

## End-to-End Frontend Flow Summary

## Customer end-to-end flow

1. Customer opens login/register or continues as visitor on public discovery routes.
2. Customer signs in or registers with email OTP and customer-only role enforcement.
3. Customer lands on home, chooses location, confirms vehicle, and starts request flow.
4. Customer selects service -> vehicle -> location -> details -> confirm request.
5. Customer enters searching screen with realtime dispatch updates and nearby partner visibility.
6. Once assigned/accepted, customer moves into active request screen.
7. If quote is needed, customer reviews quote and approves/rejects.
8. If approved, customer completes payment through current mock payment flow.
9. After service completion, customer can enter rating/review flow.
10. Customer can revisit request history, profile, vehicles, locations, membership, trusted partners, notifications, and support.

## Partner end-to-end flow

1. Partner registers through partner auth flow with OTP verification.
2. If not approved, partner remains gated through verification/dashboard flow.
3. After approval, partner enters partner shell.
4. Partner goes online.
5. Assigned jobs appear in realtime dashboard modal and requests hub.
6. Partner accepts or rejects request.
7. Accepted request moves to active job with map and route.
8. Partner updates lifecycle states.
9. If inspection quote is needed, partner creates quote and sends it.
10. After customer approval and service progress, partner completes job with OTP/final completion step.
11. Partner reviews earnings, performance, notifications, support tickets, verification, and settlements.

## Scenario Coverage Snapshot

## Customer scenarios currently covered in frontend

- login
- register with OTP
- forgot password
- reset password
- duplicate email validation
- duplicate mobile validation
- save vehicle
- edit vehicle
- delete vehicle
- save location
- edit location
- delete location
- submit request
- manual mechanic preference during request
- random assignment fallback
- searching timeout
- expand search and retry
- cancel while searching
- cancel active request
- quote approve
- quote reject
- payment mock success
- payment mock failure
- request history review
- notifications feed
- support ticket create
- profile update
- password change
- delete account
- membership activation
- trusted partner browse

## Partner scenarios currently covered in frontend

- partner login
- partner register with OTP
- approval gate before full app access
- go online/offline
- receive assigned request in realtime
- accept request
- reject request
- view job lifecycle
- route/map view
- create quote
- complete service flow
- earnings view
- performance view
- notifications feed
- support ticket create
- verification status review
- settlements view
- password change
- logout

## Current Frontend Gaps or Partial Areas

- customer settings is not yet a full backend-driven preference center
- partner services screen is still local UI state, not full backend-managed configuration
- customer rating flow exists, but deeper review storage/analytics should be validated against backend if expanded
- emergency and safety flows exist in entry points, but some advanced safety states still depend on backend depth and additional UX expansion

## Maintenance Note

When updating this document, keep it aligned with:

- `src/App.tsx`
- customer and partner page files under `src/pages/customer` and `src/pages/partner`
- shared data sources in `src/contexts/DataContext.tsx`
- realtime usage through `src/api/realtime`
