# RoadResQ: Frontend Architecture, Product Feature Specification & Scaling Vision

> **Document Purpose:** Define the complete frontend product architecture for RoadResQ, including user roles, menus, pages, page sections, content requirements, functions, UI/UX guidance, application flows, states, edge cases, and future scaling direction.

---

# 1. Product Vision

RoadResQ is a roadside assistance marketplace that connects stranded vehicle owners with nearby mechanics, workshops, towing providers, mobile mechanics, and other verified service partners.

RoadResQ acts as the **technology and marketplace intermediary**.

```text
Customer
   │
   │ Service Request
   ▼
RoadResQ Platform
   │
   │ Matching / Dispatch
   ▼
Mechanic / Workshop / Towing Partner
   │
   │ Service
   ▼
Customer
```

The platform should optimize for:

* Fast assistance
* Nearby service discovery
* Verified partners
* Transparent pricing
* Reliable dispatch
* Clear communication
* Trust and reviews
* Easy payments
* Strong local SEO
* Operational visibility
* Multi-city scalability

---

# 2. Current Architecture

The current application is a **single React application with modular domain boundaries**.

This is the recommended approach for the current stage.

```


The goal is not to introduce unnecessary micro-frontend complexity.

The preferred future architecture is:

```text
One repository / shared platform contracts
              │
      ┌───────┼────────┬─────────┐
      ▼       ▼        ▼         ▼
    Public Customer  Partner   Admin
      │       │        │         │
      └───────┴────────┴─────────┘
                    │
                    ▼
             RoadResQ API
```

---

# 3. Shared Product Design Principles

Every application should follow these principles.

## 3.1 Mobile First

Customer and Partner applications should be designed primarily for mobile.

Admin should be desktop-first.

Public website should be responsive and SEO-first.

## 3.2 One Primary Action Per Screen

Examples:

Customer:

> Request Help

Partner:

> Go Online

Admin:

> Resolve Request

Avoid overwhelming users with too many primary actions.

## 3.3 Emergency Context

RoadResQ is frequently used when a customer is stranded.

The interface should therefore prioritize:

* Location
* Service type
* Vehicle
* Estimated response time
* Mechanic status
* Call
* Navigation
* Help
* Safety

## 3.4 Clear Status

Every important operation should communicate:

```text
What is happening?
What happens next?
How long might it take?
What can I do?
```

## 3.5 Error Recovery

Never end a flow with:

> Something went wrong.

Instead provide:

```text
What happened
Why it happened
What the user can do next
```

---

# 4. Application Architecture

RoadResQ will eventually contain four frontend applications.

| Application     | Audience                      | Primary Device   | Main Goal          |
| --------------- | ----------------------------- | ---------------- | ------------------ |
| Public Website  | Visitors / SEO users          | Mobile + Desktop | Acquisition        |
| Customer App    | Vehicle owners                | Mobile           | Request assistance |
| Partner App     | Mechanics / service providers | Mobile           | Fulfil jobs        |
| Admin Dashboard | Internal staff                | Desktop          | Operations         |

---

# 5. Public Website

## Goal

Drive organic traffic, explain RoadResQ, build trust, and convert visitors into customers or partners.

## Main Navigation

```text
Home
Services
Cities
How It Works
Partner With Us
Why RoadResQ
About
Help / FAQ
Login
Get Help Now
```

## Footer

```text
Services
Cities
Partner
About
Contact
FAQ

Privacy Policy
Terms of Service
Cancellation Policy
Refund Policy

Facebook
Instagram
YouTube
LinkedIn

Customer App
Partner App
```

---

# 6. Public Website — Home Page

Route:

```text
/
```

## Section 1 — Hero

### Content

* Strong headline
* Short explanation
* Location selector
* Service selector
* Primary CTA
* Secondary CTA
* Trust indicators

Example:

> Vehicle trouble? Get roadside help near you.

CTA:

```text
Get Help Now
Find a Mechanic
```

## Functions

* Detect current location
* Manually select location
* Select service
* Redirect to customer app

## UI Advice

The hero should immediately answer:

```text
What?
Where?
How fast?
What should I do?
```

Avoid a generic startup-style hero.

---

# 7. Home — Trust Section

Content:

```text
✓ Verified Mechanics
✓ Nearby Assistance
✓ Transparent Pricing
✓ Real Customer Reviews
✓ Roadside Assistance
```

Use recognizable icons and short explanations.

Avoid unsupported claims such as "5-minute response" unless the platform can actually guarantee it.

---

# 8. Home — How RoadResQ Works

Use a 4-step visual flow.

```text
1. Request Help
       ↓
2. Get Matched
       ↓
3. Mechanic Arrives
       ↓
4. Get Back on the Road
```

Each step should have:

* Icon
* Short title
* One-sentence explanation

---

# 9. Home — Services

Show major categories.

```text
Battery Assistance
Tyre Assistance
Towing
Fuel Delivery
Mobile Mechanic
Engine / Mechanical Help
Emergency Roadside Assistance
```

Each card should contain:

* Icon/image
* Service name
* Short description
* Starting/estimated price if available
* View service CTA

---

# 10. Home — Cities

Display supported cities.

```text
Coimbatore
Chennai
Bangalore
Madurai
Salem
Tiruppur
```

Only display cities actually supported by the platform.

CTA:

> View roadside assistance in your city

---

# 11. Home — Reviews

Content:

* Customer name
* Rating
* Review
* Service type
* City
* Optional vehicle type

UI:

Use a horizontal card carousel on mobile.

Do not fabricate testimonials.

---

# 12. Home — FAQ

Examples:

* How does RoadResQ work?
* How do I find a mechanic?
* Are mechanics verified?
* How much does roadside assistance cost?
* Can I cancel a request?
* How do I pay?
* What if no mechanic is available?

Use expandable accordions.

---

# 13. Home — Final CTA

Large final conversion section.

```text
Need roadside assistance?

Get help from a nearby service partner.

[Request Help Now]
```

---

# 14. Services

Route:

```text
/services
```

## Sections

### Service Categories

Each service contains:

* Service name
* Description
* Common problems
* Suitable vehicles
* Typical process
* Estimated pricing
* FAQs
* CTA

Example:

```text
/services/battery-assistance
/services/tyre-change
/services/towing
/services/fuel-delivery
```

## SEO Content

Every service page should support:

* SEO title
* Meta description
* H1
* Structured content
* FAQ
* Internal links
* Breadcrumbs
* Service schema where appropriate

---

# 15. City Pages

Routes:

```text
/cities/coimbatore
/cities/chennai
/cities/madurai
```

## Sections

```text
Hero
Available Services
How It Works
Nearby Areas
Verified Partners
Why RoadResQ
Local FAQs
Customer Reviews
Emergency Assistance
CTA
```

## Future SEO Structure

```text
/cities/coimbatore/car-mechanic
/cities/coimbatore/car-towing
/cities/coimbatore/battery-assistance
/cities/coimbatore/tyre-service
```

Do not generate large numbers of thin SEO pages.

Each page should provide useful localized information.

---

# 16. Partner Landing Page

Route:

```text
/partner
```

## Sections

### Hero

> Grow your roadside assistance business with RoadResQ.

CTA:

```text
Become a Partner
```

### Benefits

```text
Get More Customers
Flexible Availability
Digital Job Management
Transparent Earnings
Partner Dashboard
```

### How It Works

```text
Register
↓
Submit Documents
↓
Verification
↓
Go Online
↓
Receive Jobs
↓
Complete Services
```

### Earnings

Optional calculator.

Inputs:

```text
Jobs per day
Average service value
Working days
```

Output:

```text
Estimated monthly gross earnings
```

Clearly label this as an estimate.

---

# 17. Customer Application

> **Note on Implementation Constraints (Current Phase):** 
> - **Reuse Existing Assets:** We currently reuse all available Map and List screens.
> - **Access Flow:** Initial app entry allows either direct signup or "free use" (guest mode). Users can browse all screens freely without an account.
> - **Service Request Gate:** When a user attempts to confirm a service request, the app will prompt for Sign In / Authentication.
> - **Pricing & Fees:** Standard requests include a **Mechanic Fee + Platform Fee**.
> - **Subscription Model:** The platform offers a Free tier and a 1-Month Paid Subscription tier. Subscribed users get exclusive access to *Trusted Partners* and have the Platform Fee waived (they pay *only* the Mechanic Fee).
## Main Navigation

Mobile bottom navigation:

```text
Home
Requests
Vehicles
Support
Profile
```

Optional:

```text
Wallet
```

should only be included if RoadResQ actually introduces an internal wallet.

---

# 18. Customer — Home

Route:

```text
/customer
```

## Section 1 — Location

Display:

```text
Current location
Change location
Use GPS
```

Actions:

* Detect location
* Search location
* Select from map
* Confirm location

## Section 2 — Emergency CTA

Large primary button:

```text
REQUEST HELP NOW
```

## Section 3 — Quick Services

```text
Battery
Tyre
Towing
Fuel
Mechanic
Other
```

## Section 4 — Saved Vehicles

Show:

```text
My Car
Hyundai i20
TN XX XX XXXX
```

CTA:

> Change vehicle

## Section 5 — Active Request

If active:

```text
Mechanic Assigned
ETA 12 min
```

CTA:

> View Request

## Section 6 — Recent Services

Show the last 2–3 requests.

---

# 19. Customer — Request Service

Route:

```text
/customer/request
```

## Step 1 — Select Vehicle

Content:

```text
Saved vehicles
Add vehicle
```

## Step 2 — Select Problem

Examples:

```text
Battery Dead
Flat Tyre
Engine Problem
Fuel Empty
Accident
Vehicle Won't Start
Towing Required
Other
```

## Step 3 — Location

Functions:

* GPS location
* Search location
* Map pin
* Manual adjustment
* Add landmark

## Step 4 — Add Details

Optional:

* Problem description
* Vehicle photos
* Video
* Notes

## Step 5 — Price

For fixed services:

```text
Estimated price
Service charge
Additional charges
Total
```

For quotation services:

```text
Price will be confirmed after inspection.
```

## Step 6 — Confirm Request

Display:

```text
Vehicle
Problem
Location
Estimated price
Expected response
```

CTA:

> Request Assistance

---

# 20. Customer — Searching

Route:

```text
/customer/request/searching
```

## Content

```text
Finding nearby service partners...

Searching within 2 km
```

Display:

* Map
* Search radius
* Nearby partners where appropriate
* Loading animation

## Functions

* Expand search radius
* Cancel request
* Retry
* Contact support

## Failure

If no partner:

```text
We couldn't find an available partner nearby.
```

Actions:

```text
Search wider area
Try another service
Contact support
Cancel request
```

---

# 21. Customer — Mechanic Assigned

Route:

```text
/customer/request/:id
```

## Sections

### Status

```text
Mechanic accepted
Arriving in approximately 12 minutes
```

### Map

Show:

```text
Customer
Mechanic
Route
```

### Partner Card

Content:

* Profile photo
* Name
* Rating
* Verification badge
* Number of completed jobs
* Vehicle/service type

### Actions

```text
Call
Message
Share status
Cancel
Help
```

---

# 22. Customer — Active Service

States:

```text
EN_ROUTE
ARRIVED
SERVICE_STARTED
```

Each state should have different UI.

Example:

```text
Mechanic is on the way
ETA: 8 minutes
```

Then:

```text
Mechanic has arrived
```

Then:

```text
Service in progress
```

---

# 23. Customer — Quote Approval

For non-fixed services.

## Content

```text
Problem identified
Recommended service

Parts
Labour
Additional charges

Total: ₹XXXX
```

Actions:

```text
Approve
Reject
Ask Question
Contact Support
```

Never allow the service to continue beyond the quotation stage without explicit approval where approval is required.

---

# 24. Customer — Payment

## Sections

```text
Service Summary
Partner
Service
Parts
Labour
Taxes
Additional Charges
Total
```

Payment methods:

```text
UPI
Card
Net Banking
Other supported methods
```

## Payment states

```text
PAYMENT_PENDING
PROCESSING
PAID
FAILED
REFUND_PENDING
REFUNDED
```

If payment fails:

```text
Payment unsuccessful

Try again
Change payment method
Contact support
```

---

# 25. Customer — Rating

After completion:

```text
Overall Rating
★★★★★
```

Additional metrics:

```text
Professionalism
Response Time
Service Quality
Price Transparency
```

Optional:

* Comment
* Photos
* Would recommend?

Do not force users to provide lengthy feedback.

---

# 26. Customer — Requests / History

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

Each card:

```text
Service
Partner
Date
Status
Amount
Rating
```

Actions:

```text
View Details
Download Invoice
Raise Issue
Book Again
Rate
```

---

# 27. Customer — Vehicles

Route:

```text
/customer/vehicles
```

Functions:

* Add
* Edit
* Delete
* Set default

Vehicle information:

```text
Vehicle type
Brand
Model
Variant
Registration number
Fuel type
Photos
```

---

# 28. Customer — Saved Locations

Route:

```text
/customer/locations
```

Types:

```text
Home
Work
Other
```

Functions:

* Add
* Edit
* Delete
* Set default

---

# 29. Customer — Notifications

Route:

```text
/customer/notifications
```

Categories:

```text
Request
Payment
Promotion
System
Support
```

Functions:

* Mark read
* Mark all read
* Open related request

---

# 30. Customer — Support

Route:

```text
/customer/support
```

## Quick Help

```text
Active request
Payment issue
Mechanic issue
Cancellation
Safety issue
Other
```

## Ticket

Fields:

```text
Category
Request ID
Description
Photos
Attachments
```

Status:

```text
OPEN
ASSIGNED
IN_PROGRESS
RESOLVED
ESCALATED
```

---

# 31. Customer — Profile

Sections:

```text
Personal Information
Phone / Email
Vehicles
Saved Locations
Notifications
Payment Methods
Privacy
Terms
Delete Account
Logout
```

---

# 32. Customer Emergency Features

Emergency-focused actions:

```text
Share My Location
Share Active Request
Call Emergency Services
Contact RoadResQ Support
```

Possible future feature:

```text
Share Service Status
```

This generates a temporary link that can be shared with a family member or friend.

---

# 33. Partner Application

## Main Navigation

```text
Home
Requests
Earnings
Performance
Account
```

Persistent top control:

```text
ONLINE / OFFLINE
```

---

# 34. Partner — Dashboard

Route:

```text
/partner
```

## Header

```text
Good morning, Partner
ONLINE
```

## Earnings

```text
Today
₹1,250
```

## Current Job

If active:

```text
Customer
Service
Distance
ETA
```

CTA:

> Open Job

## Demand Area

Optional:

```text
High demand nearby
```

Do not introduce heatmaps until enough demand data exists.

---

# 35. Partner — Incoming Request

This should be an attention-focused modal/screen.

## Content

```text
NEW SERVICE REQUEST

Battery Assistance

Distance: 2.4 km
Estimated travel: 8 min
Estimated earnings: ₹XXX
```

Map preview.

Actions:

```text
ACCEPT
REJECT
```

Countdown:

```text
15
14
13
...
```

If timeout:

```text
Request expired
```

---

# 36. Partner — Active Job

States:

```text
ACCEPTED
EN_ROUTE
ARRIVED
SERVICE_STARTED
SERVICE_COMPLETED
```

## Header

Show current state clearly.

## Customer Card

```text
Name
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

## Job Actions

```text
Start Navigation
Arrived
Start Service
Complete Service
```

Each action should require appropriate validation.

---

# 37. Partner — Navigation

Provide:

* Map
* Destination
* ETA
* Distance
* Open external navigation

Potential integration:

```text
Google Maps
Apple Maps
Other supported navigation
```

The Partner app should not necessarily rebuild a full navigation engine.

---

# 38. Partner — Quote

For quotation-based services:

```text
Inspection
↓
Create Quote
```

Fields:

```text
Labour
Parts
Other charges
Description
Photos
Total
```

Actions:

```text
Send Quote
Edit
Cancel
```

Customer must approve before service continues where required.

---

# 39. Partner — Complete Job

Completion screen:

```text
Service Summary
Parts
Labour
Additional Charges
Final Amount
Customer Confirmation
```

Possible proof:

* Service photos
* Before/after photos
* Customer OTP
* Customer signature

The exact completion mechanism should be selected based on business requirements.

---

# 40. Partner — Requests

Tabs:

```text
Available
Active
Completed
Cancelled
```

Functions:

* Accept
* Reject
* View
* Filter
* Search

---

# 41. Partner — Earnings

Route:

```text
/partner/earnings
```

Sections:

```text
Today's Earnings
This Week
This Month
Total Earnings
Pending Settlement
```

Charts:

```text
Daily earnings
Weekly earnings
Monthly earnings
```

Transactions:

```text
Date
Request
Gross
Platform Fee
Adjustments
Net
Status
```

---

# 42. Partner — Performance

Metrics:

```text
Acceptance Rate
Completion Rate
Cancellation Rate
Average Response Time
Average Arrival Time
Rating
Completed Jobs
```

Use visual indicators.

Example:

```text
Acceptance Rate
████████░░ 82%
```

Avoid vanity metrics that do not affect partner decisions.

---

# 43. Partner — Services

Allow partners to configure:

```text
Battery
Tyre
Towing
Fuel
Mechanical Repair
Other
```

Each service can have:

```text
Enabled / Disabled
Service radius
Price configuration
Availability
```

---

# 44. Partner — Availability

States:

```text
ONLINE
BUSY
PAUSED
OFFLINE
SUSPENDED
```

Functions:

* Set online
* Pause
* Set working hours
* Select service area

---

# 45. Partner — KYC / Verification

> **Note on Implementation Constraints:** 
> - **Reuse Existing Screens:** For the signup flow, KYC/Verification, and Profile updates, we must strictly use the currently available screens. New features should be added as extensions without removing or completely rewriting existing screens.
Multi-step onboarding:

```text
Step 1 — Personal Information
Step 2 — Identity Verification
Step 3 — Business Information
Step 4 — Services
Step 5 — Documents
Step 6 — Bank Account
Step 7 — Review & Submit
```

Status:

```text
DRAFT
SUBMITTED
UNDER_REVIEW
VERIFIED
REJECTED
SUSPENDED
```

For rejected documents, clearly explain:

```text
What was rejected
Why
What needs to be corrected
Upload replacement
```

---

# 46. Partner — Profile

Sections:

```text
Personal Information
Business Information
Services
Documents
Bank Account
Notifications
Support
Legal
Logout
```

---

# 47. Partner — Notifications

Important notifications:

```text
New Request
Request Expiring
Customer Cancelled
Job Reminder
Payment Received
Settlement Completed
Document Expiring
Verification Update
System Announcement
```

---

# 48. Partner — Support

Categories:

```text
Request Problem
Customer Problem
Payment Problem
Navigation Problem
Account Problem
Verification
Other
```

Provide access to active-job support.

---

# 49. Admin Dashboard

> **Note on Implementation Constraints:** 
> - **Preserve Existing Screens:** Several admin pages are already built and functional. Do not touch or modify these existing screens. Any new features, reports, or flows mentioned in this document should be built as *new* screens, leaving the current ones intact.
Admin is an operational application, not just a CRUD dashboard.

Main navigation:

```text
Dashboard
Live Operations
Dispatch
Requests
Customers
Partners
Verification
Payments
Settlements
Reviews
Support
Analytics
Services
Cities
SEO / CMS
Notifications
Audit Logs
Roles & Permissions
Settings
```

---

# 50. Admin — Dashboard

Top KPIs:

```text
Total Requests
Active Requests
Completed Today
Cancelled Today
Active Customers
Online Partners
GMV
Revenue
```

Charts:

```text
Requests by hour
Requests by day
Completion rate
Cancellation rate
Revenue trend
```

Alerts:

```text
Unassigned requests
Delayed jobs
Partner no-shows
Payment failures
Verification backlog
Support escalations
```

---

# 51. Admin — Live Operations

This is one of the most important screens.

## Map

Display:

```text
Customer requests
Online partners
Active jobs
Partner routes
Unassigned requests
Delayed jobs
```

## Filters

```text
City
Service
Status
Partner
Request age
Priority
```

## Side Panel

Selecting an item displays:

```text
Request ID
Customer
Partner
Vehicle
Service
Location
Status
ETA
Payment
Timeline
```

Actions:

```text
Call Customer
Call Partner
Reassign
Cancel
Escalate
Open Request
```

---

# 52. Admin — Dispatch

The dispatch screen should show:

```text
Unassigned Requests
Available Partners
Matching Score
Distance
ETA
Service Capability
Partner Status
```

Admin should be able to:

```text
Assign Partner
Reassign Partner
Cancel Request
Expand Search
Override Match
```

Every manual intervention should be logged.

---

# 53. Admin — Requests

Table columns:

```text
Request ID
Customer
Vehicle
Service
Partner
Location
Status
Amount
Created
Updated
```

Filters:

```text
Date
City
Service
Status
Partner
Customer
```

Actions:

```text
View
Reassign
Cancel
Refund
Contact
Export
```

---

# 54. Admin — Request Details

Sections:

```text
Request Summary
Customer
Vehicle
Service
Location
Partner
Pricing
Payment
Status Timeline
Communication
Support Tickets
Audit History
```

Timeline example:

```text
10:31 Request created
10:32 Searching
10:33 Partner accepted
10:40 Partner arrived
10:45 Service started
11:10 Service completed
11:12 Payment received
```

---

# 55. Admin — Customers

Functions:

* Search
* Filter
* View profile
* View requests
* View payments
* View reviews
* Suspend account
* Contact customer

Customer details:

```text
Profile
Vehicles
Requests
Payments
Reviews
Support
Activity
```

---

# 56. Admin — Partners

Functions:

* Search
* Filter
* View
* Verify
* Suspend
* Reactivate
* Contact
* View performance

Partner profile:

```text
Personal
Business
Services
Documents
Bank
Performance
Jobs
Reviews
Payments
Support
Audit
```

---

# 57. Admin — Verification

Queue:

```text
Pending
Under Review
Approved
Rejected
Expired
```

Review layout:

```text
Document Preview
        │
        ▼
Partner Information
        │
        ▼
Verification Checklist
        │
        ▼
Approve / Reject
```

Rejection must require a reason.

---

# 58. Admin — Payments

Overview:

```text
Successful
Pending
Failed
Refunded
```

Payment details:

```text
Request
Customer
Partner
Amount
Gateway Reference
Status
Timestamp
```

Actions should be tightly permission-controlled.

---

# 59. Admin — Settlements

Partner settlement management.

Sections:

```text
Pending
Processing
Paid
Failed
```

Columns:

```text
Partner
Jobs
Gross
Platform Fee
Adjustments
Net
Settlement Date
Status
```

---

# 60. Admin — Reviews

Functions:

```text
View reviews
Filter rating
Filter partner
Flag review
Hide review
Investigate complaint
```

Do not allow admins to silently alter customer ratings.

Maintain an audit trail.

---

# 61. Admin — Support

Ticket dashboard:

```text
New
Open
Assigned
In Progress
Escalated
Resolved
```

Ticket details:

```text
Customer
Partner
Request
Issue
Messages
Attachments
Timeline
Internal Notes
Resolution
```

---

# 62. Admin — Analytics

## Marketplace

```text
Requests
Acceptance
Completion
Cancellation
Average response time
Average arrival time
```

## Customer

```text
Registrations
Active users
Repeat customers
Requests per user
```

## Partner

```text
Registrations
Verification
Active partners
Acceptance
Completion
Cancellation
```

## Financial

```text
GMV
Revenue
Average order value
Refunds
Partner payouts
```

---

# 63. Admin — Services

Manage:

```text
Service Name
Description
Icon
Vehicle Type
Fixed Price
Quote Required
Active / Inactive
```

Example:

```text
Battery Jumpstart
Fixed Price
Car / Bike
₹XXX
Active
```

---

# 64. Admin — Cities

Manage:

```text
City
State
Country
Service availability
Service radius
Active partners
SEO slug
SEO title
SEO description
```

City status:

```text
PLANNED
ACTIVE
PAUSED
```

---

# 65. Admin — SEO / CMS

Content management:

```text
Pages
Services
Cities
FAQs
Blog
Testimonials
SEO Metadata
Internal Links
```

Each SEO page should support:

```text
Title
Slug
H1
Meta Title
Meta Description
Canonical
Content
FAQ
Images
Status
Publish Date
```

---

# 66. Admin — Notifications

Notification templates:

```text
Customer
Partner
Admin
```

Channels:

```text
In-App
Push
SMS
WhatsApp
Email
```

Templates should support variables:

```text
{{customerName}}
{{requestId}}
{{serviceName}}
{{partnerName}}
{{eta}}
{{amount}}
```

---

# 67. Admin — Audit Logs

Every sensitive administrative action should generate a record.

Example:

```text
Admin:
John

Action:
Approved Partner

Target:
Partner #1234

Timestamp:
2026-08-17 10:30

Reason:
Documents verified
```

Audit logs should not be editable through normal UI.

---

# 68. Admin — Roles & Permissions

Roles:

```text
SUPER_ADMIN
OPERATIONS
SUPPORT
FINANCE
VERIFICATION
CONTENT_MANAGER
```

Permissions:

```text
VIEW
CREATE
EDIT
APPROVE
CANCEL
REFUND
EXPORT
SUSPEND
```

Use least-privilege access.

---

# 69. Admin — Settings

Sections:

```text
Platform
Pricing
Services
Notifications
Payments
Maps
Security
Roles
Legal
SEO
```

---

# 70. Core Request State Machine

The request entity is the central business object.

```text
CREATED
   ↓
SEARCHING
   ↓
MECHANIC_ASSIGNED
   ↓
MECHANIC_ACCEPTED
   ↓
MECHANIC_EN_ROUTE
   ↓
MECHANIC_ARRIVED
   ↓
SERVICE_STARTED
   ↓
SERVICE_COMPLETED
   ↓
PAYMENT_PENDING
   ↓
PAID
   ↓
RATED
```

Failure paths:

```text
SEARCHING
   ↓
NO_MECHANIC_FOUND

SEARCHING
   ↓
CUSTOMER_CANCELLED

MECHANIC_ACCEPTED
   ↓
MECHANIC_CANCELLED

MECHANIC_EN_ROUTE
   ↓
MECHANIC_NO_SHOW

SERVICE_STARTED
   ↓
SERVICE_CANCELLED

PAYMENT_PENDING
   ↓
PAYMENT_FAILED
```

---

# 71. Cancellation System

## Customer cancellation reasons

```text
Problem solved
Found another mechanic
Price too high
Wait time too long
Wrong location
Other
```

## Partner cancellation reasons

```text
Too far
Wrong service
Vehicle issue
Already busy
Emergency
Other
```

Track:

```text
Cancellation count
Cancellation rate
Cancellation reason
Time of cancellation
Penalty
Admin review
```

---

# 72. Pricing Model

RoadResQ should support a hybrid model.

## Fixed Price

Suitable for:

```text
Battery jumpstart
Tyre replacement
Basic roadside assistance
Fuel delivery
```

## Quotation

Suitable for:

```text
Mechanical repair
Engine issue
Parts replacement
Complex diagnostics
```

Flow:

```text
Request
 ↓
Partner accepts
 ↓
Inspection
 ↓
Quote
 ↓
Customer approval
 ↓
Service
 ↓
Completion
```

---

# 73. Dispatch Engine

Initial matching:

```text
Distance
+
Availability
+
Service capability
```

Future matching:

```text
Distance
Availability
Service capability
Rating
Acceptance rate
Completion rate
Response time
Arrival time
Current workload
Historical reliability
```

The dispatch engine should eventually produce a matching score.

Example:

```text
Partner A
Distance: 2 km
ETA: 8 min
Rating: 4.7
Match Score: 91

Partner B
Distance: 3 km
ETA: 6 min
Rating: 4.9
Match Score: 94
```

---

# 74. No-Partner Flow

Never leave the user on an infinite loading screen.

```text
Search nearby
      ↓
No partner
      ↓
Expand radius
      ↓
Search again
      ↓
No partner
      ↓
Alternative service / support
```

Possible actions:

```text
Search wider
Try another service
Schedule assistance
Contact support
Cancel
```

---

# 75. Partner Availability State Machine

```text
OFFLINE
   ↓
ONLINE
   ↓
BUSY
   ↓
ONLINE
```

Other states:

```text
PAUSED
SUSPENDED
```

A suspended partner must not receive new requests.

---

# 76. Notification System

## Customer notifications

```text
Request created
Partner found
Partner accepted
Partner arriving
Partner arrived
Service started
Service completed
Payment
Review reminder
Support update
```

## Partner notifications

```text
New request
Request expiring
Customer cancelled
Job reminder
Payment received
Settlement completed
Document expiring
Verification result
```

---

# 77. Trust System

Trust badges:

```text
Identity Verified
Business Verified
Phone Verified
Documents Verified
RoadResQ Verified
```

Partner profile should show:

```text
Rating
Completed jobs
Years of experience
Services
Verification
Reviews
```

Only show metrics supported by real data.

---

# 78. Review System

Review dimensions:

```text
Overall Rating
Professionalism
Response Time
Service Quality
Price Transparency
```

Optional:

```text
Comment
Photos
Would Recommend
```

---

# 79. Emergency & Safety System

Customer should have access to:

```text
Share Location
Share Request
Contact RoadResQ
Emergency Services
```

Possible future feature:

```text
Safety Check
```

After a serious roadside incident, RoadResQ can provide a clear path to emergency assistance.

---

# 80. Global UI Components

Build reusable components for:

```text
Button
Input
Select
Modal
Drawer
Toast
Alert
Card
Badge
Tabs
Dropdown
Pagination
Table
Map
Location Picker
Vehicle Card
Partner Card
Request Card
Status Timeline
Rating
Price Summary
Empty State
Loading State
Error State
Confirmation Dialog
```

---

# 81. Standard UI States

Every data-driven page should support:

```text
Loading
Success
Empty
Error
Offline
Unauthorized
Forbidden
Expired
```

Example:

```text
Loading:
Finding nearby partners...

Empty:
No completed requests yet.

Error:
We couldn't load your requests.
[Try Again]
```

---

# 82. Map UI Guidelines

Maps should not dominate every screen.

Use maps where they provide actual operational value.

Customer:

```text
Location
Partner
Route
ETA
```

Partner:

```text
Customer
Route
Navigation
```

Admin:

```text
All active operations
```

Use bottom sheets on mobile rather than forcing users to leave the map.

---

# 83. Mobile UX

Customer and Partner applications should support:

* Large touch targets
* Thumb-friendly controls
* Sticky primary CTA
* Bottom sheets
* Minimal typing
* GPS-first location
* One-handed operation
* Clear status indicators
* Fast loading

Avoid desktop-style tables in mobile applications.

---

# 84. Admin UX

Admin should prioritize information density.

Use:

```text
Sidebar
Top bar
KPI cards
Tables
Filters
Drawers
Detail panels
Maps
Timeline
```

Use keyboard-friendly workflows where possible.

---

# 85. Accessibility

All applications should support:

* Keyboard navigation
* Visible focus
* Accessible labels
* Sufficient contrast
* Screen-reader-friendly controls
* Semantic HTML
* Error descriptions
* Non-color-only status indicators

Never communicate status only through colors.

Example:

```text
Green dot + "Online"
```

not just:

```text
Green dot
```

---

# 86. Responsive Strategy

## Public

```text
Mobile
Tablet
Desktop
Large Desktop
```

## Customer

```text
Mobile first
Tablet
Desktop web
```

## Partner

```text
Mobile first
Tablet
Desktop fallback
```

## Admin

```text
Desktop first
Tablet support
Mobile limited
```

---

# 87. Authentication & Authorization

Roles:

```text
CUSTOMER
PARTNER
ADMIN
SUPPORT
OPERATIONS
FINANCE
CONTENT_MANAGER
```

Frontend route guards should exist, but security must always be enforced by the backend.

Example:

```text
Customer App
     ↓
Customer APIs

Partner App
     ↓
Partner APIs

Admin App
     ↓
Admin APIs
```

Never rely on frontend route protection as the security mechanism.

---

# 88. Shared TypeScript Contracts

The four applications should eventually share:

```text
types
API models
request states
service definitions
vehicle definitions
permission definitions
validation schemas
constants
```

Example:

```ts
type RequestStatus =
  | "CREATED"
  | "SEARCHING"
  | "MECHANIC_ASSIGNED"
  | "MECHANIC_ACCEPTED"
  | "MECHANIC_EN_ROUTE"
  | "MECHANIC_ARRIVED"
  | "SERVICE_STARTED"
  | "SERVICE_COMPLETED"
  | "PAYMENT_PENDING"
  | "PAID"
  | "RATED"
  | "CANCELLED";
```

This prevents different applications from developing incompatible representations of the same business entity.

---

# 89. Recommended Monorepo

Future structure:

```text
roadresq/
│
├── apps/
│   ├── public/
│   ├── customer/
│   ├── partner/
│   └── admin/
│
├── packages/
│   ├── types/
│   ├── api-client/
│   ├── validation/
│   ├── constants/
│   ├── ui/
│   └── config/
│
└── package.json
```

Possible tooling:

```text
pnpm
Turborepo
TypeScript
Vite
React
```

Do not introduce Module Federation unless there is a real organizational or deployment requirement.

---

# 90. Application Flow — Customer

```text
Open RoadResQ
      ↓
Login / Guest Entry
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
Inspection
      ↓
Fixed Price / Quote
      ↓
Customer Approval
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

---

# 91. Application Flow — Partner

```text
Register
   ↓
KYC
   ↓
Verification
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
Quote if required
   ↓
Customer Approval
   ↓
Service
   ↓
Complete
   ↓
Payment
   ↓
Earnings
```

---

# 92. Application Flow — Admin

```text
Login
   ↓
Dashboard
   ↓
Live Operations
   ↓
Monitor Requests
   ↓
Identify Problem
   ↓
Investigate
   ↓
Contact Customer / Partner
   ↓
Reassign / Cancel / Resolve
   ↓
Audit Log
```

---

# 93. Important Edge Cases

The frontend and backend must account for:

```text
No location permission
GPS inaccurate
Location unavailable
Poor internet
Customer closes browser
Partner closes application
Partner goes offline
Partner cancels
Customer cancels
No partner found
Multiple partners respond
Request expires
Payment fails
Quote rejected
Quote expires
Partner doesn't arrive
Customer doesn't respond
Service partially completed
Refund required
Duplicate request
Duplicate payment
Session expires
Account suspended
KYC rejected
Document expired
Partner becomes unavailable during job
```

Every edge case should have a defined UI state and recovery action.

---

# 94. Performance Requirements

Customer experience should prioritize:

```text
Fast first render
Lazy-loaded maps
Lazy-loaded images
Route-level code splitting
Cached static content
Optimized API requests
Optimistic UI where safe
Skeleton loading
Pagination
Virtualization for large admin tables
```

Maps should not load on screens that do not need maps.

---

# 95. Offline / Poor Network Behavior

Roadside assistance may happen in areas with weak connectivity.

Important screens should handle temporary connectivity loss.

Show:

```text
Connection lost
Trying to reconnect...
```

For active requests:

```text
Last updated 30 seconds ago
```

Do not falsely show stale information as current.

---

# 96. Analytics Events

Track important product events.

Customer:

```text
LOGIN
LOCATION_SELECTED
VEHICLE_ADDED
SERVICE_SELECTED
REQUEST_CREATED
REQUEST_CANCELLED
PARTNER_FOUND
PARTNER_ACCEPTED
PARTNER_ARRIVED
SERVICE_COMPLETED
PAYMENT_STARTED
PAYMENT_SUCCESS
PAYMENT_FAILED
REVIEW_SUBMITTED
```

Partner:

```text
PARTNER_ONLINE
REQUEST_RECEIVED
REQUEST_ACCEPTED
REQUEST_REJECTED
ARRIVED
SERVICE_STARTED
QUOTE_CREATED
QUOTE_APPROVED
JOB_COMPLETED
PARTNER_OFFLINE
```

Admin:

```text
REQUEST_REASSIGNED
PARTNER_APPROVED
PARTNER_SUSPENDED
REFUND_CREATED
SUPPORT_RESOLVED
```

---

# 97. Security Considerations

Never expose:

* Sensitive KYC documents publicly
* Bank account information unnecessarily
* Internal admin information
* Private customer information
* Authentication tokens in unsafe storage
* Internal API secrets

Admin actions must be authorized server-side.

Sensitive operations should require additional confirmation.

---

# 98. Future Features

These should not block the MVP.

## Growth

```text
Referral
Promo Codes
Coupons
Loyalty
Wallet
```

## Marketplace

```text
Dynamic Pricing
Partner Ranking
Demand Heatmaps
Automatic Reassignment
Scheduled Assistance
Multi-partner Requests
```

## Customer

```text
Family Accounts
Multiple Vehicles
Service Packages
Maintenance Reminders
Service Records
```

## Partner

```text
Team Members
Multiple Workshop Locations
Inventory
Parts Management
Business Analytics
```

## Platform

```text
Multi-city
Multi-state
Multi-language
Multi-currency
Advanced fraud detection
AI-assisted support
Predictive demand
```

---

# 99. Development Priority

## P0 — Current MVP

### Customer

```text
Authentication
Vehicle
Location
Service
Request
Partner discovery
Request status
Contact partner
Completion
Rating
History
```

### Partner

```text
Registration
KYC
Verification
Online/offline
Request notification
Accept/reject
Active job
Navigation
Arrived
Complete
```

### Admin

```text
Dashboard
Requests
Customers
Partners
Verification
Basic support
Basic operations
```

---

# 100. P1 — Operations & Monetization

```text
Fixed pricing
Quotation system
Payment
Refunds
Partner earnings
Settlements
Live tracking
ETA
Advanced dispatch
Notifications
Advanced reviews
Admin live map
Audit logs
Role permissions
Analytics
```

---

# 101. P2 — Growth & Scale

```text
Referral
Wallet
Promotions
Demand heatmaps
Dynamic pricing
Automatic reassignment
Advanced SEO CMS
Multi-city
Multi-language
Partner performance ranking
Predictive demand
AI support
```

---

# 102. Recommended Current Development Strategy

Do NOT split the current frontend immediately.

Continue with:

```text
One React application
        ↓
Strong module boundaries
        ↓
Shared components
        ↓
Shared API services
        ↓
Shared types
        ↓
Role-based routing
```

When the product has enough users, traffic, team members, or independent deployment requirements:

```text
Public
Customer
Partner
Admin
```

can be extracted into independent applications.

---

# 103. Product Quality Checklist

Before considering a feature complete, verify:

* [ ] Happy path implemented
* [ ] Loading state
* [ ] Empty state
* [ ] Error state
* [ ] Offline state
* [ ] Permission denied state
* [ ] Validation
* [ ] Confirmation
* [ ] Cancellation
* [ ] Retry
* [ ] Mobile UI
* [ ] Desktop UI where applicable
* [ ] Accessibility
* [ ] Analytics event
* [ ] Notification
* [ ] Backend authorization
* [ ] Audit requirement if applicable

---

# 104. Final Architecture Vision

RoadResQ should evolve from:

```text
Single React Application
```

into:

```text
                         ROADRESQ
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
       Demand            Supply          Operations
          │                 │                 │
     Customer App       Partner App       Admin App
          │                 │                 │
          └─────────────────┼─────────────────┘
                            │
                     RoadResQ API
                            │
              ┌─────────────┼─────────────┐
              │             │             │
          Customers      Partners      Requests
              │             │             │
              └─────────────┼─────────────┘
                            │
                     Dispatch Engine
                            │
                    Payments / Alerts
```

The most important principle is:

> **Build RoadResQ around the service-request lifecycle, not around individual screens.**

Every screen should represent a state, action, decision, or outcome in that lifecycle.

The long-term competitive advantage is not simply having a mechanic directory.

It is the combination of:

```text
Local Supply
     +
Customer Demand
     +
Trust
     +
Fast Dispatch
     +
Transparent Pricing
     +
Reliable Operations
     +
Local SEO
     +
Real Reviews
```

That should guide both the frontend architecture and the product roadmap.

---

# Appendix: Phased Development & Implementation Checklist

This checklist breaks down the architecture roadmap into actionable development phases, ensuring that we strictly adhere to our implementation constraints (reusing screens, preserving existing flows) while progressively enhancing the platform.

## Phase 1: Core Foundation & Guest Access (P0)
- [ ] **Customer App: Guest Mode** - Ensure the app allows initial "free use" entry without login.
- [ ] **Customer App: Asset Reuse** - Integrate the currently available Map and List pages for browsing.
- [ ] **Customer App: Auth Gate** - Implement a hard intercept that asks for Sign In only when the user clicks to *confirm* a service request.
- [ ] **Customer App: Basic Pricing** - Implement the calculation for `Mechanic Fee + Platform Fee` on standard requests.
- [ ] **Partner App: Core Flows** - Ensure the existing Signup, Profile Update, and KYC/Verification screens are preserved and functional.
- [ ] **Admin Dashboard: Preservation** - Audit existing admin pages to ensure they remain untouched and functional.

## Phase 2: Subscriptions & Trust System (P1)
- [ ] **Customer App: Subscription Flow** - Build the UI and checkout flow for the 1-Month Paid Subscription vs. Free tier.
- [ ] **Customer App: Fee Waiver Logic** - Implement business logic so subscribed users pay *only* the Mechanic Fee (0% Platform Fee).
- [ ] **Customer App: Trusted Partners** - Filter/highlight "Trusted Partners" and restrict their booking exclusively to subscribed users.
- [ ] **Partner App: Trust Badges** - Display "Verified Partner" and "Business Verified" badges on mechanic profiles based on KYC status.
- [ ] **Cross-App: Advanced Reviews** - Move beyond simple 5-star ratings; add metrics for Professionalism, Price Transparency, and Response Time.

## Phase 3: Service Request State Machine & Edge Cases (P1)
- [ ] **Core State Machine** - Implement distinct UI states for `SEARCHING`, `ASSIGNED`, `EN_ROUTE`, `ARRIVED`, and `SERVICE_STARTED`.
- [ ] **Cancellation Flows** - Add specific cancellation reason forms for both Customers (e.g., "Wait time too long") and Partners (e.g., "Vehicle issue").
- [ ] **No-Mechanic-Found Flow** - Instead of a dead-end error, implement a flow to expand search radius or offer alternative suggestions.
- [ ] **Pricing (Quotations)** - Implement the flow for repairs requiring inspection (Mechanic inspects -> submits quote -> Customer approves -> service starts).
- [ ] **Notifications Abstraction** - Set up standardized triggers for state changes (SMS/Push for "Mechanic En Route").

## Phase 4: Advanced Operations & New Admin Screens (P2)
- [ ] **Admin: Live Operations Map** - Create a completely *new* screen showing all online mechanics, active requests, and unassigned users in real-time.
- [ ] **Admin: Dispatch Control** - Build a *new* screen allowing admins to manually override matches, expand searches, or reassign delayed mechanics.
- [ ] **Admin: Support & Ticketing** - Create a *new* interface to handle escalated issues (wrong price, safety concerns).
- [ ] **Admin: Audit Logs** - Implement a *new* system tracking all admin actions (who approved a mechanic, who refunded a payment).
- [ ] **Partner App: Availability States** - Add advanced status toggles beyond Online/Offline (e.g., `BUSY`, `PAUSED`).