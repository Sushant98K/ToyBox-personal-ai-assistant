'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { Input } from './input';
import { AgentWaveLoader } from './agent-wave-loader';
import { cn } from '@/lib/utils';
import { insforge } from '@/lib/insforge';
import {
  ChevronLeftIcon,
  AtSignIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  UserIcon,
  SparklesIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  Loader2Icon,
  ShieldCheckIcon,
  LogOutIcon,
  ArrowRightIcon,
  KeyRoundIcon,
} from 'lucide-react';
import { siteConfig } from '@/config';

interface AuthPageProps {
  initialMode?: 'sign-in' | 'sign-up';
  redirectTo?: string;
}

export function AuthPage(props: AuthPageProps) {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[var(--canvas)] flex items-center justify-center"><AgentWaveLoader label="Loading authentication…" /></div>}>
      <AuthPageContent {...props} />
    </React.Suspense>
  );
}

function AuthPageContent({ initialMode = 'sign-in', redirectTo = '/' }: AuthPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Mode state: 'sign-in' | 'sign-up' | 'verify-otp'
  const [mode, setMode] = useState<'sign-in' | 'sign-up' | 'verify-otp'>(
    searchParams?.get('mode') === 'signup' ? 'sign-up' : initialMode
  );

  // Form inputs
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isVerifyingExisting, setIsVerifyingExisting] = useState(true);

  // Check initial authentication and handle OAuth callbacks
  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        // insforge SDK auto-detects insforge_code in the URL and exchanges it
        const { data, error } = await insforge.auth.getCurrentUser();
        if (data?.user && isMounted) {
          setCurrentUser(data.user);
          // Sync with public.users table in database
          await syncUserWithDatabase(data.user, data.user.providers?.[0] || 'google');
        }
      } catch (err: any) {
        console.warn('Auth check notice:', err);
      } finally {
        if (isMounted) setIsVerifyingExisting(false);
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Save/Verify user in InsForge public.users table
  const syncUserWithDatabase = async (user: any, provider: string) => {
    try {
      const response = await fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, provider }),
      });
      const result = await response.json();
      if (result.success && result.isFirstTime) {
        setSuccessMessage('Welcome! Your profile has been created and verified in the database.');
      }
    } catch (err) {
      console.error('Failed to sync user to database:', err);
    }
  };

  // Handle Google OAuth
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setSocialLoading('google');
    try {
      const redirectUrl =
        typeof window !== 'undefined' && window.location.origin
          ? `${window.location.origin}/sign-in`
          : 'http://localhost:3000/sign-in';

      const { error } = await insforge.auth.signInWithOAuth('google', {
        redirectTo: redirectUrl,
        additionalParams: { prompt: 'select_account' },
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to authenticate with Google');
        setSocialLoading(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during Google sign in');
      setSocialLoading(null);
    }
  };

  // Handle Sign In with Email & Password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await insforge.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // If email not verified, offer to enter verification code
        if (error.message?.toLowerCase().includes('verify') || error.message?.toLowerCase().includes('not verified')) {
          setMode('verify-otp');
          setErrorMessage('Please verify your email address to continue.');
          try {
            await insforge.auth.resendVerificationEmail({ email: email.trim() });
          } catch (_) {}
          setLoading(false);
          return;
        }
        setErrorMessage(error.message || 'Invalid email or password');
        setLoading(false);
        return;
      }

      if (data?.user) {
        setCurrentUser(data.user);
        await syncUserWithDatabase(data.user, 'email');
        setSuccessMessage('Signed in successfully! Redirecting...');
        setTimeout(() => {
          router.push(redirectTo);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during sign in');
    } finally {
      setLoading(false);
    }
  };

  // Handle Sign Up with Email & Password
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const { data, error } = await insforge.auth.signUp({
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });

      if (error) {
        setErrorMessage(error.message || 'Failed to create account');
        setLoading(false);
        return;
      }

      // Backend requires email OTP verification
      setMode('verify-otp');
      setSuccessMessage('A 6-digit verification code has been sent to your email.');
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  // Handle Email OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 6) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await insforge.auth.verifyEmail({
        email: email.trim(),
        otp: otpCode.trim(),
      });

      if (error) {
        setErrorMessage(error.message || 'Invalid verification code');
        setLoading(false);
        return;
      }

      if (data?.user) {
        setCurrentUser(data.user);
        // Save verified user in public.users database table
        await syncUserWithDatabase(data.user, 'email');
        setSuccessMessage('Account verified and saved! Redirecting...');
        setTimeout(() => {
          router.push(redirectTo);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await insforge.auth.resendVerificationEmail({
        email: email.trim(),
      });
      if (error) {
        setErrorMessage(error.message || 'Failed to resend code');
      } else {
        setSuccessMessage('A fresh verification code has been dispatched to your email.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    setLoading(true);
    try {
      await insforge.auth.signOut();
      setCurrentUser(null);
      setSuccessMessage('You have been signed out.');
      setMode('sign-in');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to sign out');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen bg-[var(--canvas)] text-[var(--ink)] lg:grid lg:grid-cols-2 overflow-x-hidden transition-colors duration-200">
      {/* Left Aesthetic Showcase Panel (Mobbin Monochromatic & Vector Paths) */}
      <div className="relative hidden h-full flex-col justify-between border-r border-[var(--hairline)] bg-[var(--canvas-soft)] p-10 lg:flex overflow-hidden">
        {/* Subtle radial ambient highlights */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,var(--primary)_0%,transparent_70%)] opacity-10 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,var(--primary)_0%,transparent_70%)] opacity-5 blur-3xl" />
        </div>

        {/* Brand Lockup */}
        <div className="z-10 flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div
              className="w-8 h-8 bg-[var(--ink)] text-[var(--canvas)] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
              style={{ borderRadius: '30%' }}
            >
              <SparklesIcon className="w-4 h-4 text-[var(--canvas)]" />
            </div>
            <p className="text-xl font-bold tracking-tight text-[var(--ink)]">
              {siteConfig.name}
            </p>
          </Link>
        </div>

        {/* Dynamic Vector Floating Curves */}
        <div className="absolute inset-0 z-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>

        {/* Executive Testimonial Quote */}
        <div className="z-10 mt-auto rounded-[24px] border border-[var(--hairline-soft)] bg-[var(--raised)]/80 p-6 backdrop-blur-md">
          <blockquote className="space-y-3">
            <p className="text-base sm:text-lg font-normal text-[var(--ink)] leading-relaxed">
              &ldquo;My biggest dread every morning was opening WhatsApp to find 80 messages alongside 200 unread Slack notifications. ToyBox.ai synthesizes everything into an executive brief by 7:30 AM.&rdquo;
            </p>
            <footer className="flex items-center gap-3 pt-2 border-t border-[var(--hairline)]">
              <div
                className="w-8 h-8 bg-[var(--canvas-soft)] border border-[var(--hairline)] flex items-center justify-center font-bold text-xs text-[var(--ink)]"
                style={{ borderRadius: '30%' }}
              >
                MV
              </div>
              <div>
                <p className="font-semibold text-sm text-[var(--ink)]">Marcus Vance</p>
                <p className="text-xs text-[var(--text-muted)]">Managing Partner, Apex Ventures</p>
              </div>
            </footer>
          </blockquote>
        </div>
      </div>

      {/* Right Interaction Panel */}
      <div className="relative flex min-h-screen flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        {/* Top Navigation Row */}
        <div className="absolute top-6 left-6 z-20">
          <Button variant="ghost" size="sm" asChild className="rounded-full gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--ink)]">
            <Link href="/">
              <ChevronLeftIcon className="size-4" />
              <span>Back to Home</span>
            </Link>
          </Button>
        </div>

        <div className="mx-auto w-full max-w-sm space-y-6">
          {/* Mobile Brand Mark */}
          <div className="flex items-center gap-2.5 lg:hidden mb-2">
            <div
              className="w-7 h-7 bg-[var(--ink)] text-[var(--canvas)] flex items-center justify-center shrink-0"
              style={{ borderRadius: '30%' }}
            >
              <SparklesIcon className="w-3.5 h-3.5 text-[var(--canvas)]" />
            </div>
            <p className="text-xl font-bold tracking-tight text-[var(--ink)]">
              {siteConfig.name}
            </p>
          </div>

          {/* If already signed in: Display User Profile Badge */}
          {currentUser ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 text-center"
            >
              <div className="w-16 h-16 mx-auto bg-[var(--canvas-soft)] border border-[var(--hairline)] flex items-center justify-center text-2xl font-bold text-[var(--ink)] squircle-30">
                {currentUser.profile?.avatar_url ? (
                  <img
                    src={currentUser.profile.avatar_url}
                    alt={currentUser.email}
                    className="w-full h-full object-cover squircle-30"
                  />
                ) : (
                  (currentUser.name?.[0] || currentUser.email?.[0] || 'U').toUpperCase()
                )}
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--canvas-soft)] border border-[var(--hairline)] text-xs font-semibold text-[var(--ink)] mb-2">
                  <ShieldCheckIcon className="size-3.5 text-[#0066ff]" />
                  <span>Authenticated via InsForge</span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)]">
                  Welcome back, {currentUser.name || currentUser.email?.split('@')[0]}
                </h1>
                <p className="text-sm text-[var(--text-muted)]">
                  {currentUser.email}
                </p>
              </div>

              {/* Status Alert */}
              <div className="p-4 rounded-[16px] bg-[var(--canvas-soft)] border border-[var(--hairline)] text-xs text-[var(--text-muted)] text-left space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                  <CheckCircle2Icon className="size-4 text-emerald-500" />
                  <span>InsForge Database Synchronized</span>
                </div>
                <p>
                  Your profile and session credentials have been verified and recorded in the <code className="text-[var(--ink)] font-mono">public.users</code> database table.
                </p>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <Button asChild size="lg" className="w-full">
                  <Link href="/">
                    <span>Continue to Workspace</span>
                    <ArrowRightIcon className="size-4 ml-1.5" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={handleSignOut}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2Icon className="size-4 animate-spin mr-2" />
                  ) : (
                    <LogOutIcon className="size-4 mr-2" />
                  )}
                  <span>Sign Out</span>
                </Button>
              </div>
            </motion.div>
          ) : (
            <>
              {/* Header Titles */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--ink)]">
                  {mode === 'verify-otp'
                    ? 'Verify Your Email'
                    : mode === 'sign-up'
                    ? 'Create Your Account'
                    : 'Sign In to ToyBox.ai'}
                </h1>
                <p className="text-sm text-[var(--text-muted)]">
                  {mode === 'verify-otp'
                    ? `Enter the 6-digit confirmation code dispatched to ${email}`
                    : mode === 'sign-up'
                    ? 'Join ToyBox.ai to distill multi-platform communication.'
                    : 'Welcome back. Access your executive inbox & autonomous agents.'}
                </p>
              </div>

              {/* Segmented Control Pill (Sign In / Sign Up toggle) */}
              {mode !== 'verify-otp' && (
                <div className="p-1 bg-[var(--canvas-soft)] border border-[var(--hairline)] rounded-full flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('sign-in');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={cn(
                      'flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-150',
                      mode === 'sign-in'
                        ? 'bg-[var(--raised)] text-[var(--ink)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--ink)]'
                    )}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('sign-up');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={cn(
                      'flex-1 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all duration-150',
                      mode === 'sign-up'
                        ? 'bg-[var(--raised)] text-[var(--ink)] shadow-sm'
                        : 'text-[var(--text-muted)] hover:text-[var(--ink)]'
                    )}
                  >
                    Sign Up
                  </button>
                </div>
              )}

              {/* Feedback messages */}
              <AnimatePresence mode="wait">
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-3.5 rounded-[16px] bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-start gap-2.5"
                  >
                    <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="p-3.5 rounded-[16px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-start gap-2.5"
                  >
                    <CheckCircle2Icon className="size-4 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Social OAuth Actions (Google Gmail) */}
              {mode !== 'verify-otp' && (
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    disabled={socialLoading !== null || loading}
                    onClick={handleGoogleSignIn}
                    className="w-full relative justify-center bg-[var(--canvas-soft)] hover:bg-[var(--raised)] border-[var(--hairline)] text-[var(--ink)] font-semibold transition-all"
                  >
                    {socialLoading === 'google' ? (
                      <Loader2Icon className="size-4 animate-spin mr-2.5" />
                    ) : (
                      <GoogleIcon className="size-4 mr-2.5 shrink-0" />
                    )}
                    <span>Continue with Google</span>
                  </Button>

                  {/* Visual Divider */}
                  <div className="flex w-full items-center justify-center py-2">
                    <div className="bg-[var(--hairline)] h-px w-full" />
                    <span className="text-[var(--text-faint)] px-3 text-[11px] font-mono tracking-widest uppercase">
                      Or with email
                    </span>
                    <div className="bg-[var(--hairline)] h-px w-full" />
                  </div>
                </div>
              )}

              {/* Email / Password / OTP Forms */}
              {mode === 'verify-otp' ? (
                /* OTP Verification Form */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ink)]">
                      Verification Code
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="123456"
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="peer text-center font-mono text-lg tracking-widest pl-10"
                      />
                      <div className="text-[var(--text-faint)] pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3.5">
                        <KeyRoundIcon className="size-4" />
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] pt-0.5">
                      Check your inbox for the 6-digit code sent by InsForge.
                    </p>
                  </div>

                  <Button type="submit" size="lg" disabled={loading} className="w-full">
                    {loading ? (
                      <Loader2Icon className="size-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2Icon className="size-4 mr-2" />
                    )}
                    <span>Verify & Continue</span>
                  </Button>

                  <div className="flex items-center justify-between pt-2 text-xs">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-[var(--text-muted)] hover:text-[var(--ink)] underline underline-offset-4 transition-colors"
                    >
                      Resend Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('sign-in')}
                      className="text-[var(--text-muted)] hover:text-[var(--ink)] transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                /* Sign In / Sign Up Form */
                <form onSubmit={mode === 'sign-in' ? handleSignIn : handleSignUp} className="space-y-3.5">
                  {/* Name field for Sign Up */}
                  {mode === 'sign-up' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--ink)]">
                        Full Name
                      </label>
                      <div className="relative">
                        <Input
                          placeholder="Elena Rostova"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="peer ps-10"
                        />
                        <div className="text-[var(--text-faint)] pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3.5">
                          <UserIcon className="size-4" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Email field */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--ink)]">
                      Email Address
                    </label>
                    <div className="relative">
                      <Input
                        placeholder="elena@company.com"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="peer ps-10"
                      />
                      <div className="text-[var(--text-faint)] pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3.5">
                        <AtSignIcon className="size-4" />
                      </div>
                    </div>
                  </div>

                  {/* Password field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[var(--ink)]">
                        Password
                      </label>
                      {mode === 'sign-in' && (
                        <span className="text-[11px] text-[var(--text-muted)]">
                          Min. 6 characters
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Input
                        placeholder="••••••••••••"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="peer ps-10 pe-10"
                      />
                      <div className="text-[var(--text-faint)] pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3.5">
                        <LockIcon className="size-4" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[var(--text-faint)] hover:text-[var(--ink)] absolute inset-y-0 end-0 flex items-center justify-center pe-3.5 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="size-4" />
                        ) : (
                          <EyeIcon className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    disabled={loading || socialLoading !== null}
                    className="w-full mt-2"
                  >
                    {loading ? (
                      <Loader2Icon className="size-4 animate-spin mr-2" />
                    ) : (
                      <ArrowRightIcon className="size-4 mr-2" />
                    )}
                    <span>
                      {mode === 'sign-in' ? 'Sign In with Email' : 'Create Account'}
                    </span>
                  </Button>
                </form>
              )}

              {/* Mode switch helper text */}
              <div className="text-center text-xs text-[var(--text-muted)] pt-2">
                {mode === 'sign-in' ? (
                  <p>
                    Don&apos;t have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('sign-up');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="font-semibold text-[var(--ink)] underline underline-offset-4 hover:opacity-80 transition-opacity"
                    >
                      Sign up for free
                    </button>
                  </p>
                ) : mode === 'sign-up' ? (
                  <p>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('sign-in');
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="font-semibold text-[var(--ink)] underline underline-offset-4 hover:opacity-80 transition-opacity"
                    >
                      Sign in instead
                    </button>
                  </p>
                ) : null}
              </div>

              {/* Terms & Privacy */}
              <p className="text-center text-[11px] text-[var(--text-faint)] leading-relaxed">
                By continuing, you agree to ToyBox.ai&apos;s{' '}
                <a href="#terms" className="underline underline-offset-2 hover:text-[var(--ink)] transition-colors">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#privacy" className="underline underline-offset-2 hover:text-[var(--ink)] transition-colors">
                  Privacy Policy
                </a>
                . Zero-retention and end-to-end encrypted.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

// Background Floating SVG Paths with micro-animations
function FloatingPaths({ position }: { position: number }) {
  const paths = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    d: `M-${380 - i * 5 * position} -${189 + i * 6}C-${
      380 - i * 5 * position
    } -${189 + i * 6} -${312 - i * 5 * position} ${216 - i * 6} ${
      152 - i * 5 * position
    } ${343 - i * 6}C${616 - i * 5 * position} ${470 - i * 6} ${
      684 - i * 5 * position
    } ${875 - i * 6} ${684 - i * 5 * position} ${875 - i * 6}`,
    width: 0.5 + i * 0.03,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <svg
        className="h-full w-full text-[var(--ink)] opacity-20 dark:opacity-35"
        viewBox="0 0 696 316"
        fill="none"
      >
        <title>Background Paths</title>
        {paths.map((path) => (
          <motion.path
            key={path.id}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.width}
            strokeOpacity={0.12 + path.id * 0.02}
            initial={{ pathLength: 0.3, opacity: 0.5 }}
            animate={{
              pathLength: 1,
              opacity: [0.25, 0.6, 0.25],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 22 + (path.id % 5) * 2.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'linear',
            }}
          />
        ))}
      </svg>
    </div>
  );
}

// Google SVG Icon
function GoogleIcon(props: React.ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}
