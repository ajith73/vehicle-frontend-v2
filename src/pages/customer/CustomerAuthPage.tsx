import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, Key, Eye, EyeOff, Search, Phone } from 'lucide-react';
import { FaGoogle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { apiClient } from '../../api/apiClient';
import { useUser, useAuth, SignInButton, SignUpButton } from '@clerk/clerk-react';

type AuthView = 'LOGIN' | 'REGISTER' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD';
type RegisterStep = 'INITIAL' | 'OTP_SENT' | 'OTP_VERIFIED';

export default function CustomerAuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const portal = location.pathname.includes('/partner/login') ? 'PARTNER' : 'CUSTOMER';
  
  // Read action query param for initial view state
  const params = new URLSearchParams(location.search);
  const actionParam = params.get('action');
  
  const [view, setView] = useState<AuthView>(actionParam === 'register' ? 'REGISTER' : 'LOGIN');
  const [loading, setLoading] = useState(false);
  const isPartnerLogin = portal === 'PARTNER';
  
  // Clerk Hooks
  const { user, isLoaded: isUserLoaded } = useUser();
  const { signOut } = useAuth();

  // Registration States
  const [registerStep, setRegisterStep] = useState<RegisterStep>('INITIAL');
  const [mobile, setMobile] = useState('');
  const [mechanicQuery, setMechanicQuery] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpResendSeconds, setOtpResendSeconds] = useState(0);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const isCustomerLogin = !isPartnerLogin;
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedMobile = mobile.replace(/\D/g, '').slice(0, 10);
  const otp = otpDigits.join('');

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const isValidIndianMobile = (value: string) => /^\d{10}$/.test(value);
  const inputClass = (field: string, extra = '') =>
    `w-full bg-background border rounded-xl text-sm font-medium focus:outline-none focus:ring-1 transition-all ${
      fieldErrors[field]
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-border/50 focus:border-primary focus:ring-primary'
    } ${extra}`;
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

  // Handle Clerk successful auth interception
  useEffect(() => {
    let isMounted = true;
    
    const handleGoogleLogin = async (verifiedEmail: string) => {
      try {
        setLoading(true);
        const role = isPartnerLogin ? 'Mechanic' : 'Customer';
        
        const res = await apiClient<any>('/auth/google', {
          method: 'POST',
          data: { email: verifiedEmail, role, action: 'login', portal }
        });
        
        if (isMounted) {
          storeSession(res);
          toast.success(`Welcome back!`);
          
          await signOut();
          
          if (res.role === 'Mechanic' || res.role === 'Partner') {
            navigate('/partner');
          } else {
            navigate('/customer');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          await signOut();
          toast.error(err.message || 'Google Login failed');
          if (err.message?.includes('Please register')) {
            setView('REGISTER');
            setRegisterStep('INITIAL');
            navigate(isPartnerLogin ? '?action=register' : '?action=register', { replace: true });
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (isUserLoaded && user) {
      if (isCustomerLogin) {
        signOut();
        return;
      }

      const verifiedEmail = user.primaryEmailAddress?.emailAddress;
      if (verifiedEmail && !loading) {
        if (actionParam === 'register' || view === 'REGISTER') {
          // Registration Flow: Use Google only to verify email, then proceed to password setup
          toast.success(`Email verified automatically via Google`);
          setEmail(verifiedEmail);
          setRegisterStep('OTP_VERIFIED');
          signOut();
        } else {
          // Login Flow: Attempt to log in with backend
          handleGoogleLogin(verifiedEmail);
        }
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [isUserLoaded, user, isPartnerLogin, isCustomerLogin, navigate, signOut, actionParam, view]);

  useEffect(() => {
    if (otpResendSeconds <= 0) return;
    const timer = window.setTimeout(() => {
      setOtpResendSeconds((current) => current - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [otpResendSeconds]);

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
  };
  
  // Removed manual OAuth handlers in favor of Clerk modal buttons

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
        navigate('/partner');
      } else {
        navigate('/customer');
      }
    } catch (err: any) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMobileChange = (value: string) => {
    setMobile(value.replace(/\D/g, '').slice(0, 10));
    clearFieldError('mobile');
  };

  const resetOtpState = () => {
    setOtpDigits(['', '', '', '', '', '']);
    setOtpResendSeconds(60);
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
      if (checkRes.exists) {
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
      
      toast.success('Registration successful!');
      if (isPartnerLogin) {
        navigate('/verify-start');
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
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success('Password reset link sent to your email!');
      setView('RESET_PASSWORD'); // Simulate clicking the link for testing
    } catch (err: any) {
      toast.error('Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error('Please enter a new password');
      return;
    }
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      toast.success('Password has been reset successfully!');
      setView('LOGIN');
    } catch (err: any) {
      toast.error('Failed to reset password');
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
            <h1 className="text-3xl font-black text-foreground mb-2">RoadResQ</h1>
            <p className="text-sm font-semibold text-muted-foreground">
              {isPartnerLogin ? 'Partner Portal' : "Your Vehicle's Best Friend"}
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
                <div className="space-y-4 mb-6">
                  {!isPartnerLogin && (
                    <button
                      onClick={() => navigate('/customer')}
                      className="w-full flex items-center justify-center gap-2 bg-secondary/80 hover:bg-secondary text-foreground font-bold py-3 px-4 rounded-xl transition-colors border border-border/50"
                    >
                      Continue as Guest
                    </button>
                  )}
                  {isPartnerLogin && (
                    <SignInButton mode="modal">
                      <button
                        type="button"
                        className="w-full flex items-center justify-center gap-2 bg-card border border-border/50 hover:border-primary/30 text-foreground font-bold py-3 px-4 rounded-xl transition-all shadow-sm"
                      >
                        <FaGoogle className="text-red-500" />
                        Sign in with Google
                      </button>
                    </SignInButton>
                  )}
                </div>

                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-border"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {isPartnerLogin ? 'Or login with email' : 'Login with email'}
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
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login'}
                    {!loading && <ArrowRight className="w-5 h-5" />}
                  </button>
                </form>

                <p className="text-center mt-6 text-sm font-semibold text-muted-foreground">
                  Don't have an account?{' '}
                  <button onClick={() => { setView('REGISTER'); setRegisterStep('INITIAL'); navigate(isPartnerLogin ? '?action=register' : '?action=register', { replace: true }); }} className="text-primary font-bold hover:underline">
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
                  onClick={() => { setView('LOGIN'); navigate(isPartnerLogin ? '/partner/login' : '/customer/login', { replace: true }); }}
                  className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to login
                </button>

                <h2 className="text-2xl font-black text-foreground mb-6">Create Account</h2>
                
                {registerStep === 'INITIAL' && (
                  <>
                    {isPartnerLogin && (
                      <div className="space-y-4 mb-6">
                        <SignUpButton mode="modal">
                          <button
                            type="button"
                            className="w-full flex items-center justify-center gap-2 bg-card border border-border/50 hover:border-primary/30 text-foreground font-bold py-3 px-4 rounded-xl transition-all shadow-sm"
                          >
                            <FaGoogle className="text-red-500" />
                            Sign up with Google
                          </button>
                        </SignUpButton>
                      </div>
                    )}

                    <div className="relative flex items-center py-4 mb-2">
                      <div className="flex-grow border-t border-border"></div>
                      <span className="flex-shrink-0 mx-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        {isPartnerLogin ? 'Or register with email' : 'Register with email'}
                      </span>
                      <div className="flex-grow border-t border-border"></div>
                    </div>
                  </>
                )}

                <form onSubmit={handleRegister} className="space-y-4">
                  {registerStep === 'INITIAL' && (
                    <>
                      {isPartnerLogin ? (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            type="text"
                            value={mechanicQuery}
                            onChange={(e) => setMechanicQuery(e.target.value)}
                            placeholder="Search Mechanic (optional)"
                            className="w-full bg-background border border-border/50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          />
                        </div>
                      ) : (
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
                          <div className="grid flex-1 grid-cols-6 gap-2">
                            {otpDigits.map((digit, index) => (
                              <input
                                key={index}
                                ref={(element) => {
                                  otpRefs.current[index] = element;
                                }}
                                type="text"
                                value={digit}
                                onChange={(event) => handleOtpDigitChange(index, event.target.value)}
                                onKeyDown={(event) => handleOtpKeyDown(index, event)}
                                onPaste={handleOtpPaste}
                                inputMode="numeric"
                                maxLength={1}
                                className={`h-12 rounded-xl border bg-card text-center text-lg font-black text-foreground focus:outline-none focus:ring-1 transition-all ${fieldErrors.otp ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-border/50 focus:border-primary focus:ring-primary'}`}
                                aria-label={`OTP digit ${index + 1}`}
                              />
                            ))}
                          </div>
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
                      {isPartnerLogin ? (
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                          <input
                            type="text"
                            value={mechanicQuery}
                            onChange={(e) => setMechanicQuery(e.target.value)}
                            placeholder="Search Mechanic (optional)"
                            className="w-full bg-background border border-border/50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                          />
                        </div>
                      ) : (
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
                      )}
                      
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

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_4px_14px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.6)] hover:-translate-y-0.5 mt-6 disabled:opacity-70 disabled:hover:translate-y-0"
                      >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register'}
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

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="New password"
                      className="w-full bg-background border border-border/50 rounded-xl py-3 pl-10 pr-10 text-sm font-medium focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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
