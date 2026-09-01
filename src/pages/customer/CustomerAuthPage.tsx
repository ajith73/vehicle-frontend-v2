import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, Key, Eye, EyeOff, Phone, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { apiClient, AUTH_STATE_CHANGED_EVENT } from '../../api/apiClient';
import type { Mechanic } from '../../types';
import { OtpDigitInput } from '../../components/customer/auth/OtpDigitInput';
import {
  type AuthView,
  type RegisterStep,
  getAuthPortalContent,
  getInitialAuthView,
  getInputClassName,
  getPartnerBusinessSummary,
  getPortalFromPath,
  isApprovedPartnerProfile,
  isStrongPartnerPassword,
  isValidEmail,
  isValidIndianMobile,
  joinOtpDigits,
  normalizeAuthEmail,
  normalizeIndianMobile
} from './auth/customerAuthUtils';

type CustomerAuthPageProps = {
  portalOverride?: 'CUSTOMER' | 'PARTNER';
};

export default function CustomerAuthPage({ portalOverride }: CustomerAuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const portal = getPortalFromPath(location.pathname, portalOverride);
  
  // Read action query param for initial view state
  const params = new URLSearchParams(location.search);
  const actionParam = params.get('action');
  const resetEmailParam = params.get('email') || '';
  const resetTokenParam = params.get('token') || '';
  
  const [view, setView] = useState<AuthView>(getInitialAuthView(actionParam));
  const [loading, setLoading] = useState(false);
  const {
    isPartnerLogin,
    loginPath,
    authTitle,
    authSubtitle,
    registerTitle,
    loginButtonLabel,
    registerButtonLabel,
    resetSuccessRedirect
  } = getAuthPortalContent(portal);

  // Registration States
  const [registerStep, setRegisterStep] = useState<RegisterStep>('INITIAL');
  const [mobile, setMobile] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [partnerBusinessQuery, setPartnerBusinessQuery] = useState('');
  const [partnerBusinessResults, setPartnerBusinessResults] = useState<Mechanic[]>([]);
  const [partnerBusinessLoading, setPartnerBusinessLoading] = useState(false);
  const [selectedPartnerBusiness, setSelectedPartnerBusiness] = useState<Mechanic | null>(null);
  const [resetToken, setResetToken] = useState(resetTokenParam);
  const [otpResendSeconds, setOtpResendSeconds] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const normalizedEmail = normalizeAuthEmail(email);
  const normalizedMobile = normalizeIndianMobile(mobile);
  const otp = joinOtpDigits(otpDigits);
  const inputClass = (field: string, extra = '') => getInputClassName(fieldErrors, field, extra);
  const setFieldError = (field: string, message: string) => {
    setFieldErrors((current) => ({ ...current, [field]: message }));
  };
  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };
  const clearRegisterErrors = () => {
    setFieldErrors({});
  };

  useEffect(() => {
    if (otpResendSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setOtpResendSeconds((current) => current - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [otpResendSeconds]);

  useEffect(() => {
    setView(getInitialAuthView(actionParam));
    if (actionParam === 'reset') {
      setEmail(resetEmailParam);
      setResetToken(resetTokenParam);
    }
  }, [actionParam, resetEmailParam, resetTokenParam]);

  useEffect(() => {
    if (!isPartnerLogin || registerStep !== 'INITIAL') {
      setPartnerBusinessResults([]);
      setPartnerBusinessLoading(false);
      return;
    }

    if (partnerBusinessQuery.trim().length < 2) {
      setPartnerBusinessResults([]);
      setPartnerBusinessLoading(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setPartnerBusinessLoading(true);
        const params = new URLSearchParams({ search: partnerBusinessQuery.trim() });
        const results = await apiClient<Mechanic[]>(`/public/mechanics?${params.toString()}`);
        setPartnerBusinessResults((results || []).slice(0, 6));
      } catch {
        setPartnerBusinessResults([]);
      } finally {
        setPartnerBusinessLoading(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [isPartnerLogin, partnerBusinessQuery, registerStep]);

  // General States
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const storeSession = (res: any) => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    localStorage.removeItem('mechanicId');
    localStorage.setItem('token', res.token);
    localStorage.setItem('refreshToken', res.refreshToken);
    localStorage.setItem('role', res.role);
    if (res.mechanicId) {
      localStorage.setItem('mechanicId', String(res.mechanicId));
    }
    window.dispatchEvent(new CustomEvent(AUTH_STATE_CHANGED_EVENT));
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!email) nextErrors.email = 'Email is required';
    if (!password) nextErrors.password = 'Password is required';
    if (email && !isValidEmail(normalizedEmail)) nextErrors.email = 'Enter a valid email address';
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0]);
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiClient<any>('/auth/login', {
        method: 'POST',
        data: { email: normalizedEmail, password, portal }
      });
      storeSession(res);
      toast.success('Logged in successfully!');
      
      if (res.role === 'Mechanic' || res.role === 'Partner') {
        if (res.mechanicId) {
          try {
            const mechanicProfile = await apiClient<any>(`/public/mechanics/${res.mechanicId}`);
            if (!isApprovedPartnerProfile(mechanicProfile)) {
              navigate(`/mechanic-dashboard/${res.mechanicId}`, { replace: true });
              return;
            }
          } catch {
            navigate(`/mechanic-dashboard/${res.mechanicId}`, { replace: true });
            return;
          }
        }
        navigate('/partner', { replace: true });
      } else {
        navigate('/customer', { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMobileChange = (value: string) => {
    setMobile(normalizeIndianMobile(value));
    clearFieldError('mobile');
  };

  const resetOtpState = () => {
    setOtpDigits(['', '', '', '', '', '']);
    setOtpResendSeconds(60);
  };

  const resetPartnerRegisterState = () => {
    setPartnerBusinessQuery('');
    setPartnerBusinessResults([]);
    setSelectedPartnerBusiness(null);
  };

  const handleSendOtp = async () => {
    const nextErrors: Record<string, string> = {};
    if (!normalizedEmail) nextErrors.email = 'Email is required';
    if (normalizedEmail && !isValidEmail(normalizedEmail)) nextErrors.email = 'Enter a valid email address';
    if (!isPartnerLogin && !isValidIndianMobile(normalizedMobile)) nextErrors.mobile = 'Enter a valid 10-digit mobile number';
    if (!acceptTerms) nextErrors.terms = 'You must accept the terms and conditions';
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0]);
      return;
    }
    clearRegisterErrors();
    
    setLoading(true);
    try {
      const checkRes = await apiClient<any>('/public/check-email', {
        method: 'POST',
        data: { email: normalizedEmail, mobile: isPartnerLogin ? undefined : normalizedMobile }
      });
      const isReusablePartnerRole =
        isPartnerLogin &&
        (String(checkRes.existingRole || '') === 'Mechanic' || String(checkRes.existingRole || '') === 'Partner');

      if (checkRes.exists && !isReusablePartnerRole) {
        const roleLabel = checkRes.existingRole ? String(checkRes.existingRole) : 'another';
        setFieldError('email', `This email is already used by a ${roleLabel.toLowerCase()} account.`);
        toast.error(`This email is already used by a ${roleLabel.toLowerCase()} account. Please login instead.`);
        setLoading(false);
        return;
      }
      if (checkRes.mobileExists) {
        setFieldError('mobile', 'This mobile number is already used by another customer account.');
        toast.error('This mobile number is already used by another customer account.');
        setLoading(false);
        return;
      }
      await apiClient('/public/send-otp', { method: 'POST', data: { email: normalizedEmail } });
      toast.success('OTP sent to your email!');
      setRegisterStep('OTP_SENT');
      resetOtpState();
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setFieldError('otp', 'Please enter a valid 6-digit OTP');
      return toast.error('Please enter a valid 6-digit OTP');
    }
    
    setLoading(true);
    try {
      await apiClient('/public/verify-otp', { method: 'POST', data: { email: normalizedEmail, code: otp } });
      toast.success('Email verified successfully!');
      setRegisterStep('OTP_VERIFIED');
    } catch (err: any) {
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpResendSeconds > 0 || loading) return;

    setLoading(true);
    try {
      await apiClient('/public/send-otp', { method: 'POST', data: { email: normalizedEmail } });
      toast.success('OTP resent successfully');
      resetOtpState();
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      toast.error(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    clearFieldError('otp');
    setOtpDigits((current) => {
      const next = [...current];
      next[index] = digit;
      return next;
    });

    if (digit && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < otpRefs.current.length - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((digit, index) => {
      next[index] = digit;
    });
    setOtpDigits(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!isValidEmail(normalizedEmail)) nextErrors.email = 'Enter a valid email address';
    if (!isPartnerLogin && !isValidIndianMobile(normalizedMobile)) nextErrors.mobile = 'Enter a valid 10-digit mobile number';
    if (!password) nextErrors.password = 'Password is required';
    if (isPartnerLogin && password && !isStrongPartnerPassword(password)) {
      nextErrors.password = 'Use a stronger password with 6+ chars, upper, lower, number, and special character';
    }
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return toast.error(Object.values(nextErrors)[0]);
    }
    clearRegisterErrors();
    
    setLoading(true);
    try {
      const role = isPartnerLogin ? 'Mechanic' : 'Customer';
      const res = await apiClient<any>('/auth/register', {
        method: 'POST',
        data: { email: normalizedEmail, password, mobile: normalizedMobile, role }
      });
      
      storeSession(res);
      const partnerMechanicId = selectedPartnerBusiness?.id ? String(selectedPartnerBusiness.id) : '';
      if (isPartnerLogin && partnerMechanicId) localStorage.setItem('mechanicId', partnerMechanicId);
      
      toast.success('Registration successful!');
      if (isPartnerLogin) {
        if (partnerMechanicId) {
          navigate(`/verify-flow/${partnerMechanicId}`, {
            state: { accountEmail: normalizedEmail, accountPassword: password }
          });
        } else {
          const setupParams = new URLSearchParams();
          setupParams.set('setup', '1');
          setupParams.set('newBusiness', '1');
          navigate(`/partner/account?${setupParams.toString()}`);
        }
      } else {
        navigate('/customer');
      }
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!normalizedEmail) nextErrors.email = 'Email is required';
    if (normalizedEmail && !isValidEmail(normalizedEmail)) nextErrors.email = 'Enter a valid email address';
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0]);
      return;
    }

    setLoading(true);
    try {
      await apiClient<{ message: string }>('/auth/forgot-password', {
        method: 'POST',
        data: { email: normalizedEmail, portal }
      });
      toast.success('If this account exists, a reset link has been sent to your email.');
      setView('LOGIN');
      navigate(resetSuccessRedirect, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!normalizedEmail) nextErrors.email = 'Email is required';
    if (!resetToken) nextErrors.reset = 'Reset link is invalid or missing';
    if (!password) nextErrors.password = 'Please enter a new password';
    if (password && password.length < 6) nextErrors.password = 'Password must be at least 6 characters';
    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      toast.error(Object.values(nextErrors)[0]);
      return;
    }

    setLoading(true);
    try {
      await apiClient<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        data: { email: normalizedEmail, token: resetToken, newPassword: password, portal }
      });
      toast.success('Password has been reset successfully!');
      setView('LOGIN');
      setPassword('');
      setResetToken('');
      navigate(resetSuccessRedirect, { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px] animate-pulse delay-1000" />
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md relative z-10">
        <div className="bg-card/70 backdrop-blur-xl border border-border/50 shadow-2xl rounded-3xl overflow-hidden p-8">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-foreground mb-2">{authTitle}</h1>
            <p className="text-sm font-semibold text-muted-foreground">
              {authSubtitle}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {view === 'LOGIN' && (
              <motion.div
                key="login"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                {!isPartnerLogin && (
                  <div className="space-y-4 mb-6">
                    <button
                      onClick={() => navigate('/customer')}
                      className="w-full flex items-center justify-center gap-2 bg-secondary/80 hover:bg-secondary text-foreground font-bold py-3 px-4 rounded-xl transition-colors border border-border/50"
                    >
                      Continue as Guest
                    </button>
                  </div>
                )}

                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Login with email
                  </span>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 mt-2">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                      placeholder="Email address"
                      className={inputClass('email', 'py-3 pl-10 pr-4')}
                      required
                    />
                  </div>
                  
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                      placeholder="Password"
                      className={inputClass('password', 'py-3 pl-10 pr-10')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="peer sr-only"
                        />
                        <div className="w-4 h-4 border-2 border-muted-foreground rounded transition-colors peer-checked:bg-primary peer-checked:border-primary"></div>
                      </div>
                      <span className="font-semibold text-muted-foreground group-hover:text-foreground transition-colors">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setView('FORGOT_PASSWORD')}
                      className="font-bold text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_14px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 mt-2 disabled:opacity-70 disabled:hover:translate-y-0"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : loginButtonLabel}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>
                </form>

                <p className="text-center mt-6 text-sm font-semibold text-muted-foreground">
                  Don't have an account?{' '}
                  <button onClick={() => { setView('REGISTER'); setRegisterStep('INITIAL'); navigate('?action=register', { replace: true }); }} className="text-primary font-bold hover:underline">
                    Register now
                  </button>
                </p>
              </motion.div>
            )}

            {view === 'REGISTER' && (
              <motion.div
                key="register"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => { setView('LOGIN'); resetPartnerRegisterState(); navigate(loginPath, { replace: true }); }}
                  className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </button>

                <h2 className="text-2xl font-black text-foreground mb-6">{registerTitle}</h2>
                
                {registerStep === 'INITIAL' && (
                  <>
                    <div className="relative flex items-center py-4 mb-2">
                      <div className="flex-grow border-t border-border"></div>
                      <span className="flex-shrink-0 mx-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Register with email
                      </span>
                      <div className="flex-grow border-t border-border"></div>
                    </div>
                  </>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  {registerStep === 'INITIAL' && (
                    <>
                      {!isPartnerLogin ? (
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-bold text-foreground">+91</span>
                          <input
                            type="tel"
                            value={mobile}
                            onChange={(e) => handleMobileChange(e.target.value)}
                            placeholder="10-digit mobile number"
                            inputMode="numeric"
                            maxLength={10}
                            className={inputClass('mobile', 'py-3 pl-[4.5rem] pr-4')}
                            required
                          />
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="mb-2 block text-sm font-bold text-foreground">
                              Search for your existing business below to start the verification process.
                            </label>
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                              <input
                                type="text"
                                value={partnerBusinessQuery}
                                onChange={(event) => setPartnerBusinessQuery(event.target.value)}
                                placeholder="Optional: business name, mechanic name, area, or city"
                                className="w-full rounded-xl border border-border/50 bg-background py-3 pl-10 pr-4 text-sm font-medium outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                              This is optional. If your business is available, select it. If not available, skip and continue.
                            </p>
                          </div>

                          {selectedPartnerBusiness ? (
                            <div className="flex items-start justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-foreground truncate">
                                  {selectedPartnerBusiness.businessName || selectedPartnerBusiness.name}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground truncate">
                                  {getPartnerBusinessSummary(selectedPartnerBusiness) || 'Existing business selected'}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPartnerBusiness(null);
                                  setPartnerBusinessQuery('');
                                  setPartnerBusinessResults([]);
                                }}
                                className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-background hover:text-foreground"
                                aria-label="Clear selected business"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : null}

                          {!selectedPartnerBusiness && partnerBusinessLoading ? (
                            <div className="rounded-2xl border border-border bg-background/60 px-4 py-3 text-sm text-muted-foreground">
                              Searching businesses...
                            </div>
                          ) : null}

                          {!selectedPartnerBusiness && !partnerBusinessLoading && partnerBusinessResults.length > 0 ? (
                            <div className="space-y-2">
                              {partnerBusinessResults.map((business) => (
                                <button
                                  key={business.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedPartnerBusiness(business);
                                    setPartnerBusinessQuery(business.businessName || business.name || '');
                                    setPartnerBusinessResults([]);
                                  }}
                                  className="flex w-full items-start justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-left transition-colors hover:border-primary/40 hover:bg-primary/5"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-foreground">
                                      {business.businessName || business.name}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-muted-foreground">
                                      {getPartnerBusinessSummary(business)}
                                    </p>
                                  </div>
                                  <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                                    Select
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      )}
                      
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                          placeholder="Email address"
                          className={inputClass('email', 'py-3 pl-10 pr-4')}
                          required
                        />
                      </div>
                      
                      <div className="flex items-start gap-3 pt-2 pl-1">
                        <div className="relative flex items-center justify-center mt-0.5">
                          <input
                            type="checkbox"
                            id="terms"
                            checked={acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="peer sr-only"
                          />
                          <div className={`w-4 h-4 border-2 rounded transition-colors peer-checked:bg-primary peer-checked:border-primary cursor-pointer ${fieldErrors.terms ? 'border-red-500' : 'border-muted-foreground'}`}></div>
                        </div>
                        <label htmlFor="terms" className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
                          I accept the <Link to="/terms" className="text-primary hover:underline font-bold">Terms and Conditions</Link>
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_14px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 mt-6 disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Email OTP'}
                      </button>
                    </>
                  )}

                  {registerStep === 'OTP_SENT' && (
                    <>
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/60 p-4">
                          <Key className="h-5 w-5 text-muted-foreground" />
                          <OtpDigitInput
                            digits={otpDigits}
                            error={fieldErrors.otp}
                            inputRefs={otpRefs}
                            onChangeDigit={handleOtpDigitChange}
                            onKeyDown={handleOtpKeyDown}
                            onPaste={handleOtpPaste}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <p className="text-muted-foreground">
                            OTP sent to <span className="font-semibold text-foreground">{normalizedEmail}</span>
                          </p>
                          <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={loading || otpResendSeconds > 0}
                            className="font-bold text-primary disabled:text-muted-foreground disabled:cursor-not-allowed"
                          >
                            {otpResendSeconds > 0 ? `Resend in ${otpResendSeconds}s` : 'Resend OTP'}
                          </button>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground">OTP expires in 1 hour.</p>
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_14px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 mt-6 disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify OTP'}
                      </button>
                    </>
                  )}

                  {registerStep === 'OTP_VERIFIED' && (
                    <>
                      {!isPartnerLogin ? (
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <span className="absolute left-10 top-1/2 -translate-y-1/2 text-sm font-bold text-foreground">+91</span>
                          <input
                            type="tel"
                            value={mobile}
                            readOnly
                            placeholder="10-digit mobile number"
                            inputMode="numeric"
                            maxLength={10}
                            className={`${inputClass('mobile', 'py-3 pl-[4.5rem] pr-4')} cursor-not-allowed bg-secondary/50 text-muted-foreground`}
                            required
                          />
                        </div>
                      ) : null}
                      
                      <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-secondary/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Verified email</p>
                            <p className="truncate text-sm font-medium text-foreground">{email}</p>
                          </div>
                        </div>
                        <span className="inline-flex w-max shrink-0 rounded-md bg-green-500/10 px-2 py-1 text-xs font-bold text-green-500">
                          Verified
                        </span>
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                          placeholder="Create password"
                          className={inputClass('password', 'py-3 pl-10 pr-10')}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {isPartnerLogin ? (
                        <p className="text-xs text-muted-foreground">
                          Strong password required: minimum 6 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.
                        </p>
                      ) : null}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_14px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 mt-6 disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : registerButtonLabel}
                      </button>
                    </>
                  )}
                  
                </form>
              </motion.div>
            )}

            {view === 'FORGOT_PASSWORD' && (
              <motion.div
                key="forgot"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setView('LOGIN')}
                  className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </button>

                <h2 className="text-2xl font-black text-foreground mb-2">Reset Password</h2>
                <p className="text-sm font-medium text-muted-foreground mb-6">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      className="w-full bg-background border border-border/50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_14px_rgba(59,130,246,0.4)] mt-6"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                  </button>
                </form>
              </motion.div>
            )}

            {view === 'RESET_PASSWORD' && (
              <motion.div
                key="reset"
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.3 }}
              >
                <button
                  onClick={() => setView('LOGIN')}
                  className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </button>

                <h2 className="text-2xl font-black text-foreground mb-2">Create New Password</h2>
                <p className="text-sm font-medium text-muted-foreground mb-6">
                  Please enter your new password below.
                </p>

                {(!resetToken || !email) && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">
                    Reset link is missing or invalid. Please request a new password reset email.
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                      placeholder="Email address"
                      className={inputClass('email', 'py-3 pl-10 pr-4')}
                      required
                    />
                  </div>

                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); clearFieldError('reset'); }}
                      placeholder="New password"
                      className={inputClass('password', 'py-3 pl-10 pr-10')}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_14px_rgba(59,130,246,0.4)] mt-6"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save New Password'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
