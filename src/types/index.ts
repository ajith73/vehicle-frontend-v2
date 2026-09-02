export interface User {
  id: number;
  name?: string;
  email: string;
  role: string;
  allowedScreens: string[];
  createdAt: string;
}

export interface AdminCustomerRecord {
  id: number;
  email: string;
  name?: string | null;
  displayName: string;
  deletedAt?: string | null;
  phone?: string | null;
  city?: string | null;
  lastLoginAt?: string | null;
  createdAt: string;
  subscriptionStatus?: string | null;
  subscriptionTier?: string | null;
  prioritySupportEligible?: boolean;
  requestCount: number;
  savedVehiclesCount: number;
}

export interface Mechanic {
  id: number;
  name?: string;
  businessName?: string;
  mechanicName?: string;
  mechanicType?: string;
  phone: any; // Can be string or array of objects
  alternatePhone?: string;
  email?: any;
  emails?: any;
  state: string;
  district: string;
  city: string;
  country?: string;
  mapLink?: string;
  experience?: string;
  specializedVehicle?: string;
  vehicleTypes?: any[];
  serviceTypes?: any[];
  servicesAvailable?: string;
  status: string;
  remarks?: string;
  description?: string;
  address?: string;
  landmark?: string;
  area?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  serviceRadius?: number;
  evSupport?: boolean;
  homeService?: boolean;
  roadsideAssistance?: boolean;
  is24Hours?: boolean;
  is24x7?: boolean;
  holidayWorking?: boolean;
  operatingDays?: any[];
  operatingHours?: string;
  availability?: boolean;
  websiteUrl?: string;
  image?: string;
  imageUrl?: string;
  services?: any[];
  startTime?: string;
  endTime?: string;
  createdAt: string;
  updatedAt: string;
  verificationLevel?: number;
  verificationChecklist?: any;
  isTrustedPartner?: boolean;
  partnerTier?: string;
  trustScore?: number;
  priorityDispatchEligible?: boolean;
  isOnline?: boolean;
  availabilityState?: string;
  currentStatus?: string;
  lastActiveAt?: string;
  MechanicLiveState?: {
    id: number;
    isOnline: boolean;
    availabilityState: string;
    latitude?: number;
    longitude?: number;
    heading?: number;
    accuracyMeters?: number;
    lastLocationUpdateAt?: string;
    staleAfterAt?: string;
    activeRequestId?: number;
  };
  shopPhotosLink?: string;
  ownerIdentityLink?: string;
  priceListLink?: string;
  pendingVerification?: {
    status: string;
    remarks?: string;
  };
  rejectionReason?: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  tier: string;
  description?: string;
  priceAmount: number;
  billingCycle: string;
  platformFeeDiscountPercent: number;
  prioritySupport: boolean;
  priorityDispatch: boolean;
  trustedOnlyAccess: boolean;
  isActive: boolean;
}

export interface CustomerMembershipStatus {
  profile?: {
    id: number;
    subscriptionStatus?: string;
    subscriptionTier?: string;
    subscriptionEndsAt?: string;
    prioritySupportEligible?: boolean;
  };
  subscription?: {
    id: number;
    status: string;
    subscriptionTier: string;
    priceAmount: number;
    startsAt: string;
    endsAt: string;
    SubscriptionPlan?: SubscriptionPlan;
  };
}

export interface CustomerFunnelAnalytics {
  metricDate: string;
  city?: string;
  requestStarted: number;
  requestSubmitted: number;
  requestAssigned: number;
  requestAccepted: number;
  serviceStarted: number;
  serviceCompleted: number;
  quoteApproved: number;
  paymentRecorded: number;
  repeatRequestCreated: number;
  metadata?: {
    assignmentRate?: number;
    completionRate?: number;
    paymentRate?: number;
  };
}

export interface PartnerPerformanceAnalytics {
  mechanicId: number;
  mechanicName: string;
  city?: string;
  isTrustedPartner?: boolean;
  metricDate: string;
  onlineHours: number;
  dispatchAttemptsReceived: number;
  acceptRate: number;
  rejectRate: number;
  timeoutRate: number;
  completionRate: number;
  quoteApprovalRate: number;
  paymentLinkedCompletionRate: number;
  averageEtaMinutes?: number | null;
  score: number;
  metadata?: {
    trusted?: boolean;
    city?: string;
    lastActiveAt?: string;
  };
}

export interface MarketplaceZoneAnalytics {
  zoneKey: string;
  city?: string;
  metricDate: string;
  requestCount: number;
  assignedCount: number;
  completedCount: number;
  noSupplyCount: number;
  cancellationCount: number;
  activeSupplyCount: number;
  averageEtaMinutes?: number | null;
  metadata?: {
    assignmentRate?: number;
    completionRate?: number;
    noSupplyRate?: number;
  };
}

export interface FinancialAnalytics {
  recordedTransactionValue: number;
  platformFeeRealization: number;
  membershipRevenue: number;
  membershipConversion: number;
  trustedPartnerContribution: number;
  repeatCustomerShare: number;
  cityWiseValue: Array<{
    city: string;
    value: number;
  }>;
}

export interface DispatchScoringResponse {
  rules: {
    distanceWeight: number;
    serviceFitWeight: number;
    vehicleFitWeight: number;
    availabilityWeight: number;
    trustWeight: number;
    reliabilityWeight: number;
    responseSpeedWeight: number;
    premiumEligibilityWeight: number;
  };
  generatedAt: string;
  sampleRequestId?: number | null;
  scores: Array<{
    mechanicId: number;
    mechanicName: string;
    score: number;
    factors: Record<string, number>;
  }>;
}

export interface MechanicPerformanceInsights {
  mechanicId: number;
  mechanicName: string;
  city?: string;
  trusted?: boolean;
  score: number;
  metrics?: {
    metricDate: string;
    onlineHours: number;
    dispatchAttemptsReceived: number;
    acceptRate: number;
    rejectRate: number;
    timeoutRate: number;
    completionRate: number;
    quoteApprovalRate: number;
    paymentLinkedCompletionRate: number;
    averageEtaMinutes?: number | null;
  };
  improvements: string[];
}

export interface CityConfigRecord {
  id: number;
  cityName: string;
  slug: string;
  stateName?: string;
  countryName?: string;
  launchState: string;
  cityTier?: string;
  defaultLanguage?: string;
  membershipBenefitsEnabled: boolean;
  trustedSupplyThreshold?: number | null;
  rapidResponseEnabled: boolean;
  seoIntro?: string;
  operationalNotes?: string;
  rules?: Record<string, unknown>;
  zones?: ZoneConfigRecord[];
  serviceRules?: ServiceAvailabilityRuleRecord[];
  pricingRules?: RegionalPricingRuleRecord[];
  updatedAt?: string;
  launchStateRecord?: {
    id: number;
    launchState: string;
    supportMessage?: string;
    pauseReason?: string;
  } | null;
}

export interface ZoneConfigRecord {
  id: number;
  cityConfigId?: number | null;
  cityName: string;
  zoneName: string;
  slug: string;
  launchState: string;
  rapidResponseEnabled: boolean;
  standbySupplyTarget?: number | null;
  etaExpectationMinutes?: number | null;
  pricingMultiplier?: number | null;
  serviceAvailabilityMode: string;
  operationalNotes?: string;
  rules?: Record<string, unknown>;
}

export interface ServiceAvailabilityRuleRecord {
  id: number;
  serviceTypeId?: number | null;
  cityConfigId?: number | null;
  zoneConfigId?: number | null;
  citySlug?: string;
  zoneSlug?: string;
  availabilityState: string;
  customerMessage?: string;
  minTrustedPartners?: number | null;
  rapidResponseOnly: boolean;
  rules?: Record<string, unknown>;
  ServiceType?: {
    id: number;
    name: string;
  };
}

export interface RegionalPricingRuleRecord {
  id: number;
  cityConfigId?: number | null;
  zoneConfigId?: number | null;
  serviceTypeId?: number | null;
  citySlug?: string;
  zoneSlug?: string;
  ruleName: string;
  pricingMode: string;
  multiplier?: number | null;
  flatFee?: number | null;
  taxPercent?: number | null;
  memberDiscountPercent?: number | null;
  rules?: Record<string, unknown>;
  ServiceType?: {
    id: number;
    name: string;
  };
}

export interface CityPublicConfigResponse {
  city: CityConfigRecord;
  launchState: {
    launchState: string;
    supportMessage?: string | null;
    pauseReason?: string | null;
  };
  zones: ZoneConfigRecord[];
  serviceRules: ServiceAvailabilityRuleRecord[];
  pricingRules: RegionalPricingRuleRecord[];
}

export interface ZonePublicAvailabilityResponse {
  zone: ZoneConfigRecord;
  launchState: {
    launchState: string;
    supportMessage?: string | null;
    pauseReason?: string | null;
  };
  serviceRules: ServiceAvailabilityRuleRecord[];
  pricingRules: RegionalPricingRuleRecord[];
}

export interface Feedback {
  id: number;
  type: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Donation {
  id: number;
  name: string;
  amount: number;
  createdAt: string;
}

export interface UpdateRequest {
  id: number;
  mechanicId: number | null;
  updatedData?: Partial<Mechanic>;
  status: 'Pending Update Approval' | 'Approved' | 'Rejected';
  remarks?: string;
  createdAt?: string;
  Mechanic?: Mechanic;
  Requestor?: { email: string };
  requesterDisplayName?: string;
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  details: string;
  createdAt: string;
  User?: { email: string };
}

export interface SupportTicketRecord {
  id: number;
  customerRequestId: number;
  raisedByUserId?: number | null;
  assignedToUserId?: number | null;
  source: string;
  ticketType: string;
  status: string;
  priority: string;
  subject: string;
  description?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, unknown>;
  CustomerRequest?: {
    id: number;
    status?: string;
    issueSummary?: string;
    addressText?: string;
    Mechanic?: {
      id: number;
      businessName?: string;
      name?: string;
    };
    CustomerUser?: {
      id: number;
      email?: string;
      CustomerProfile?: {
        displayName?: string;
      };
    };
  };
  RaisedByUser?: {
    id: number;
    email?: string;
    name?: string;
  };
  AssignedToUser?: {
    id: number;
    email?: string;
    name?: string;
  };
}
export interface DetailedCityStat {
  name: string;
  total: number;
  vehicleTypes: Record<string, number>;
  serviceTypes: Record<string, number>;
}

export interface CustomerRequest {
  id: number;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'ASSIGNING' | 'ASSIGNED' | 'ACCEPTED' | 'EN_ROUTE' | 'ARRIVED' | 'SERVICE_STARTED' | 'SERVICE_COMPLETED' | 'CUSTOMER_NO_RESPONSE' | 'MECHANIC_NO_SHOW' | 'SERVICE_CANCELLED' | 'REJECTED_BY_MECHANIC' | 'NO_RESPONSE' | 'CANCELLED_BY_CUSTOMER' | 'CANCELLED_BY_ADMIN';
  issueSummary: string;
  issueDetails?: string;
  vehicleLabel?: string;
  addressText?: string;
  latitude: number;
  longitude: number;
  adminNotes?: string;
  statusUpdatedAt?: string;
  acceptedAt?: string;
  enRouteAt?: string;
  arrivedAt?: string;
  serviceStartedAt?: string;
  completedAt?: string;
  completionPin?: string;
  completionPinGeneratedAt?: string;
  completionPinVerifiedAt?: string;
  pricingMode?: 'FIXED_PRICE' | 'QUOTE_REQUIRED' | string;
  quoteStatus?: 'QUOTE_PENDING' | 'QUOTE_SUBMITTED' | 'QUOTE_APPROVED' | 'QUOTE_REJECTED' | string;
  paymentStatus?: 'PAYMENT_NOT_READY' | 'PAYMENT_PENDING' | 'PAYMENT_COMPLETED' | 'PAYMENT_FAILED' | string;
  finalAmount?: number;
  currentEtaMinutes?: number;
  dispatchStatus?: string;
  lastDispatchAt?: string;
  lastLocationUpdateAt?: string;
  createdAt: string;
  updatedAt: string;
  Mechanic?: {
    id: number;
    businessName?: string;
    name?: string;
    city?: string;
    state?: string;
    phone?: any;
    isOnline?: boolean;
    availabilityState?: string;
    lastActiveAt?: string;
  };
  ServiceType?: {
    id: number;
    name: string;
  };
  SpecificService?: {
    id: number;
    name: string;
  };
  VehicleType?: {
    id: number;
    name: string;
  };
  CustomerUser?: {
    id: number;
    email: string;
    CustomerProfile?: {
      displayName?: string;
      lastLoginAt?: string;
    };
  };
  RequestAssignments?: Array<{
    id: number;
    mechanicId: number;
    status: string;
    notes?: string;
    respondedAt?: string;
    createdAt: string;
    Mechanic?: {
      id: number;
      businessName?: string;
      name?: string;
      city?: string;
      state?: string;
    };
    AssignedByUser?: {
      id: number;
      email?: string;
      name?: string;
    };
  }>;
  RequestTimelineEvents?: Array<{
    id: number;
    eventType: string;
    fromStatus?: string;
    toStatus?: string;
    actorType: string;
    notes?: string;
    createdAt: string;
    ActorUser?: {
      id: number;
      email?: string;
      name?: string;
    };
  }>;
  RequestCancellation?: {
    id: number;
    cancelledByType: string;
    reason: string;
    details?: string;
    createdAt: string;
  };
  RequestProofAssets?: Array<{
    id: number;
    uploadedByType: string;
    assetType: string;
    assetUrl: string;
    caption?: string;
    createdAt: string;
    UploadedByUser?: {
      id: number;
      email?: string;
      name?: string;
    };
  }>;
  RequestInternalNotes?: Array<{
    id: number;
    note: string;
    createdAt: string;
    AuthorUser?: {
      id: number;
      email?: string;
      name?: string;
    };
  }>;
  RequestQuotes?: Array<{
    id: number;
    status: string;
    pricingMode: string;
    currencyCode: string;
    subtotalAmount: number;
    taxAmount: number;
    feeAmount: number;
    totalAmount: number;
    notes?: string;
    customerDecisionNotes?: string;
    submittedAt?: string;
    approvedAt?: string;
    rejectedAt?: string;
    createdAt: string;
    Mechanic?: {
      id: number;
      businessName?: string;
      name?: string;
    };
    RequestQuoteLineItems?: Array<{
      id: number;
      label: string;
      category: string;
      quantity: number;
      unitAmount: number;
      totalAmount: number;
      description?: string;
    }>;
  }>;
  PaymentTransactions?: Array<{
    id: number;
    paymentStatus: string;
    provider: string;
    paymentMethod?: string;
    amount: number;
    currencyCode: string;
    transactionReference?: string;
    paidAt?: string;
    createdAt: string;
  }>;
  RequestDispatchAttempts?: Array<{
    id: number;
    dispatchMode: string;
    attemptStatus: string;
    notes?: string;
    responseAt?: string;
    createdAt: string;
    Mechanic?: {
      id: number;
      businessName?: string;
      name?: string;
      isOnline?: boolean;
      availabilityState?: string;
    };
  }>;
  DispatchOverrides?: Array<{
    id: number;
    overrideType: string;
    reason: string;
    notes?: string;
    createdAt: string;
    Mechanic?: {
      id: number;
      businessName?: string;
      name?: string;
    };
    OverriddenByUser?: {
      id: number;
      email?: string;
      name?: string;
    };
  }>;
  SupportTickets?: Array<{
    id: number;
    source: string;
    ticketType: string;
    status: string;
    priority: string;
    subject: string;
    description?: string;
    resolvedAt?: string;
    createdAt: string;
    RaisedByUser?: {
      id: number;
      email?: string;
      name?: string;
    };
    AssignedToUser?: {
      id: number;
      email?: string;
      name?: string;
    };
  }>;
}
