# RoadResQ Customer Checklist Gap Report

Date: August 20, 2026

Purpose:

- check the customer-side checklist against the current application
- skip features that are already present
- identify partial or weak areas
- identify truly missing items to add next

Status meanings used here:

- `ALREADY THERE`
- `PARTIAL / WEAK`
- `NOT AVAILABLE`

---

# 1. Customer Navigation / Menu

## Already There

- Home
- Request Help
- My Requests
- Vehicles
- Saved Locations
- Notifications
- Support
- Emergency / Safety
- Profile
- Terms / Privacy
- Logout
- Delete Account

## Partial / Weak

- Subscription / Membership
  - backend and membership page exist
  - not clearly integrated into the main customer navigation
- Payments
  - payment stage exists in request flow
  - not a strong standalone customer payments/history area
- Help / FAQ
  - support exists
  - dedicated FAQ / help center is weak

## Not Available

- Trusted Partners menu
- Settings screen

---

# 2. Customer Home Screen

## Already There

- Header
- Active request
- Emergency CTA
- Quick services
- Service categories
- Saved/default vehicle
- Recent services
- Support shortcut

## Partial / Weak

- Current location
  - visible on screen, but still placeholder style and not truly GPS-driven in home UI
- Location selector
  - basic/manual behavior only
- Notification indicator
  - notifications page exists, but home/header badge is not strong
- Nearby partners
  - public map/list exists, but home integration is weak
- Trusted partners
  - some trust concepts exist in backend and map filtering, but home module is weak
- Request again
  - recent history exists, but one-tap rebook flow is weak
- Subscription status
  - backend support exists, but home presentation is weak
- Safety shortcuts
  - emergency shortcut exists, but could be richer

## Not Available

- Offers / promotions section

## Functions

### Already There

- Manual location
- Change vehicle
- Request help
- Resume active request
- Rebook previous service
  - weak, but partially present through history/home actions
- Open notifications
- Open support
- Open emergency assistance

### Partial / Weak

- Detect GPS
- Search location

### Not Available

- Strong home-level smart current-location confirmation flow

---

# 3. Customer Request Flow

## Already There

- Service selection
- Problem selection
- Vehicle selection
- Location confirmation
- Problem details
- Service estimation
- Price breakdown
- Partner matching
- Partner assigned
- Live tracking
- Inspection
- Quote
- Quote approval
- Service started
- Service completed
- Payment
- Payment result
- Rating
- Review
- Request history
- Support

## Partial / Weak

- Photo upload
  - UI button exists, but true end-to-end upload behavior is weak
- OTP verification
  - safety/verification concepts exist, but strong service OTP step is not consistently visible in customer flow
- Partner arrived
  - status exists, UX is covered, but could be more explicit in all screens
- Invoice
  - history has invoice placeholder behavior, not a strong invoice module
- Additional charges
  - quote line items support this concept, but explicit additional-charge UX can be stronger
- GPS correction
  - basic manual edit exists, but not rich
- Search radius
  - searching flow supports wider search, but logic depth is limited
- ETA
  - supported, but quality depends on backend/live updates
- Call
  - support/call actions exist
- Location sharing
  - exists
- Cancellation
  - exists and improved recently

## Not Available

- Video upload
- Real customer chat

---

# 4. Customer Smart / Frictionless Features

## Already There

- Default vehicle
- Default location
  - saved locations exist
- Recent vehicle
- Recent service
- Request again
  - basic level only
- Prefilled forms
  - some vehicle/profile prefill exists
- Minimal typing
  - partly achieved in several screens
- Progressive disclosure
- Contextual CTA
- Remember user preferences
  - basic vehicle/location reuse exists
- Automatic price calculation
  - estimate/quote path exists
- Automatic partner selection
  - dispatch flow exists
- Automatic re-dispatch
  - basic operational foundation exists in backend logic
- Automatic notification
  - in-app level exists

## Partial / Weak

- One-tap request
- Auto location
- Auto service recommendation
- Smart problem diagnosis
- Strong previous request reuse
- Full user preference memory
- Automatic retry
- Automatic payment reconciliation

## Not Available

- Saved payment method

---

# 5. Customer Subscription

## Already There

- Plans
- Benefits
- Active subscription
- Functions:
  - Free tier concept
  - Paid tier concept
  - Platform fee waiver
  - Trusted Partner access concept in backend/product direction
  - Subscription validation
  - Duplicate subscription protection basics

## Partial / Weak

- Subscription landing
  - page exists, but not strongly integrated into customer app navigation
- Checkout
  - subscribe exists, but not full payment-grade checkout
- Payment
  - membership activation is not true payment-grade checkout
- Expiry
- Renewal
- Cancellation
- Expiry handling
- Payment failure

## Not Available

- Full renewal lifecycle UI
- Full subscription cancellation UX

---

# 6. Customer Trusted Partners

## Already There

- Trusted Partner badge concept
- Verified Partner badge concept
- Business verification concept
- Identity verification concept
- Rating
- Reviews
- Service specialization

## Partial / Weak

- Completed jobs visibility in customer-facing trusted partner context
- Trusted Partner filtering
  - some filtering logic exists in map/discovery direction, but not strong in customer app flow
- Subscriber-only access
  - concept exists more than polished UX

## Not Available

- Strong dedicated customer trusted partners module/screen

---

# 7. Customer Payment

## Already There

- Estimate
- Quote
- Approval
- Payment
- Processing state concept
- Success / Failure status concept
- Invoice concept
- Tax / fee breakdown
- Cash payment concept

## Partial / Weak

- Receipt
- Refund
- Duplicate payment protection
- Payment history
- Cash reconciliation

## Not Available

- UPI integration
- Card integration
- Saved payment method
- Payment retry flow
- Payment failure recovery flow
- Partial refund flow
- Strong standalone customer payments area

Important note:

- Current payment flow is still operationally weak and closer to mock/manual readiness than a real production payment system.

---

# 8. Customer Support

## Already There

- Active request support
- Create ticket
- Ticket list
- Categories:
  - Payment
  - Cancellation
  - Safety
  - Technical issue
  - Other

## Partial / Weak

- Help center
- FAQ
- Ticket details
- Escalation
- Resolution visibility
- Categories:
  - Mechanic issue
  - Quote
  - Service quality
  - Partner behavior

## Not Available

- Customer chat support
- Attachment support in customer ticket creation

---

# 9. Customer Safety

## Already There

- SOS-style emergency CTA
- Share location
- Share active request
  - request summary sharing exists
- Emergency numbers
- RoadResQ support
- Partner identity
- Partner verification
- Service history
- Request sharing

## Partial / Weak

- Emergency contacts
- Safety incident reporting
- Service OTP

## Not Available

- Strong dedicated safety incident reporting workflow

---

# 10. Skip vs Add Summary

## Skip For Now: Already Present

- core customer request flow
- profile
- vehicles
- saved locations
- notifications page
- support ticket basics
- emergency hub basics
- request history
- quote flow
- active request tracking
- membership backend and base UI

## Improve Later: Partial / Weak

- GPS and location UX
- request-again / one-tap repeat flow
- trusted partner customer UX
- subscription navigation and lifecycle UX
- support FAQ / details / escalation visibility
- invoice and payment history UX
- service OTP visibility
- photo upload end-to-end reliability

## Add Next: Not Available

- customer settings screen
- dedicated trusted partners screen/module
- offers / promotions section if product really wants it
- video upload in request flow
- real customer chat
- saved payment methods
- real UPI / card payment integration
- payment retry / recovery
- partial refund flow
- stronger ticket attachments
- dedicated safety incident report flow

---

# 11. Recommended Build Order

## P0

- real payment integration
- payment retry / recovery
- duplicate payment protection hardening

## P1

- customer settings screen
- trusted partners customer module
- support detail / FAQ / attachment improvements
- stronger GPS and one-tap request UX

## P2

- video upload
- customer chat
- offers / promotions if product decides it is useful
- deeper safety incident workflows

