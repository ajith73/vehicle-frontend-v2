import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, MapPin, ShieldCheck, Wrench, X } from 'lucide-react';
import { apiClient, AUTH_STATE_CHANGED_EVENT } from '../../api/apiClient';
import { useDataContext } from '../../contexts/DataContext';
import { useLocationContext } from '../../contexts/LocationContext';
import OtpInput from '../ui/OtpInput';

interface RequestHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  mechanic: any | null;
  initialVehicleLabel?: string;
  initialServiceLabel?: string;
}

type Phase = 'details' | 'auth' | 'success';

export function RequestHelpModal({
  isOpen,
  onClose,
  mechanic,
  initialVehicleLabel = '',
  initialServiceLabel = ''
}: RequestHelpModalProps) {
  const navigate = useNavigate();
  const { vehicles, services } = useDataContext();
  const { userLocation, locationName } = useLocationContext();
  const [phase, setPhase] = useState<Phase>('details');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [issueSummary, setIssueSummary] = useState('');
  const [issueDetails, setIssueDetails] = useState('');
  const [vehicleLabel, setVehicleLabel] = useState(initialVehicleLabel);
  const [serviceLabel, setServiceLabel] = useState(initialServiceLabel);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState<any | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setPhase('details');
    setIssueSummary(initialServiceLabel ? `Need help with ${initialServiceLabel}` : '');
    setIssueDetails('');
    setVehicleLabel(initialVehicleLabel);
    setServiceLabel(initialServiceLabel);
    setOtp(['', '', '', '', '', '']);
    setOtpSent(false);
    setSubmittedRequest(null);
  }, [isOpen, initialServiceLabel, initialVehicleLabel, mechanic?.id]);

  const serviceTypeId = useMemo(() => {
    if (!serviceLabel) return null;
    const match = services.find((service: any) => service.name === serviceLabel);
    return match?.id ?? null;
  }, [services, serviceLabel]);

  const vehicleTypeId = useMemo(() => {
    if (!vehicleLabel) return null;
    const match = vehicles.find((vehicle: any) => vehicle.name === vehicleLabel);
    return match?.id ?? null;
  }, [vehicles, vehicleLabel]);

  if (!isOpen || !mechanic) return null;

  const canSubmitDetails = Boolean(issueSummary.trim() && vehicleLabel.trim() && userLocation);
  const isCustomerAuthenticated = Boolean(localStorage.getItem('token') && localStorage.getItem('role') === 'Customer');

  const submitRequest = async () => {
    if (!userLocation) {
      toast.error('Please confirm your location before requesting help.');
      return;
    }

    setIsSubmitting(true);
    try {
      const trimmedIssueDetails = issueDetails.trim();
      const trimmedVehicleLabel = vehicleLabel.trim();
      const trimmedAddressText = locationName.trim();

      const response = await apiClient<any>('/customer/requests', {
        method: 'POST',
        data: {
          mechanicId: mechanic.id,
          serviceTypeId,
          vehicleTypeId,
          vehicleLabel: trimmedVehicleLabel,
          issueSummary,
          issueDetails: trimmedIssueDetails || undefined,
          latitude: userLocation[0],
          longitude: userLocation[1],
          addressText: trimmedAddressText || undefined,
        }
      });
      setSubmittedRequest(response.request);
      setPhase('success');
      toast.success('Help request submitted successfully.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (!canSubmitDetails) {
      toast.error('Please complete the request details first.');
      return;
    }

    if (isCustomerAuthenticated) {
      await submitRequest();
      return;
    }

    setPhase('auth');
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      toast.error('Enter your email to continue.');
      return;
    }

    setIsSendingOtp(true);
    try {
      await apiClient('/customer/auth/send-otp', {
        method: 'POST',
        data: { email: email.trim() }
      });
      setOtpSent(true);
      toast.success('OTP sent to your email.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyAndSubmit = async () => {
    const code = otp.join('');
    if (!email.trim() || code.length !== 6) {
      toast.error('Enter the 6-digit OTP to continue.');
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const authResponse = await apiClient<any>('/customer/auth/verify-otp', {
        method: 'POST',
        data: {
          email: email.trim(),
          code,
          displayName: displayName.trim() || undefined
        }
      });

      localStorage.setItem('token', authResponse.token);
      localStorage.setItem('refreshToken', authResponse.refreshToken);
      localStorage.setItem('role', authResponse.role);
      window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGED_EVENT));

      await submitRequest();
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-background/80 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-secondary/80 p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Close request help modal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="border-b border-border px-5 py-5 sm:px-6">
          <div className="pr-10">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Phase 1 Request Flow</p>
            <h3 className="mt-2 text-2xl font-black text-foreground">Request Help</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Submit a help request using the current RoadResQ flow. Browsing stays open to everyone. Authentication is required only at final confirmation.
            </p>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          <div className="mb-5 rounded-2xl border border-border/60 bg-secondary/20 p-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <Wrench className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-foreground">{mechanic.businessName || mechanic.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {[mechanic.area, mechanic.city, mechanic.state].filter(Boolean).join(', ') || 'Selected mechanic'}
                </p>
              </div>
            </div>
          </div>

          {phase === 'details' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-foreground">Vehicle</span>
                  <select
                    value={vehicleLabel}
                    onChange={(e) => setVehicleLabel(e.target.value)}
                    className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Select vehicle</option>
                    {vehicles.map((vehicle: any) => (
                      <option key={vehicle.id} value={vehicle.name}>{vehicle.name}</option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-foreground">Service</span>
                  <select
                    value={serviceLabel}
                    onChange={(e) => {
                      setServiceLabel(e.target.value);
                      if (!issueSummary.trim()) {
                        setIssueSummary(`Need help with ${e.target.value}`);
                      }
                    }}
                    className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                  >
                    <option value="">Select service</option>
                    {services.map((service: any) => (
                      <option key={service.id} value={service.name}>{service.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-foreground">Issue summary</span>
                <input
                  type="text"
                  value={issueSummary}
                  onChange={(e) => setIssueSummary(e.target.value)}
                  placeholder="Example: Flat tyre near race course road"
                  className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-sm font-semibold text-foreground">Additional details</span>
                <textarea
                  value={issueDetails}
                  onChange={(e) => setIssueDetails(e.target.value)}
                  rows={4}
                  placeholder="Add any details that help the mechanic understand the problem."
                  className="resize-none rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                />
              </label>

              <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  Request location
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {userLocation
                    ? `${locationName} (${userLocation[0].toFixed(5)}, ${userLocation[1].toFixed(5)})`
                    : 'Location not available. Please allow location access before confirming your request.'}
                </p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
                Final confirmation requires customer authentication. Guest browsing remains unchanged until that step.
              </div>
            </div>
          )}

          {phase === 'auth' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Confirm your identity to submit this request</p>
                    <p className="mt-1 text-sm text-muted-foreground">We will verify your email with a one-time code, then submit the request immediately.</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-foreground">Your name</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Optional display name"
                    className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                  />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm font-semibold text-foreground">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="rounded-xl border border-border bg-background px-3 py-3 text-sm outline-none transition-colors focus:border-primary"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSendOtp}
                  disabled={isSendingOtp}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {isSendingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {otpSent ? 'Resend OTP' : 'Send OTP'}
                </button>
                <button
                  onClick={() => setPhase('details')}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground transition-colors hover:bg-secondary"
                >
                  Back to request
                </button>
              </div>

              {otpSent && (
                <div className="space-y-3 rounded-2xl border border-border/60 bg-background/80 p-4">
                  <p className="text-sm font-semibold text-foreground">Enter the 6-digit OTP</p>
                  <OtpInput prefix="customer-request" value={otp} onChange={setOtp} disabled={isVerifyingOtp} />
                  <button
                    onClick={handleVerifyAndSubmit}
                    disabled={isVerifyingOtp}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                  >
                    {isVerifyingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Verify and submit request
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === 'success' && submittedRequest && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-emerald-500/20 p-2 text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">Request submitted</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Your request is now visible in the admin queue for manual review and assignment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Status</p>
                  <p className="mt-2 text-base font-bold text-foreground">{submittedRequest.status}</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Request ID</p>
                  <p className="mt-2 text-base font-bold text-foreground">#{submittedRequest.id}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border bg-card px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              This Phase 1 flow captures demand safely before advanced dispatch, payments, or realtime tracking.
            </p>

            {phase === 'details' && (
              <button
                onClick={handleContinue}
                disabled={!canSubmitDetails || isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirm request
              </button>
            )}

            {phase === 'success' && (
              <div className="flex flex-wrap gap-3">
                {submittedRequest?.id && (
                  <button
                    onClick={() => {
                      onClose();
                      navigate(`/customer/requests/${submittedRequest.id}`);
                    }}
                    className="inline-flex items-center justify-center rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
                  >
                    View request status
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
