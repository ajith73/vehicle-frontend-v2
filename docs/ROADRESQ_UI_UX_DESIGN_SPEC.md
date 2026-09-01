# RoadResQ — UI / UX / Responsive Design Specification

**Version:** 1.0  
**Updated:** September 1, 2026  
**Scope:** Customer + Partner applications, shared UI system, responsive behavior, screen-by-screen UI/UX rules, components, states, comments, and end-to-end flows.

---

# 1. Purpose

This document is an **additive UI/UX implementation specification** for the current RoadResQ frontend.

The existing current-state document already defines the implemented routes, APIs, realtime behavior, and scenarios. This document does **not** replace those facts. It adds the visual, interaction, responsive, accessibility, and component rules needed to make the current screens production-quality.

Current implementation references that must remain aligned:

- `src/App.tsx`
- `src/components/layout/CustomerLayout.tsx`
- `src/components/layout/PartnerLayout.tsx`
- `src/contexts/DataContext.tsx`
- `src/pages/customer/*`
- `src/pages/partner/*`
- `src/api/realtime`

The current application already has:

- Customer and Partner role shells
- customer request lifecycle
- partner job lifecycle
- realtime streams
- maps/list discovery
- notifications
- support tickets
- quote flow
- payment flow
- rating flow
- vehicles and saved locations
- membership/trusted partner screens
- partner earnings/performance/verification/settlement screens

The objective now is to make those screens visually consistent, easy to operate under roadside stress, responsive on all common device sizes, and maintainable through reusable components.

---

# 2. Reference UI Direction

Two reference screenshots supplied with this task were reviewed as **visual inspiration only**.

## Reference A — Automotive Service App

Useful patterns to adopt:

- clean white/light-gray page surfaces
- strong dark navy primary branding
- compact rounded cards
- service/category tiles
- clear vehicle/service imagery
- large readable headings
- restrained shadows
- strong information hierarchy
- simple bottom navigation
- map + bottom-sheet interaction
- visual status cards
- consistent icon containers
- light/dark theme awareness

## Reference B — Roadside Assistance UI Kit

Useful patterns to adopt:

- high-contrast emergency actions
- strong status colors
- large rounded cards
- prominent primary CTA
- service selection grid
- step-by-step request flow
- clear location/map cards
- quote/payment summaries
- partner/customer profile cards
- verification/trust indicators
- large action buttons on job screens

## Important RoadResQ rule

Do **not** copy either reference literally.

RoadResQ should combine the strongest usability patterns while preserving the **existing RoadResQ visual identity and existing frontend theme tokens**.

Reference red should not become the global RoadResQ primary color if the current application already uses blue/navy branding.

---

# 3. Product UX Principles

## 3.1 Emergency-first UX

A customer may be:

- standing beside a broken vehicle
- outdoors in heat/rain
- using one hand
- under stress
- using a weak mobile connection
- looking at the screen briefly

Therefore every critical screen must answer:

1. What is happening?
2. Where is the vehicle?
3. What happens next?
4. How long will it take?
5. What can I do now?
6. How do I get help if something goes wrong?

## 3.2 One dominant action

Every screen must have one visually dominant action.

Examples:

- Home → `Request Help Now`
- Request step → `Continue`
- Confirm → `Request Assistance`
- Searching → `Cancel Request` / recovery action
- Active request → `Call` / `Help` depending on state
- Quote → `Approve Quote`
- Payment → `Pay`
- Partner dashboard → `Go Online`
- Incoming job → `Accept`
- Active partner job → current lifecycle action
- Complete job → `Complete Service`

Secondary actions must never visually compete with the primary action.

## 3.3 Progressive disclosure

Do not display every available detail immediately.

Show:

- critical information first
- supporting information second
- advanced information inside expandable sections

Example:

Customer active request:

```text
Partner arriving
ETA 8 min

[Map]

Partner
Service
Vehicle

[Call] [Help]

More details ▼
```

## 3.4 Reduce cognitive load

Avoid:

- unnecessary animations
- excessive gradients
- too many cards
- dense paragraphs
- tiny text
- multiple competing CTAs
- decorative UI that looks like a button
- maps covering the entire screen when a card is more useful

## 3.5 Consistency over novelty

The same component must look and behave the same everywhere.

For example:

- all primary buttons use the same height/radius/typography
- all status badges use the same semantic rules
- all cards use the same radius and border treatment
- all form validation behaves consistently
- all loading states use the same skeleton pattern

---

# 4. RoadResQ Visual Design System

## 4.1 Existing theme is the source of truth

The current application already uses shared theme variables such as:

```text
--bg-primary
--bg-secondary
--text-primary
--text-secondary
--text-muted
--border-primary
brand
brand-gradient
```

Implementation rule:

> **Do not hard-code a new brand palette inside individual pages.**

All screens must consume the existing theme tokens.

If a token is missing, add it to the global theme once rather than defining a page-specific color.

## 4.2 Semantic color roles

The RoadResQ interface should use these semantic roles:

| Role | Usage |
|---|---|
| Brand Primary | normal primary CTA, active navigation, links |
| Brand Dark | headings, high-emphasis text, dark surfaces |
| Brand Soft | selected backgrounds, icon containers |
| Emergency | SOS, emergency call, dangerous/critical actions |
| Success | completed, verified, paid, online |
| Warning | pending, attention, delayed |
| Error | validation, failed payment, rejected request |
| Neutral | secondary controls, borders, inactive states |

### Emergency color rule

Emergency red must be reserved for:

- SOS
- emergency service
- dangerous/critical state
- destructive confirmation
- critical alert

Do not make the entire application red.

## 4.3 Suggested semantic fallback palette

These are **fallback semantic values only** when an equivalent existing theme token does not exist:

```text
Brand / Navy:      #0B3B70
Brand Deep:        #082B52
Brand Soft:        #EAF2FA

Emergency Red:     #D92D20
Emergency Soft:    #FDECEC

Success:           #168A52
Warning:           #B7791F
Error:             #C62828

Surface:           #FFFFFF
Page Background:   #F6F8FB
Border:            #E2E8F0

Text Primary:      #172033
Text Secondary:    #526071
Text Muted:        #7A8797
```

If the current RoadResQ theme contains different exact values, **keep the current values** and map the semantic names to those tokens.

## 4.4 Light mode

Default customer/partner presentation:

- white or very light page background
- white cards
- subtle border
- limited shadow
- navy/brand primary
- dark readable text
- muted gray secondary text

Avoid:

- pure black body text everywhere
- heavy drop shadows
- large glassmorphism surfaces
- low-contrast gray text

## 4.5 Dark mode

Dark mode should not simply invert colors.

Use:

```text
Page background → darkest neutral
Card → slightly lighter neutral
Border → low-contrast neutral
Text → high-contrast light
Muted text → readable gray
Brand → existing brand token with adjusted contrast
```

Never use pure white backgrounds for every card in dark mode.

---

# 5. Typography

Use one consistent product font family already supported by the application.

Recommended hierarchy:

```text
Display / Hero:      28–36px
Page title:          22–28px
Section title:       16–20px
Card title:          14–17px
Body:                14–16px
Secondary:           12–14px
Caption:             11–12px
```

Mobile rules:

- page title should normally remain at least 22px
- body text should normally remain at least 14px
- critical status text should not be smaller than 13px
- never use tiny uppercase text for important information

Use sentence case for most UI.

Use uppercase only for:

- compact status labels
- small category labels
- emergency labels when appropriate

---

# 6. Spacing System

Use a predictable spacing scale:

```text
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
```

Rules:

- page horizontal padding: 16px mobile
- page horizontal padding: 24px tablet
- page horizontal padding: 32px+ desktop
- card internal padding: 16–20px
- section spacing: 24–32px
- large hero spacing: 32–48px

Do not use arbitrary values repeatedly.

---

# 7. Radius and Elevation

Recommended:

```text
Small control:     8–10px
Input:             10–12px
Card:              16–20px
Large panel:       20–24px
Bottom sheet:      24px top corners
Pill/badge:        999px
```

Shadows must be subtle.

Prefer:

```text
border + very light shadow
```

over:

```text
large dark shadow
```

The UI should feel modern and trustworthy, not like a marketing poster.

---

# 8. Responsive Breakpoints

The UI must work from approximately 320px wide mobile devices through large desktop monitors.

Recommended responsive bands:

```text
XS: 320–374
SM: 375–639
MD: 640–767
LG: 768–1023
XL: 1024–1279
2XL: 1280+
```

## 8.1 Mobile: 320–639

Customer and Partner:

- single-column layouts
- bottom navigation
- sticky primary CTA where useful
- full-width inputs
- cards stacked vertically
- horizontal scrolling only for intentional carousels
- map + bottom sheet pattern
- no desktop sidebar
- no horizontal page overflow

## 8.2 Tablet: 640–1023

- two-column grids where content supports it
- larger map/detail split
- bottom navigation may remain
- cards can become 2-column
- forms can use 2-column layouts for independent fields
- maintain large touch targets

## 8.3 Desktop: 1024+

- persistent sidebar/navigation where appropriate
- content max-width
- multi-column layouts
- map/detail split views
- modal dialogs instead of full-screen sheets when appropriate
- wider information cards
- tables only where data density requires them

## 8.4 Large desktop

Do not stretch content indefinitely.

Recommended content max width:

```text
1200–1440px
```

Use centered content containers.

---

# 9. Touch and Interaction Rules

Minimum touch target:

```text
44 × 44px
```

Preferred for critical actions:

```text
48 × 48px
```

Critical mobile CTA:

```text
min-height: 48–52px
```

Do not create:

- tiny icon-only controls without tooltips/context
- adjacent destructive actions without spacing
- buttons that are too close to the browser edge

---

# 10. Global Application Shell

## Customer Shell

Current navigation includes:

- Home
- Map
- List
- Requests
- Support
- Trusted
- Settings
- Profile

### Mobile

Use a compact bottom navigation.

Do not display 8+ equal-weight navigation items in a single row.

Preferred pattern:

```text
Home | Requests | Support | Profile | More
```

Move less-used destinations such as:

- Map
- List
- Trusted
- Settings

into `More` if the current navigation becomes visually crowded.

If the current product intentionally keeps Map/List visible, use an overflow-aware navigation design rather than shrinking labels.

### Desktop

Use:

```text
Sidebar
+
Top header
+
Main content
```

Sidebar width:

```text
240–280px
```

Main content should not touch the sidebar directly.

## Partner Shell

Primary navigation:

```text
Home
Requests
Earnings
Performance
Account
```

Persistent online/offline control must remain highly visible.

---

# 11. Global Header Rules

Header should contain only:

- back/menu where required
- page title or context
- notification action
- role/account action if needed

Do not put 5–7 icons into every header.

Mobile header:

```text
[Back/Menu]  Page title          [Action]
```

For active emergency/service screens:

```text
[Back]  Request #123              [Help]
```

---

# 12. Global Component Library

All screens should use reusable components.

## Core

```text
AppShell
PageContainer
PageHeader
SectionHeader
Button
IconButton
Input
Textarea
Select
SearchInput
Checkbox
Radio
Switch
Tabs
SegmentedControl
Dropdown
Tooltip
Badge
Chip
Card
Divider
Avatar
Skeleton
Spinner
Toast
Alert
Banner
Modal
Drawer
BottomSheet
ConfirmationDialog
EmptyState
ErrorState
OfflineBanner
```

## RoadResQ-specific

```text
ServiceCard
ServiceGrid
VehicleCard
VehicleSelector
LocationCard
LocationPicker
MapPanel
MapMarker
PartnerCard
PartnerSummaryCard
RequestCard
RequestStatusCard
RequestTimeline
QuoteCard
QuoteLineItem
PriceBreakdown
PaymentMethodCard
RatingInput
SupportTicketCard
NotificationItem
VerificationBadge
TrustBadge
AvailabilityToggle
EarningsCard
PerformanceMetricCard
JobActionBar
EmergencyActionCard
```

---

# 13. Component API / Behavior Comments

Every reusable component should have a clear contract.

Example:

```text
Button
- variant: primary | secondary | outline | ghost | danger
- size: sm | md | lg
- loading: boolean
- disabled: boolean
- fullWidth: boolean
- icon: optional
```

### Button rules

Primary:

- filled brand color
- white/high-contrast text
- one primary button per section

Secondary:

- outline or soft brand surface

Danger:

- only destructive/emergency-sensitive operations

Ghost:

- low-priority navigation

Loading:

- preserve button width
- show spinner
- prevent duplicate submission

Never change button width dramatically after clicking.

---

# 14. Standard Data States

Every data-driven component must support:

```text
Loading
Success
Empty
Error
Offline
Unauthorized
Forbidden
Expired
Stale
Retrying
```

## Loading

Use skeletons for page content.

Do not show:

```text
Loading...
```

for an entire screen when the layout can be shown immediately.

## Empty

Must explain:

```text
What is empty?
Why is it empty?
What can the user do?
```

Example:

```text
No saved vehicles yet

Add your vehicle to request roadside assistance faster.

[Add Vehicle]
```

## Error

Never use only:

```text
Something went wrong.
```

Use:

```text
We couldn't load your requests.

Please check your connection and try again.

[Try Again]
```

## Offline

For active request:

```text
Connection lost

Trying to reconnect...

Last updated 30 seconds ago
```

Never present stale realtime information as current.

---

# 15. Customer Screens — Detailed UI/UX Specification

# 15.1 Customer Login / Register

Route:

```text
/customer/login
```

Current implementation:

- login
- register
- forgot password
- reset password
- OTP flow
- customer-only role validation

## Layout

Mobile:

```text
Logo
Short welcome message

Auth card
  Email / phone
  Password
  Primary action
  Secondary links

Support/legal note
```

Desktop:

```text
Left: brand/value area
Right: compact auth card
```

Avoid oversized marketing content on auth screens.

## OTP

Use 6 input boxes only if already implemented.

Behavior:

- auto-focus
- paste support
- backspace navigation
- numeric keyboard on mobile
- resend timer
- clear error on correction
- announce invalid OTP clearly

Error:

```text
That code isn't correct.
Check the code and try again.
```

Do not clear all six digits unnecessarily after one failed attempt.

---

# 15.2 Customer Home

Route:

```text
/customer
```

## Information hierarchy

1. Location
2. Emergency/request CTA
3. Active request
4. Quick services
5. Vehicle
6. Recent services
7. Membership/trusted/support shortcuts

## Recommended mobile layout

```text
Header
↓
Location Card
↓
Request Help Now
↓
Active Request (only if active)
↓
Quick Services
↓
Vehicle
↓
Recent Services
↓
Trust / Membership / Safety
```

## Location card

Show:

```text
Current location
Area/city
[Change]
```

If unresolved:

```text
Where are you stranded?

Use your current location or search manually.

[Use GPS]
[Choose on Map]
```

Do not silently assume location.

## Request Help CTA

Large, full-width button:

```text
Request Help Now
```

Use brand primary.

If the situation is explicitly emergency-level, show a separate emergency action using emergency semantics.

## Quick service grid

Mobile:

- 2 columns
- 3 columns only when the labels remain readable

Each tile:

```text
Icon
Service name
Optional short label
```

Avoid long descriptions inside tiny tiles.

## Vehicle card

Show:

```text
Vehicle icon
Hyundai i20
TN XX XX XXXX
Default
```

Action:

```text
Change
```

## Active request

Never hide an active request below generic promotional content.

Place it above non-critical content.

Show:

```text
Partner arriving
ETA 8 min
Service: Battery Assistance

[View Request]
```

---

# 15.3 Customer Request Flow

Route:

```text
/customer/request
```

Current step order:

1. Problem selection
2. Vehicle selection
3. Location
4. Additional details
5. Confirm request

## Flow shell

Mobile:

```text
Back
Step 2 of 5

Progress indicator

Question / section
Content

Sticky bottom action
```

Desktop:

```text
Page title
Progress indicator

Main content card
Summary panel
```

## Progress indicator

Use:

```text
1 Service → 2 Vehicle → 3 Location → 4 Details → 5 Confirm
```

Completed steps should be visually distinct.

Allow back navigation without losing entered data.

## Step 1 — Problem

Service tiles:

- image/icon
- title
- selected state
- optional helper text

Selected tile:

- stronger border
- brand soft background
- clear check/selected marker

Do not depend on color alone.

## Step 2 — Vehicle

If vehicles exist:

```text
Select vehicle

[Vehicle Card]
[Vehicle Card]

+ Add another vehicle
```

If no vehicles:

```text
No vehicle added yet

Add your vehicle to continue.

[Add Vehicle]
```

## Step 3 — Location

Use a dedicated location card.

```text
Search location
[Use current location]

Map

Selected address
Landmark

[Confirm Location]
```

### Location UX rules

- request permission only when needed
- explain why GPS is needed
- allow manual search
- allow map pin adjustment
- allow landmark
- show address confidence/selection clearly
- never submit an empty/ambiguous location

## Step 4 — Details

Optional fields should be visually marked:

```text
Additional details (optional)
```

Photos:

- clear upload target
- preview
- remove action
- upload failure state

Do not make video mandatory unless backend/business rules require it.

## Step 5 — Confirm

Use summary sections:

```text
Service
Vehicle
Location
Problem details
Price / pricing mode
Expected response
```

Fixed-price:

```text
Estimated total
```

Quote-based:

```text
Price will be confirmed after inspection.
```

Final CTA:

```text
Request Assistance
```

Before submission:

- disable duplicate taps
- show loading
- preserve form state if request fails

---

# 15.4 Customer Searching

Route:

```text
/customer/request/searching?id=:id
```

This is a high-stress screen.

## Layout

```text
Map
↓
Status bottom sheet

Finding nearby partners
Searching within X km

[Cancel Request]
```

Do not make the user stare at a spinner without useful information.

Show:

- search radius
- current location
- nearby partner activity where supported
- status animation
- support option

## No partner state

Never use infinite loading.

Flow:

```text
Searching
↓
No partner found
↓
Search wider
↓
Still unavailable
↓
Alternative help
```

Actions:

```text
Search Wider
Try Another Service
Contact Support
Cancel
```

---

# 15.5 Customer Active Request

Route:

```text
/customer/request/:id
```

This screen should be state-driven.

## EN_ROUTE

Top:

```text
Partner is on the way
ETA 8 min
```

Map:

- customer marker
- partner marker
- route

Partner card:

```text
Photo
Name
Rating
Verified
Service
```

Actions:

```text
Call
Message
Help
```

## ARRIVED

Change headline:

```text
Your partner has arrived
```

Remove unnecessary ETA emphasis.

Show:

```text
Arrived
Vehicle
Service
```

## SERVICE_STARTED

Headline:

```text
Service in progress
```

Show:

- service
- partner
- request number
- quote state if relevant

## Safety action

Emergency/help must remain reachable without navigating away.

---

# 15.6 Customer Quote

Route:

```text
/customer/request/:id/quote
```

Use a financial-document style.

## Structure

```text
Quote from Partner

Problem identified
Recommended work

Cost breakdown
----------------
Parts
Labour
Additional charges
Tax / fee
----------------
Total

Notes

[Reject]
[Approve Quote]
```

Primary action:

```text
Approve Quote
```

Secondary:

```text
Reject
Ask Question
Contact Support
```

Never hide the total.

Never use tiny gray text for money.

If quote is stale/expired:

```text
This quote is no longer available.

[Request New Quote]
[Contact Support]
```

---

# 15.7 Customer Payment

Route:

```text
/customer/request/:id/payment
```

## Structure

```text
Payment

Service
Partner

Price breakdown
Subtotal
Taxes
Fees
Total

Payment method

UPI
Card
Other supported method

[Pay ₹XXX]
```

## Payment states

```text
Pending
Processing
Paid
Failed
Refund Pending
Refunded
```

## Failed payment

Use clear recovery:

```text
Payment didn't go through.

Your request has not been marked as paid.

[Try Again]
[Change Payment Method]
[Contact Support]
```

Do not imply payment succeeded based only on client-side UI.

Current implementation note:

- frontend currently uses mock Razorpay success/failure behavior
- final production payment UI must reflect backend payment status

---

# 15.8 Customer Rating

Route:

```text
/customer/request/:id/rating
```

Keep the flow short.

```text
How was your service?

★★★★★

Service Quality
Professionalism
Response Time
Price Transparency

Comment (optional)

[Submit Review]
```

Do not force a long survey.

Allow skip if business requirements permit.

---

# 15.9 Customer Requests / History

Route:

```text
/customer/requests
```

Tabs:

```text
Active
Completed
Cancelled
```

Mobile card:

```text
Battery Assistance
Hyundai i20
Coimbatore
Completed
₹XXX

[View Details]
```

Desktop may use a table/list hybrid.

Actions:

- View details
- Rate
- Raise issue
- Book again
- Invoice if available

Avoid showing 8 actions on each card. Put secondary actions in a menu.

---

# 15.10 Customer Vehicles

Route:

```text
/customer/vehicles
```

## List

Each card:

```text
Vehicle illustration
Make / Model
Registration
Vehicle type
Fuel type
Default
```

Actions:

```text
Edit
Delete
Set Default
```

## Add/edit form

Group fields logically:

```text
Vehicle
Make
Model
Variant

Registration
Fuel type

Photos
```

Validation should be inline and immediate after interaction.

Example:

```text
Registration number
Please enter a valid registration number.
```

---

# 15.11 Customer Saved Locations

Route:

```text
/customer/locations
```

Cards:

```text
Home
Address
Default

Work
Address

Other
Address
```

Actions:

- Edit
- Delete
- Set default

Use recognizable location icons.

---

# 15.12 Customer Notifications

Route:

```text
/customer/notifications
```

Use grouped notification cards.

Example:

```text
Partner is arriving
Battery Assistance request
8 min ago

[View Request]
```

Unread state:

- subtle background
- unread indicator
- not a huge bright dot

Categories:

```text
Request
Payment
Promotion
System
Support
```

Do not make promotional notifications visually equal to emergency/request notifications.

---

# 15.13 Customer Support

Route:

```text
/customer/support
```

Quick help:

```text
Active Request
Payment Issue
Partner Issue
Cancellation
Safety Issue
Other
```

Ticket creation:

```text
Category
Request ID
Description
Photos / Attachments

[Submit Ticket]
```

Ticket history:

```text
Open
Assigned
In Progress
Resolved
Escalated
```

Active request support should be one tap away from the live request screen.

---

# 15.14 Customer Profile

Route:

```text
/customer/profile
```

Structure:

```text
Profile header

Personal information
Vehicles
Saved locations

Notifications
Payment methods

Privacy
Terms

Delete account
Logout
```

Do not put destructive actions near normal navigation without separation.

Delete account should require a confirmation dialog.

---

# 15.15 Customer Trusted Partners

Route:

```text
/customer/trusted-partners
```

Card:

```text
Partner photo
Partner name
Verified
Rating
Services
Availability

[View]
```

Membership restriction should be explained clearly.

Do not use a locked UI without explaining how to unlock it.

---

# 15.16 Customer Membership

Route:

```text
/customer/membership
```

Use plan comparison cards.

Show:

```text
Plan
Price
Billing cycle

Platform fee
Priority support
Trusted partners
```

Current product behavior:

- Free tier
- 1-month paid subscription
- subscribed users receive trusted partner access
- subscribed users have platform fee waived according to current product rules

The UI must state the actual current benefit clearly and avoid marketing exaggeration.

---

# 15.17 Customer Settings

Route:

```text
/customer/settings
```

Group preferences:

```text
Notifications
Safety
Marketing
```

Use switches with labels.

Example:

```text
Live request updates
Receive important updates while your request is active
[ON]
```

Current implementation note:

- this screen is primarily frontend preference UI
- it is not currently a complete backend-driven settings center

Do not show "Saved successfully" unless persistence actually occurred.

---

# 15.18 Emergency Screen

Route:

```text
/emergency
```

This screen must look different enough to communicate urgency.

Structure:

```text
Emergency Help

If you are in immediate danger:
move to a safe location first.

[Call Emergency Services]

[Share My Location]

[Share Active Request]

[Contact RoadResQ]
```

Emergency action should be:

- large
- obvious
- accessible
- one tap
- confirmation only where legally/business appropriate

Do not use decorative animations here.

---

# 16. Partner Screens — Detailed UI/UX Specification

# 16.1 Partner Login / Register

Route:

```text
/partner/login
```

Partner identity must be obvious.

Use:

```text
RoadResQ Partner
Manage roadside service jobs
```

Do not mix customer and partner language.

Partner registration can include:

- email OTP
- business search
- password
- verification/onboarding entry

If the partner is not approved, explain the gate:

```text
Your partner account is under verification.

Complete the remaining verification steps to start receiving jobs.

[Continue Verification]
```

---

# 16.2 Partner Dashboard

Route:

```text
/partner
```

Primary job:

> Help the partner understand whether they can receive work and what needs attention.

## Header

```text
Good morning

ONLINE ●
```

Online/offline control must be prominent.

## Earnings hero

```text
Today
₹1,250

+12% vs previous period
```

Only show comparison metrics if supported by real data.

## Current job

```text
Active Job
Battery Assistance
Customer
ETA / distance

[Open Job]
```

## Metrics

Use 2-column mobile cards:

```text
Jobs
Online Hours
Rating
Score
```

## Demand

Use simple text:

```text
High demand nearby
```

Do not introduce heatmaps until sufficient demand data exists.

---

# 16.3 Partner Incoming Request

This is the most time-sensitive partner screen.

It may be a modal, bottom sheet, or dedicated attention screen depending on viewport.

## Content

```text
NEW SERVICE REQUEST

Battery Assistance

2.4 km
8 min estimated travel

Estimated earnings
₹XXX
```

Map preview.

Primary:

```text
ACCEPT
```

Secondary:

```text
REJECT
```

Countdown:

```text
15s
```

## Rules

- countdown must be visually clear
- accept button must be the easiest target
- do not put reject next to accept with equal visual weight if accidental rejection is a concern
- no long descriptions
- no unnecessary navigation

Expired:

```text
Request expired
```

---

# 16.4 Partner Requests

Route:

```text
/partner/requests
```

Tabs:

```text
Available
Active
Completed
Cancelled
```

Card content:

```text
Service
Distance
Location
Status
Estimated earnings
```

Available:

```text
[View] [Accept]
```

Completed:

```text
Service
Customer
Date
Earned
```

Do not show customer sensitive information unnecessarily in lists.

---

# 16.5 Partner Active Job

Route:

```text
/partner/request/:id
```

This is the partner's operational workspace.

## Header

```text
Battery Assistance
EN ROUTE
```

## Map

Map should occupy meaningful space.

Mobile:

```text
Map
↓
Job bottom sheet
```

Desktop:

```text
Map 60%
Details 40%
```

## Customer/job summary

```text
Customer
Vehicle
Service
Location
```

Actions:

```text
Call
Message
Navigate
```

## Lifecycle action

Only show the next valid action prominently.

Example:

```text
EN_ROUTE

[Mark Arrived]
```

Then:

```text
ARRIVED

[Start Service]
```

Then:

```text
SERVICE_STARTED

[Complete Service]
```

Do not show every lifecycle button simultaneously.

This prevents invalid transitions.

---

# 16.6 Partner Navigation

The RoadResQ app should provide route context but should not unnecessarily rebuild a complete navigation engine.

Show:

```text
Destination
Distance
ETA
Route preview

[Open Navigation]
```

If external navigation is used, preserve return-to-job behavior.

After returning from navigation, the partner should still see the correct lifecycle state.

---

# 16.7 Partner Quote

Route:

```text
/partner/request/:id/quote
```

Quote builder:

```text
Quote

Inspection summary

Line items
Part
Quantity
Unit cost

Labour
Other charges

Notes
Photos

Total

[Send Quote]
```

Rules:

- total updates live
- invalid numeric values highlighted immediately
- no negative prices
- line item deletion requires accessible action
- prevent accidental double submission
- preserve draft during temporary failures where possible

Current implementation:

- UI-only line-item IDs are stripped before submission

Do not expose implementation IDs to users.

---

# 16.8 Partner Complete Job

Route:

```text
/partner/request/:id/complete
```

Structure:

```text
Complete Service

Service summary
Final amount

Customer confirmation
OTP

[Complete Service]
```

If OTP is required:

```text
Enter the customer's completion OTP
```

Success:

```text
Service completed

₹XXX earned

[View Earnings]
```

Do not navigate away before showing confirmation.

---

# 16.9 Partner Earnings

Route:

```text
/partner/earnings
```

Hero:

```text
Net Earnings
₹XX,XXX
```

Period:

```text
Today | Week | Month
```

Metrics:

```text
Gross
Platform Fee
Net
Pending
Settled
Cash Collected
Online Payments
```

Transactions:

```text
Date
Request
Gross
Fees
Adjustments
Net
Status
```

Mobile:

- use cards
- avoid forcing a wide table

Desktop:

- table is acceptable

---

# 16.10 Partner Performance

Route:

```text
/partner/performance
```

Metrics:

```text
Partner Score
Acceptance Rate
Completion Rate
Reject Rate
Quote Approval Rate
Online Hours
Average ETA
```

Use:

- progress bars
- metric cards
- short explanations

Do not use vanity metrics.

Example:

```text
Acceptance Rate
82%

You accepted 82% of requests received.
```

---

# 16.11 Partner Services

Route:

```text
/partner/services
```

Current implementation:

- frontend service toggles exist
- configuration is currently local UI state rather than full backend-managed configuration

Recommended UI:

```text
Services

Battery Assistance        [ON]
Tyre Assistance           [ON]
Towing                    [OFF]
Fuel Delivery             [ON]
Mechanical Repair         [ON]
```

If service radius/pricing is not actually persisted, do not make the UI falsely imply that it is saved server-side.

Use:

```text
Changes apply to this session
```

only if that is truly the behavior.

---

# 16.12 Partner Availability

Route:

```text
/partner/availability
```

Primary control:

```text
ONLINE
```

State explanations:

```text
ONLINE
You can receive new requests.

PAUSED
You are temporarily not receiving new requests.

OFFLINE
You are unavailable for new requests.

BUSY
You are currently handling a job.

SUSPENDED
You cannot receive new requests.
```

Use color + text + icon, never color alone.

---

# 16.13 Partner Notifications

Route:

```text
/partner/notifications
```

Priority order:

1. New request
2. Customer cancellation
3. Job expiry
4. Payment
5. Verification
6. Settlement
7. System
8. Promotional/low priority

Use clear notification timestamps.

---

# 16.14 Partner Support

Route:

```text
/partner/support
```

Quick help:

```text
Request Problem
Customer Problem
Payment Problem
Navigation Problem
Account Problem
Verification
Other
```

For an active job, show:

```text
Need help with this job?

[Contact Support]
```

Link the active request automatically where possible.

---

# 16.15 Partner Documents

Route:

```text
/partner/documents
```

Use document cards:

```text
Identity Document
Status: Verified
Updated: date

Business Proof
Status: Pending
```

Do not show raw internal verification codes.

---

# 16.16 Partner Verification

Route:

```text
/partner/verification
```

Status states:

```text
Approved
Pending Review
Rejected
```

Rejected:

```text
Document rejected

Reason:
Image is unclear.

What to do:
Upload a clearer document.

[Replace Document]
```

Never show only:

```text
Rejected
```

without a recovery path.

---

# 16.17 Partner Settlements

Route:

```text
/partner/settlements
```

Summary:

```text
Pending Settlement
Next Settlement
Settled Amount
```

History:

```text
Date
Period
Amount
Status
Reference
```

Bank/UPI guidance must be clear and never imply money has been transferred before backend confirmation.

---

# 16.18 Partner Account

Route:

```text
/partner/account
```

Structure:

```text
Profile
Business
Services
Area
Verification
Documents
Bank / Settlements
Notifications
Support
Password
Logout
```

Keep account settings task-oriented.

---

# 17. Maps and Location UX

Maps are important but should not dominate every page.

## Customer

Use map for:

- location selection
- partner tracking
- service location
- nearby discovery

## Partner

Use map for:

- customer destination
- route preview
- navigation handoff

## Map controls

Do not stack 8 floating buttons.

Preferred:

```text
[Locate Me]
[Zoom + / - if needed]
```

Bottom sheet contains the main information.

## Map loading

Show:

```text
Loading map...
```

while keeping the rest of the screen useful.

If map fails:

```text
Map unavailable

Your address is still available below.

[Retry Map]
```

Do not block the entire request because the visual map failed.

---

# 18. Responsive Map Patterns

## Mobile

Use:

```text
Map 45–65% viewport
Bottom sheet 35–55%
```

Bottom sheet must scroll independently.

## Tablet

Use:

```text
Map 55–65%
Details 35–45%
```

## Desktop

Use:

```text
Map 60–70%
Details 30–40%
```

Do not allow the details panel to become too narrow for important text.

---

# 19. Forms and Validation

## Validation principles

Validate:

- on blur
- on submit
- immediately for obvious formatting problems

Do not show every error before the user interacts.

## Error placement

Put the error:

- directly below the field
- with sufficient contrast
- with a short explanation

Example:

```text
Mobile number
[98765]

Please enter a valid 10-digit mobile number.
```

Do not move the entire form dramatically when an error appears.

Reserve space or use stable layout patterns.

## Required indicators

Prefer:

```text
Mobile number *
```

Do not make optional fields look required.

---

# 20. Modal / Bottom Sheet Rules

Use a modal for:

- confirmation
- destructive action
- focused short task

Use a bottom sheet on mobile for:

- filters
- quick details
- map job information
- action menus

Do not put an entire long form into a tiny modal.

For mobile:

- sheet can approach full height
- rounded top corners
- clear close action
- body scrolls
- CTA remains accessible

---

# 21. Toast / Snackbar Rules

Toast is for confirmation, not critical information.

Good:

```text
Vehicle saved
```

Good:

```text
Request cancelled
```

Bad:

```text
Your partner has arrived
```

Important lifecycle events should appear inside the page as persistent status.

---

# 22. Motion Rules

Use motion only when it improves understanding.

Good:

- request searching pulse
- partner location movement
- status transition
- card appearance
- modal entry

Avoid:

- continuous decorative animations
- large page transitions
- bouncing buttons
- aggressive scaling
- animations during emergency actions

Respect:

```text
prefers-reduced-motion
```

---

# 23. Accessibility Requirements

Every screen must support:

- keyboard navigation on desktop
- visible focus state
- semantic buttons
- labels for inputs
- accessible icon buttons
- screen-reader-friendly status changes
- sufficient contrast
- no color-only meaning
- 44px minimum touch targets
- meaningful image alt text
- reduced-motion support

Realtime updates should use accessible announcements where appropriate.

Example:

```text
Partner has arrived.
```

Do not announce every GPS update.

---

# 24. Content / Microcopy Rules

RoadResQ language should be:

- direct
- calm
- reassuring
- action-oriented
- short

Prefer:

```text
Finding nearby partners...
```

over:

```text
We are currently attempting to locate a suitable service provider for your request.
```

Prefer:

```text
Payment failed
Try another payment method.
```

over:

```text
Something unexpected occurred while processing your transaction.
```

Prefer:

```text
Your partner is on the way
```

over:

```text
Mechanic status is EN_ROUTE
```

Technical state names belong in developer/API documentation, not customer UI.

---

# 25. Status Semantics

The backend currently uses lifecycle states including:

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

Failure/exit states include:

```text
NO_RESPONSE
REJECTED_BY_MECHANIC
CUSTOMER_NO_RESPONSE
MECHANIC_NO_SHOW
SERVICE_CANCELLED
CANCELLED_BY_CUSTOMER
CANCELLED_BY_ADMIN
```

Commercial states include:

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

## UI mapping

Never expose raw enum values to customers.

Example:

```text
EN_ROUTE
→
Partner is on the way
```

```text
SERVICE_STARTED
→
Service in progress
```

```text
QUOTE_SUBMITTED
→
Quote ready for your review
```

```text
PAYMENT_FAILED
→
Payment didn't go through
```

---

# 26. Customer End-to-End Flow

```text
Open RoadResQ
      ↓
Login / Register / Guest Discovery
      ↓
Location
      ↓
Vehicle
      ↓
Service
      ↓
Problem Details
      ↓
Confirm Request
      ↓
Authentication Gate if required
      ↓
Request Created
      ↓
Searching
      ↓
Partner Found
      ↓
Partner Accepts
      ↓
Partner En Route
      ↓
Partner Arrives
      ↓
Inspection if required
      ↓
Fixed Price OR Quote
      ↓
Customer Approval if Quote
      ↓
Service
      ↓
Completion
      ↓
Payment
      ↓
Rating
      ↓
History
```

## Customer scenario: no partner

```text
Searching
↓
No partner
↓
Search wider
↓
No partner
↓
Try another service / support
↓
Cancel
```

## Customer scenario: partner cancels

```text
Partner cancelled
↓
Explain what happened
↓
Automatically resume search if backend supports it
OR
Offer:
Search again
Contact support
Cancel
```

Never silently return the customer to Home.

## Customer scenario: network loss

```text
Connection lost
↓
Keep last known state visible
↓
Reconnect
↓
Refresh authoritative status
```

Never allow the UI to invent a new lifecycle state while offline.

---

# 27. Partner End-to-End Flow

```text
Register
   ↓
Email / OTP
   ↓
Verification / KYC
   ↓
Approved
   ↓
Go Online
   ↓
Receive Request
   ↓
Accept
   ↓
Navigate
   ↓
Arrive
   ↓
Inspect
   ↓
Quote if Required
   ↓
Customer Approval
   ↓
Service
   ↓
Complete
   ↓
Payment Confirmation
   ↓
Earnings / Settlement
```

## Partner scenario: reject

```text
Incoming request
↓
Reject
↓
Select reason
↓
Submit
↓
Return to available jobs
```

Do not ask for a reason if backend/business rules do not require one.

## Partner scenario: request expires

```text
Countdown reaches zero
↓
Request expired
↓
Remove actionable state
↓
Return to job feed
```

## Partner scenario: goes offline with active job

The active job must remain accessible.

Do not let the online/offline control accidentally terminate an active job.

## Partner scenario: suspended

```text
SUSPENDED
↓
Do not receive new requests
↓
Explain reason/status
↓
Provide verification/support path
```

---

# 28. Error Recovery Matrix

| Scenario | UI | Recovery |
|---|---|---|
| GPS denied | Location explanation | Search manually |
| GPS inaccurate | Accuracy warning | Move pin |
| Network lost | Offline banner | Retry/reconnect |
| Services API fails | Error state | Retry |
| No vehicle | Empty state | Add vehicle |
| No partner | Recovery screen | Search wider/support |
| Partner rejects | Resume search | Search again |
| Customer cancels | Confirmation | Return to home/history |
| Quote rejected | Status explanation | Continue/support |
| Quote expired | Expired state | Request new quote |
| Payment failed | Failure card | Retry/change method |
| Partner no-show | Escalation state | Contact support |
| Session expired | Auth prompt | Sign in again |
| Account suspended | Restricted state | Support |
| KYC rejected | Reason + correction | Replace document |

---

# 29. Preventing Common Current UI Problems

## Problem: missing input validation

Every form must have:

- field-level validation
- submit validation
- server error mapping
- visible error state
- preserved user input where safe

## Problem: no error highlight

Invalid fields must receive:

- error border
- error message
- accessible error association

Do not rely only on a toast.

## Problem: non-responsive desktop layouts

Never use fixed widths such as:

```text
width: 500px
margin-left: 300px
```

without responsive rules.

Prefer:

```text
width: 100%
max-width: 520px
```

## Problem: overflowing cards

Use:

```text
min-width: 0
overflow-wrap: anywhere
```

for long:

- addresses
- request IDs
- emails
- service names

## Problem: oversized images

Use:

```text
object-fit: cover
aspect-ratio
lazy loading
```

Do not allow images to determine uncontrolled card height.

## Problem: huge maps

Maps should have intentional viewport-based heights.

## Problem: too many cards

Cards should represent meaningful groups of information. Do not put every label into its own card.

---

# 30. Responsive Acceptance Criteria

A screen is not complete until it passes:

## Mobile

Test at:

```text
320 × 568
360 × 800
390 × 844
430 × 932
```

## Tablet

Test at:

```text
768 × 1024
820 × 1180
```

## Desktop

Test at:

```text
1024 × 768
1280 × 800
1440 × 900
1920 × 1080
```

## Required checks

- no horizontal scrolling
- no clipped buttons
- no clipped text
- no overlapping modals
- bottom CTA does not cover content
- keyboard does not hide active input
- map controls remain reachable
- cards resize correctly
- navigation remains usable
- dialogs fit viewport
- tables have a mobile alternative
- long addresses wrap
- loading/error/empty states fit
- dark mode remains readable

---

# 31. Device-Specific Rules

## Small phones

At 320px:

- use one-column layout
- reduce decorative spacing
- keep CTA full width
- shorten non-essential labels
- never reduce body text below accessibility-friendly sizes

## Notched phones

Use safe-area-aware padding:

```text
env(safe-area-inset-top)
env(safe-area-inset-bottom)
```

especially for:

- bottom navigation
- sticky CTA
- fullscreen map
- emergency controls

## Landscape mobile

Do not assume portrait only.

Map/job screens should remain usable in landscape.

## Desktop touchscreens

Buttons should still meet touch-friendly sizes.

---

# 32. Page Container Rules

Mobile:

```text
padding-inline: 16px
```

Tablet:

```text
padding-inline: 24px
```

Desktop:

```text
padding-inline: 32px
```

Maximum content width:

```text
1200–1440px
```

Full-bleed maps and emergency surfaces may intentionally ignore the content max-width.

---

# 33. Recommended Component Folder Structure

```text
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── EmptyState/
│   │   ├── ErrorState/
│   │   └── Skeleton/
│   │
│   ├── roadresq/
│   │   ├── ServiceCard/
│   │   ├── VehicleCard/
│   │   ├── LocationCard/
│   │   ├── PartnerCard/
│   │   ├── RequestCard/
│   │   ├── RequestTimeline/
│   │   ├── QuoteCard/
│   │   ├── PriceBreakdown/
│   │   ├── MapPanel/
│   │   ├── EmergencyActions/
│   │   └── AvailabilityToggle/
│   │
│   └── layout/
│       ├── CustomerLayout.tsx
│       └── PartnerLayout.tsx
│
├── pages/
│   ├── customer/
│   └── partner/
│
├── contexts/
├── api/
├── hooks/
├── theme/
└── utils/
```

The exact existing project structure may differ; the principle is to centralize reusable UI rather than duplicating page-specific components.

---

# 34. State Ownership Rules

Use the correct level of state.

## Local component state

Use for:

- modal open/close
- input draft
- selected tab
- temporary UI selection

## Page state

Use for:

- current request step
- page filters
- temporary quote draft

## Shared context

Use for:

- profile
- vehicles
- service master data
- shared cached data already handled by `DataContext`

## Server/realtime state

Backend must remain authoritative for:

- request status
- partner assignment
- partner location
- quote status
- payment status
- verification status
- settlement status

Never make server lifecycle state permanent local state.

---

# 35. Realtime UX Rules

Current realtime foundation uses:

```text
openRealtimeStream(...)
```

Realtime UI must support:

```text
Connected
Reconnecting
Disconnected
Stale
Recovered
```

## Reconnecting

Show a small non-blocking banner:

```text
Reconnecting...
```

## Recovered

Show:

```text
Connection restored
```

for a short duration.

## Stale

If no update has been received:

```text
Last updated 45 seconds ago
```

Do not keep showing:

```text
Partner arriving in 8 min
```

as if it were freshly calculated.

---

# 36. Performance Rules

Prioritize:

- fast initial render
- route-level code splitting
- lazy map loading
- lazy image loading
- cached service/vehicle data
- minimized API duplication
- skeleton states
- pagination for long lists
- virtualization for very large lists where necessary

Do not load:

- map libraries
- heavy image galleries
- charts
- unnecessary admin components

on pages that do not need them.

---

# 37. Image and Icon Rules

## Service icons

Use one visual family.

Do not mix:

- 3D icons
- flat line icons
- random emoji
- photographic icons

inside the same service grid.

The reference images demonstrate strong icon-grid patterns, but RoadResQ should choose one consistent icon treatment for production.

## Recommended

Use:

- consistent line/duotone icons
- existing RoadResQ service artwork where already implemented
- consistent icon container
- accessible labels

## Vehicle imagery

Vehicle cards may use realistic vehicle images if already part of the current product.

Keep:

- same image ratio
- same background treatment
- same card dimensions

---

# 38. Dark/Light Theme Rules

Every reusable component must be tested in both themes.

Do not:

```text
background: white;
color: #111;
```

inside a shared component.

Use theme tokens.

For images:

- verify sufficient contrast
- use appropriate border/background
- avoid transparent white icons disappearing in light mode

---

# 39. Security-Aware UI Rules

The UI must never expose:

- access tokens
- internal IDs unnecessarily
- backend secrets
- private payment data
- sensitive verification details

UI role restrictions must not be considered authorization.

Backend remains authoritative.

---

# 40. Analytics / UX Events

Important events should be measurable where analytics infrastructure exists.

Customer:

```text
customer_login
customer_register
location_selected
vehicle_selected
service_selected
request_started
request_submitted
search_started
partner_assigned
quote_viewed
quote_approved
quote_rejected
payment_started
payment_success
payment_failed
rating_submitted
support_created
```

Partner:

```text
partner_login
partner_online
partner_offline
job_received
job_accepted
job_rejected
job_arrived
service_started
quote_created
quote_sent
job_completed
earnings_viewed
support_created
```

Analytics events must not block the user flow.

---

# 41. QA Screen Checklist

Every screen must pass:

```text
[ ] Correct route
[ ] Correct role access
[ ] Loading state
[ ] Empty state
[ ] Error state
[ ] Offline state
[ ] Validation
[ ] Server error handling
[ ] Primary CTA
[ ] Secondary CTA
[ ] Back navigation
[ ] Confirmation where required
[ ] Duplicate-submit prevention
[ ] Mobile 320px
[ ] Mobile 390px
[ ] Tablet
[ ] Desktop
[ ] Dark mode
[ ] Keyboard navigation
[ ] Screen reader labels
[ ] 44px touch targets
[ ] No horizontal overflow
[ ] No clipped content
[ ] Realtime reconnection where applicable
[ ] Analytics where applicable
```

---

# 42. Definition of Done — Customer Screen

A Customer screen is complete only when:

1. The happy path works.
2. The backend state is represented correctly.
3. Every input has validation.
4. Errors appear beside the relevant field.
5. Loading does not block unnecessarily.
6. Empty state has an action.
7. Offline behavior is defined.
8. Mobile layout works from 320px.
9. Tablet layout works.
10. Desktop layout works.
11. Dark mode works if supported.
12. Accessibility checks pass.
13. Primary action is visually obvious.
14. Destructive actions are protected.
15. Realtime state cannot become falsely stale.
16. The screen does not duplicate reusable components unnecessarily.

---

# 43. Definition of Done — Partner Screen

A Partner screen is complete only when:

1. Partner role is enforced.
2. Current availability is obvious.
3. Active jobs cannot be accidentally lost.
4. Job lifecycle action is state-aware.
5. Request acceptance/rejection prevents duplicates.
6. Earnings are clearly separated from gross amounts.
7. Verification status is understandable.
8. Support is accessible from active jobs.
9. Mobile touch targets are large enough.
10. Realtime reconnect behavior is safe.
11. No invalid lifecycle actions are displayed.
12. All responsive breakpoints are tested.

---

# 44. Priority Order for UI/UX Refactoring

Given the current RoadResQ state, prioritize in this order.

## P0 — Critical

```text
1. Customer request flow
2. Customer searching
3. Customer active request
4. Partner incoming request
5. Partner active job
6. Location selection
7. Error/validation states
8. Responsive mobile layout
```

These directly affect successful roadside assistance.

## P1 — High

```text
9. Customer home
10. Partner dashboard
11. Customer quote
12. Customer payment
13. Partner quote
14. Partner completion
15. Requests/history
16. Support
17. Notifications
```

## P2 — Important

```text
18. Vehicles
19. Locations
20. Partner earnings
21. Partner performance
22. Verification
23. Settlements
24. Membership
25. Trusted partners
```

## P3 — Polish

```text
26. Motion refinement
27. advanced dark-mode polish
28. advanced micro-interactions
29. visual analytics enhancements
30. decorative marketing elements
```

Never polish animations before fixing broken validation, responsive layout, loading states, and lifecycle UX.

---

# 45. Final Product UI Direction

RoadResQ should feel like:

```text
Trusted
Fast
Clear
Calm
Operational
Automotive
Mobile-first
Professional
```

It should **not** feel like:

```text
Generic startup dashboard
Gaming UI
Overly red emergency application
Marketing poster inside an app
Dense admin software
A copied Uber/Rapido clone
```

The visual language should be:

```text
Existing RoadResQ brand
        +
Clean automotive service cards
        +
Strong navy/brand hierarchy
        +
Emergency red only when semantically required
        +
Simple maps
        +
Rounded but restrained cards
        +
Clear status states
        +
Large mobile CTAs
        +
Responsive desktop/tablet layouts
```

---

# 46. Core UX Rule

> **Design every screen around the user's next decision, not around the amount of data the backend can provide.**

For Customer:

```text
What do I need?
Where am I?
Who is coming?
When will they arrive?
What will it cost?
What do I do next?
```

For Partner:

```text
Am I available?
What job is available?
Should I accept it?
Where is the customer?
What is my next job action?
How much did I earn?
```

For both roles:

```text
Clear state
→
Clear next action
→
Clear feedback
→
Safe recovery
```

That is the design standard for the RoadResQ frontend going forward.
