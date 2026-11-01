import React, { useState, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft, Mail, Lock, User as UserIcon, Sparkles } from 'lucide-react';

interface AuthFlowProps {
  initialView?: 'welcome' | 'login' | 'signup';
}

export const AuthFlow: React.FC<AuthFlowProps> = ({ initialView = 'welcome' }) => {
  const {
    checkUsernameUnique,
    startSignup,
    verifySignupCode,
    resendVerificationCode,
    login,
    loginWithGoogle,
    requestPasswordReset,
    completePasswordReset,
    pendingSignup,
    resendTimer,
    signupStep,
    setSignupStep,
    switchUserDemo,
  } = useAuth();

  const [view, setView] = useState<'welcome' | 'login' | 'signup' | 'forgot'>(
    signupStep === 'verify' ? 'signup' : initialView
  );

  // Sign up form state
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [lastGeneratedCode, setLastGeneratedCode] = useState<string | null>(null);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Forgot password state
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotStep, setForgotStep] = useState<'request' | 'reset'>('request');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [demoResetCode, setDemoResetCode] = useState<string | null>(null);

  // Status and error banners
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Username validation feedback
  const cleanUser = username.trim().replace(/^@/, '');
  const isUsernameAvailable = cleanUser.length >= 3 ? checkUsernameUnique(cleanUser) : null;

  useEffect(() => {
    if (signupStep === 'verify') {
      setView('signup');
      if (pendingSignup?.code) {
        setLastGeneratedCode(pendingSignup.code);
      }
    }
  }, [signupStep, pendingSignup]);

  const handleStartSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!fullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (cleanUser.length < 3) {
      setErrorMessage('Username must be at least 3 characters long');
      return;
    }
    if (!isUsernameAvailable) {
      setErrorMessage('Username is already taken. Please choose another');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    const result = await startSignup(fullName, cleanUser, email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Signup failed');
    } else {
      setLastGeneratedCode(result.code || null);
      setSuccessMessage(`A 6-digit verification code was sent to ${email}`);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (verificationCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit code');
      return;
    }

    setIsSubmitting(true);
    const result = await verifySignupCode(verificationCode);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Verification failed');
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setErrorMessage(null);
    const newCode = await resendVerificationCode();
    if (newCode) {
      setLastGeneratedCode(newCode);
      setSuccessMessage('A fresh verification code has been generated and sent!');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your email or username');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    const result = await login(loginIdentifier, loginPassword);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Invalid credentials');
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    const result = await loginWithGoogle();
    setIsSubmitting(false);
    if (!result.success) {
      setErrorMessage(result.error || 'Google sign-in could not be completed.');
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!forgotIdentifier.trim()) {
      setErrorMessage('Please enter your email or username');
      return;
    }

    setIsSubmitting(true);
    const result = await requestPasswordReset(forgotIdentifier);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.message);
    } else {
      setDemoResetCode(result.code || null);
      setSuccessMessage(result.message);
      setForgotStep('reset');
    }
  };

  const handleForgotComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    setIsSubmitting(true);
    const result = await completePasswordReset(forgotCode, newPassword);
    setIsSubmitting(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to reset password');
    } else {
      setSuccessMessage(result.message || 'Password reset! You can now log in.');
      setTimeout(() => {
        setView('login');
        setForgotStep('request');
        setErrorMessage(null);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#111111] text-white flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#FACC15]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-[#EF4444]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-zinc-950/90 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative z-10 transition-all">
        {/* Error or Success notification */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-950/70 border border-red-800 text-red-200 text-sm rounded-xl flex items-center gap-2 animate-fadeIn">
            <XCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 bg-yellow-950/50 border border-[#FACC15]/40 text-yellow-200 text-sm rounded-xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-[#FACC15] shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* SCREEN 1: WELCOME SCREEN                                     */}
        {/* ============================================================ */}
        {view === 'welcome' && (
          <div className="flex flex-col items-center text-center space-y-7 py-4">
            <Logo size="xl" showTagline={true} />

            <div className="space-y-2 max-w-xs mx-auto">
              <h2 className="text-xl font-bold text-zinc-100">
                Join the Cultural Vibe
              </h2>
              <p className="text-sm text-zinc-400">
                Discover trending reels, authentic stories, connect with friends, and share your world.
              </p>
            </div>

            <div className="w-full space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setView('signup');
                  setErrorMessage(null);
                }}
                className="w-full bg-[#FACC15] hover:bg-[#eab308] text-black font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-yellow-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-base"
              >
                <Sparkles className="w-4 h-4 text-black" />
                Sign up
              </button>

              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setErrorMessage(null);
                }}
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3.5 px-4 rounded-xl border border-zinc-700/80 active:scale-[0.98] transition-all text-base"
              >
                Log in
              </button>
            </div>

            {/* Quick Demo Accounts Switcher for immediate testing */}
            <div className="w-full pt-4 border-t border-zinc-800/80 text-left">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                Quick Test Login (Demo Profiles)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => switchUserDemo('user_current')}
                  className="p-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-left flex items-center gap-2 text-xs transition-colors"
                >
                  <img
                    src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80"
                    alt="Bilal"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="truncate">
                    <p className="font-semibold text-zinc-200 truncate">Bilal Ahmed</p>
                    <p className="text-[10px] text-zinc-400">Creator</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => switchUserDemo('user_zoya')}
                  className="p-2 bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-left flex items-center gap-2 text-xs transition-colors"
                >
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Zoya"
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <div className="truncate">
                    <p className="font-semibold text-zinc-200 truncate">Zoya Khan</p>
                    <p className="text-[10px] text-[#FACC15]">Verified Artist</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SCREEN 2: SIGN UP SCREEN (Form & 6-digit Code Entry)          */}
        {/* ============================================================ */}
        {view === 'signup' && signupStep === 'form' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView('welcome')}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                title="Back to Welcome"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Logo size="sm" />
              <div className="w-8" />
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white">Create an account</h2>
              <p className="text-xs text-zinc-400 mt-1">Join Mehfil to share your voice and connect</p>
            </div>

            <form onSubmit={handleStartSignup} className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Ayla Noor"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl py-2.5 pl-10 pr-4 placeholder-zinc-500 transition-colors"
                  />
                </div>
              </div>

              {/* Username with live unique check */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-zinc-300">Username</label>
                  {cleanUser.length >= 3 && (
                    <span className="text-[11px] flex items-center gap-1 font-medium">
                      {isUsernameAvailable ? (
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> available
                        </span>
                      ) : (
                        <span className="text-[#EF4444] flex items-center gap-0.5">
                          <XCircle className="w-3 h-3" /> taken
                        </span>
                      )}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-zinc-400 font-semibold text-sm">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="unique_username"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl py-2.5 pl-8 pr-4 placeholder-zinc-500 transition-colors"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl py-2.5 pl-10 pr-4 placeholder-zinc-500 transition-colors"
                  />
                </div>
              </div>

              {/* Password with toggle & strength meter */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl py-2.5 pl-10 pr-10 placeholder-zinc-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-2.5 text-zinc-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthMeter password={password} />
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl py-2.5 pl-10 pr-10 placeholder-zinc-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-2.5 text-zinc-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-[11px] text-[#EF4444] mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-[#FACC15] hover:bg-[#eab308] text-black font-bold py-3 px-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 text-sm shadow-md shadow-yellow-500/10"
              >
                {isSubmitting ? 'Sending code...' : 'Sign Up & Verify'}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-zinc-800 w-full" />
              <span className="bg-zinc-950 px-3 text-xs text-zinc-400 uppercase tracking-wider absolute">
                or
              </span>
            </div>

            {/* Official Sign in with Google Button */}
            <GoogleSignInButton
              onClick={handleGoogleAuth}
              text="Sign in with Google"
              disabled={isSubmitting}
            />

            <p className="text-center text-xs text-zinc-400 pt-2">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setErrorMessage(null);
                }}
                className="text-[#FACC15] font-semibold hover:underline"
              >
                Log in
              </button>
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/* SCREEN 2 (cont): 6-DIGIT EMAIL VERIFICATION CODE SCREEN       */}
        {/* ============================================================ */}
        {view === 'signup' && signupStep === 'verify' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSignupStep('form')}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                title="Back to Form"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Logo size="sm" />
              <div className="w-8" />
            </div>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 bg-[#FACC15]/10 border border-[#FACC15]/30 rounded-full flex items-center justify-center mx-auto text-[#FACC15] mb-2">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-white">Enter 6-digit Code</h2>
              <p className="text-xs text-zinc-400">
                We sent a verification code to{' '}
                <span className="text-zinc-200 font-medium">{pendingSignup?.email}</span>
              </p>
            </div>

            {/* Simulated verification helper banner so tester is never blocked */}
            {lastGeneratedCode && (
              <div className="p-3 bg-yellow-950/40 border border-[#FACC15]/30 rounded-xl text-center">
                <p className="text-[11px] text-zinc-400">Demo Email Inbox Simulation:</p>
                <p className="text-sm font-mono font-bold text-[#FACC15] tracking-widest mt-0.5">
                  Code: {lastGeneratedCode}
                </p>
                <button
                  type="button"
                  onClick={() => setVerificationCode(lastGeneratedCode)}
                  className="text-[11px] text-[#FACC15] underline mt-1 font-medium hover:text-yellow-300"
                >
                  Quick Fill Code
                </button>
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="• • • • • •"
                  className="w-full text-center tracking-[0.5em] text-2xl font-mono bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white rounded-xl py-3 placeholder-zinc-600 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || verificationCode.length !== 6}
                className="w-full bg-[#FACC15] hover:bg-[#eab308] text-black font-bold py-3 px-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 text-sm shadow-md shadow-yellow-500/10"
              >
                {isSubmitting ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>

            <div className="text-center pt-2">
              <p className="text-xs text-zinc-400">
                Didn't receive code?{' '}
                {resendTimer > 0 ? (
                  <span className="text-zinc-400 font-mono">
                    Resend in <span className="text-[#FACC15] font-semibold">{resendTimer}s</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-[#FACC15] font-semibold hover:underline"
                  >
                    Resend Code
                  </button>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SCREEN 3: LOGIN SCREEN                                       */}
        {/* ============================================================ */}
        {view === 'login' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView('welcome')}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                title="Back to Welcome"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Logo size="sm" />
              <div className="w-8" />
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white">Welcome back</h2>
              <p className="text-xs text-zinc-400 mt-1">Log into your Mehfil account</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Email or Username
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    placeholder="email@domain.com or username"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl py-2.5 pl-10 pr-4 placeholder-zinc-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-medium text-zinc-300">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] text-[#FACC15] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-zinc-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl py-2.5 pl-10 pr-10 placeholder-zinc-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-2.5 text-zinc-400 hover:text-white"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-[#FACC15] hover:bg-[#eab308] text-black font-bold py-3 px-4 rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 text-sm shadow-md shadow-yellow-500/10"
              >
                {isSubmitting ? 'Logging in...' : 'Log in'}
              </button>
            </form>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-zinc-800 w-full" />
              <span className="bg-zinc-950 px-3 text-xs text-zinc-400 uppercase tracking-wider absolute">
                or
              </span>
            </div>

            {/* Official Continue with Google Button */}
            <GoogleSignInButton
              onClick={handleGoogleAuth}
              text="Continue with Google"
              disabled={isSubmitting}
            />

            <p className="text-center text-xs text-zinc-400 pt-2">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setView('signup');
                  setSignupStep('form');
                  setErrorMessage(null);
                }}
                className="text-[#FACC15] font-semibold hover:underline"
              >
                Sign up
              </button>
            </p>
          </div>
        )}

        {/* ============================================================ */}
        {/* FORGOT PASSWORD MODAL / SCREEN                               */}
        {/* ============================================================ */}
        {view === 'forgot' && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setView('login');
                  setForgotStep('request');
                }}
                className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Logo size="sm" />
              <div className="w-8" />
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white">Reset Password</h2>
              <p className="text-xs text-zinc-400 mt-1">
                {forgotStep === 'request'
                  ? 'Enter your email or username to receive a reset code'
                  : 'Enter the 6-digit reset code and your new password'}
              </p>
            </div>

            {forgotStep === 'request' ? (
              <form onSubmit={handleForgotRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotIdentifier}
                    onChange={e => setForgotIdentifier(e.target.value)}
                    placeholder="Enter registered email or username"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl py-2.5 px-4 placeholder-zinc-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FACC15] hover:bg-[#eab308] text-black font-bold py-3 px-4 rounded-xl text-sm transition-all"
                >
                  {isSubmitting ? 'Sending code...' : 'Send Reset Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleForgotComplete} className="space-y-4">
                {demoResetCode && (
                  <div className="p-2 bg-yellow-950/40 border border-[#FACC15]/30 rounded-lg text-center text-xs">
                    <span className="text-zinc-400">Demo Code: </span>
                    <span className="font-mono font-bold text-[#FACC15]">{demoResetCode}</span>
                    <button
                      type="button"
                      onClick={() => setForgotCode(demoResetCode)}
                      className="block mx-auto text-[11px] text-[#FACC15] underline mt-0.5"
                    >
                      Fill Code
                    </button>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    6-digit Reset Code
                  </label>
                  <input
                    type="text"
                    required
                    value={forgotCode}
                    onChange={e => setForgotCode(e.target.value)}
                    placeholder="123456"
                    className="w-full font-mono text-center tracking-widest bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl py-2.5 px-4"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-zinc-900 border border-zinc-700 focus:border-[#FACC15] focus:outline-none text-white text-sm rounded-xl py-2.5 px-4"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#FACC15] hover:bg-[#eab308] text-black font-bold py-3 px-4 rounded-xl text-sm transition-all"
                >
                  {isSubmitting ? 'Updating...' : 'Set New Password'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
