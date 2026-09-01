import type { Mechanic } from '../../../types';

export type AuthView = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD';
export type RegisterStep = 'INITIAL' | 'OTP_SENT' | 'OTP_VERIFIED';
export type AuthPortal = 'CUSTOMER' | 'PARTNER';

export const getPortalFromPath = (pathname: string, portalOverride?: AuthPortal): AuthPortal => {
  if (portalOverride) return portalOverride;
  return pathname.includes('/partner/login') ? 'PARTNER' : 'CUSTOMER';
};

export const getInitialAuthView = (actionParam: string | null): AuthView => {
  if (actionParam === 'register') return 'REGISTER';
  if (actionParam === 'reset') return 'RESET_PASSWORD';
  return 'LOGIN';
};

export const isApprovedPartnerProfile = (profile: any) => {
  const pendingVerificationStatus = String(profile?.pendingVerification?.status || '').toLowerCase();
  return (
    profile?.status === 'Approved' &&
    Number(profile?.verificationLevel || 0) >= 1 &&
    pendingVerificationStatus !== 'pending' &&
    pendingVerificationStatus !== 'rejected'
  );
};

export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
export const isValidIndianMobile = (value: string) => /^\d{10}$/.test(value);
export const isStrongPartnerPassword = (value: string) =>
  value.length >= 6 &&
  /[A-Z]/.test(value) &&
  /[a-z]/.test(value) &&
  /\d/.test(value) &&
  /[^A-Za-z0-9]/.test(value);

export const getAuthPortalContent = (portal: AuthPortal) => {
  const isPartnerLogin = portal === 'PARTNER';

  return {
    isPartnerLogin,
    loginPath: isPartnerLogin ? '/partner/login' : '/customer/login',
    authTitle: isPartnerLogin ? 'RoadResQ Partner' : 'RoadResQ',
    authSubtitle: isPartnerLogin ? 'Partner Portal' : "Your Vehicle's Best Friend",
    registerTitle: isPartnerLogin ? 'Create Partner Account' : 'Create Account',
    loginButtonLabel: isPartnerLogin ? 'Partner Login' : 'Login',
    registerButtonLabel: isPartnerLogin ? 'Create Partner Account' : 'Register',
    resetSuccessRedirect: isPartnerLogin ? '/partner/login' : '/customer/login'
  };
};

export const getInputClassName = (fieldErrors: Record<string, string>, field: string, extra = '') =>
  `w-full bg-background border rounded-xl text-sm font-medium focus:outline-none focus:ring-1 transition-all ${
    fieldErrors[field]
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-border/50 focus:border-primary focus:ring-primary'
  } ${extra}`;

export const normalizeAuthEmail = (value: string) => value.trim().toLowerCase();
export const normalizeIndianMobile = (value: string) => value.replace(/\D/g, '').slice(0, 10);
export const joinOtpDigits = (digits: string[]) => digits.join('');

export const getPartnerBusinessSummary = (business: Mechanic) =>
  [business.area, business.city, business.mechanicType].filter(Boolean).join(' • ');
