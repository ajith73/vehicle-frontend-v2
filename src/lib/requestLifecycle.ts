export const requestStatusMeta = {
  SUBMITTED: { canonical: 'CREATED', label: 'Request created', headline: 'Request created', tone: 'neutral' },
  UNDER_REVIEW: { canonical: 'CREATED', label: 'Under review', headline: 'Request under review', tone: 'neutral' },
  ASSIGNING: { canonical: 'SEARCHING', label: 'Searching partners', headline: 'Finding nearby partners', tone: 'info' },
  ASSIGNED: { canonical: 'MECHANIC_ASSIGNED', label: 'Partner assigned', headline: 'Partner assigned', tone: 'info' },
  ACCEPTED: { canonical: 'MECHANIC_ACCEPTED', label: 'Partner accepted', headline: 'Partner accepted the job', tone: 'success' },
  EN_ROUTE: { canonical: 'MECHANIC_EN_ROUTE', label: 'Partner en route', headline: 'Partner is on the way', tone: 'success' },
  ARRIVED: { canonical: 'MECHANIC_ARRIVED', label: 'Partner arrived', headline: 'Partner has arrived', tone: 'success' },
  SERVICE_STARTED: { canonical: 'SERVICE_STARTED', label: 'Service started', headline: 'Service is in progress', tone: 'warning' },
  SERVICE_COMPLETED: { canonical: 'SERVICE_COMPLETED', label: 'Service completed', headline: 'Service completed', tone: 'success' },
  CUSTOMER_NO_RESPONSE: { canonical: 'SERVICE_CANCELLED', label: 'Customer not reachable', headline: 'Customer did not respond', tone: 'danger' },
  MECHANIC_NO_SHOW: { canonical: 'MECHANIC_NO_SHOW', label: 'Partner no-show', headline: 'Partner did not arrive', tone: 'danger' },
  SERVICE_CANCELLED: { canonical: 'SERVICE_CANCELLED', label: 'Service cancelled', headline: 'Service cancelled', tone: 'danger' },
  REJECTED_BY_MECHANIC: { canonical: 'SEARCHING', label: 'Partner rejected', headline: 'Reassigning your request', tone: 'warning' },
  NO_RESPONSE: { canonical: 'SEARCHING', label: 'Awaiting response', headline: 'Waiting for partner response', tone: 'warning' },
  CANCELLED_BY_CUSTOMER: { canonical: 'CUSTOMER_CANCELLED', label: 'Cancelled by customer', headline: 'You cancelled this request', tone: 'danger' },
  CANCELLED_BY_ADMIN: { canonical: 'CUSTOMER_CANCELLED', label: 'Cancelled by RoadResQ', headline: 'RoadResQ cancelled this request', tone: 'danger' },
  PAYMENT_PENDING: { canonical: 'PAYMENT_PENDING', label: 'Payment pending', headline: 'Payment pending', tone: 'warning' },
  PAID: { canonical: 'PAID', label: 'Paid', headline: 'Payment complete', tone: 'success' },
  RATED: { canonical: 'RATED', label: 'Rated', headline: 'Thanks for rating the service', tone: 'success' },
  NO_MECHANIC_FOUND: { canonical: 'NO_MECHANIC_FOUND', label: 'No partner found', headline: 'No partner found nearby', tone: 'danger' },
} as const;

export type KnownRequestStatus = keyof typeof requestStatusMeta;

const completedStatuses = new Set(['SERVICE_COMPLETED', 'PAID', 'RATED']);
const cancelledStatuses = new Set(['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_ADMIN', 'SERVICE_CANCELLED', 'CUSTOMER_NO_RESPONSE', 'MECHANIC_NO_SHOW', 'NO_MECHANIC_FOUND']);
const activeStatuses = new Set(['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNING', 'ASSIGNED', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'SERVICE_STARTED', 'NO_RESPONSE', 'REJECTED_BY_MECHANIC', 'PAYMENT_PENDING']);
const cancellableStatuses = new Set(['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNING', 'ASSIGNED', 'NO_RESPONSE', 'ACCEPTED']);
const searchingStatuses = new Set(['SUBMITTED', 'UNDER_REVIEW', 'ASSIGNING', 'ASSIGNED', 'NO_RESPONSE', 'REJECTED_BY_MECHANIC']);

export function getRequestStatusMeta(status?: string) {
  return requestStatusMeta[(status || 'SUBMITTED') as KnownRequestStatus] || {
    canonical: status || 'UNKNOWN',
    label: status ? status.replace(/_/g, ' ') : 'Unknown',
    headline: status ? status.replace(/_/g, ' ') : 'Unknown status',
    tone: 'neutral',
  };
}

export function isCompletedRequestStatus(status?: string) {
  return completedStatuses.has(status || '');
}

export function isCancelledRequestStatus(status?: string) {
  return cancelledStatuses.has(status || '');
}

export function isActiveRequestStatus(status?: string) {
  return activeStatuses.has(status || '');
}

export function isCancellableRequestStatus(status?: string) {
  return cancellableStatuses.has(status || '');
}

export function isSearchingRequestStatus(status?: string) {
  return searchingStatuses.has(status || '');
}

export function getRequestToneClasses(status?: string) {
  const tone = getRequestStatusMeta(status).tone;
  if (tone === 'success') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
  if (tone === 'warning') return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
  if (tone === 'danger') return 'bg-destructive/10 text-destructive border-destructive/20';
  if (tone === 'info') return 'bg-primary/10 text-primary border-primary/20';
  return 'bg-secondary text-foreground border-border';
}

export const customerCancellationReasons = [
  'Problem solved',
  'Found another mechanic',
  'Price too high',
  'Wait time too long',
  'Wrong location',
  'Other',
] as const;

export const customerSupportCategories = [
  'Active Request',
  'Payment Issue',
  'Safety Concern',
  'Cancellations',
  'App Bug',
  'Other',
] as const;
