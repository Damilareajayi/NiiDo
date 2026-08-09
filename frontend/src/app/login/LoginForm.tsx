"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ConfirmationResult } from "firebase/auth";
import { AsYouType, parsePhoneNumberFromString, CountryCode } from "libphonenumber-js";
import { useAuth } from "@/hooks/useAuth";
import { useLang } from "@/hooks/useLang";
import { COUNTRIES } from "@/lib/constants";
import { CountrySelect } from "@/components/ui/CountrySelect";
import { hasCompleteProfile, identityLabel } from "@/lib/authRouting";
import { Eye, EyeOff, Loader2, Phone, Mail } from "lucide-react";

function formatAuthError(error: string): string {
  const code = error.toLowerCase();
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) {
    return "Incorrect email or password. Please double-check your credentials and try again.";
  }
  if (code.includes("invalid-email")) {
    return "That email address doesn't look quite right. Please check the spelling.";
  }
  if (code.includes("too-many-requests")) {
    return "Too many unsuccessful attempts. Please wait a few moments before trying again to keep your account safe.";
  }
  if (code.includes("user-disabled")) {
    return "This account has been disabled. Please contact your school administrator.";
  }
  if (code.includes("network-request-failed")) {
    return "Connection error. Please check your internet connection and try again.";
  }
  if (code.includes("invalid-verification-code") || code.includes("code-expired") || code.includes("invalid verification code")) {
    return "The SMS verification code is incorrect or has expired. Please request a new code.";
  }
  if (code.includes("captcha") || code.includes("recaptcha")) {
    return "Security verification failed. Please refresh and try again.";
  }
  return error;
}

export default function LoginForm() {
  const {
    login, loginWithGoogle, sendPhoneOtp, confirmPhoneOtp, loading, error, firebaseUser, user, logout,
    googleLinkEmail, linkGoogleAccount, cancelGoogleLink, justCompletedRedirectSignIn,
  } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [countryIso, setCountryIso] = useState<string>(COUNTRIES[0].iso);
  const [phoneNumber, setPhoneNumber] = useState("");
  const country = COUNTRIES.find((c) => c.iso === countryIso) || COUNTRIES[0];
  const [otpCode, setOtpCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  // True only when THIS page instance just performed a sign-in action —
  // as opposed to the effect below seeing an already-authenticated session
  // that was simply sitting there when the page loaded (e.g. someone
  // navigated to /login while already signed in). A fresh sign-in should
  // continue straight into the app; an already-open session should ask
  // first, so users always have a way to switch accounts instead of being
  // silently bounced back into whichever account happened to be active.
  const [justSignedIn, setJustSignedIn] = useState(false);

  // Google sign-in is a full-page redirect (see useAuth), so this page
  // remounts fresh on the way back from it — justSignedIn can't have
  // survived that as local state. justCompletedRedirectSignIn is the
  // AuthProvider-level signal that survives it instead.
  useEffect(() => {
    if (justCompletedRedirectSignIn) setJustSignedIn(true);
  }, [justCompletedRedirectSignIn]);

  useEffect(() => {
    if (loading || !firebaseUser) return;
    if (!hasCompleteProfile(user)) {
      router.replace(`/complete-profile?next=${encodeURIComponent(next)}`);
    } else if (justSignedIn) {
      router.replace(next);
    }
  }, [firebaseUser, user, loading, justSignedIn, router, next]);

  const showContinueAs = !loading && firebaseUser && hasCompleteProfile(user) && !justSignedIn;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      setJustSignedIn(true);
    } catch {
      // Error shown via auth context
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    setLocalError(null);
    try {
      // Navigates the whole tab to Google — this only throws if the
      // redirect itself couldn't start. Success, failure, and the
      // account-link collision are all handled after returning, by the
      // getRedirectResult effect in useAuth.
      await loginWithGoogle();
    } catch {
      // Error shown via auth context
      setSubmitting(false);
    }
  };

  const handleLinkGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await linkGoogleAccount(linkPassword);
      setJustSignedIn(true);
    } catch {
      // Error shown via auth context
    } finally {
      setSubmitting(false);
    }
  };

  const fullPhoneNumber =
    parsePhoneNumberFromString(phoneNumber, countryIso as CountryCode)?.format("E.164")
    || `${country.dialCode}${phoneNumber.replace(/\D/g, "")}`;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try {
      const result = await sendPhoneOtp(fullPhoneNumber, "recaptcha-container");
      setConfirmation(result);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmation) return;
    setSubmitting(true);
    setLocalError(null);
    try {
      await confirmPhoneOtp(confirmation, otpCode);
      setJustSignedIn(true);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left — brand hero panel (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-navy items-center justify-center p-12">
        <div className="absolute -right-24 top-10 w-96 h-96 rounded-full bg-sky-400 opacity-10 blur-3xl" />
        <div className="absolute left-0 -bottom-24 w-80 h-80 rounded-full bg-coral-500 opacity-10 blur-3xl" />
        <Link href="/" className="absolute bottom-0 right-8 z-10">
          <img
            src="/mascot/mascot-waving.png"
            alt="Back to NiiDo home"
            className="w-40 xl:w-48 h-auto select-none drop-shadow-2xl"
          />
        </Link>
        <div className="relative z-10 max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Link href="/">
              <img src="/niido-icon-mark.svg" alt="Back to NiiDo home" className="w-10 h-10 mb-6" />
            </Link>
            <h1 className="font-display text-6xl leading-none">
              <span className="font-bold text-brand-400">nıı</span>
              <span className="font-light text-brand-100">do</span>
            </h1>
            <p className="text-coral-400 text-xs font-semibold tracking-[0.25em] uppercase mt-4">
              {t.tagline}
            </p>
            <p className="text-brand-200/50 text-xs tracking-wide mt-1">by LearnScape Africa</p>

            <p className="text-brand-100/70 text-base mt-10 leading-relaxed">
              One platform, three ways to reach every learner — an adaptive assessment for
              students, an AI lesson planner for teachers, and a live pulse for school leaders.
            </p>
            <div className="flex flex-wrap gap-2 mt-6">
              <span className="badge-read">{t.modules.read}</span>
              <span className="badge-teach">{t.modules.teach}</span>
              <span className="badge-pulse">{t.modules.pulse}</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col bg-stone-50">
        <div className="flex-1 flex items-center justify-center px-4 pb-16 pt-16">
          <motion.div
            className="w-full max-w-md"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1, ease: "easeOut" }}
          >
            {/* Logo — mobile only, since the hero panel is hidden below lg */}
            <div className="text-center mb-10 lg:hidden">
              <Link href="/" className="inline-block">
                <img src="/niido-wordmark.svg" alt={t.appName} className="h-14 mx-auto mb-4" />
              </Link>
              <p className="text-stone-500 mt-2 text-sm leading-relaxed max-w-xs mx-auto">
                {t.tagline}
              </p>
            </div>

            <div className="card p-8">
              {showContinueAs ? (
                <>
                  <h2 className="text-xl font-display font-semibold text-stone-900 mb-1">
                    Welcome back
                  </h2>
                  <p className="text-stone-500 text-sm mb-6">
                    You&apos;re already signed in as <strong>{identityLabel(firebaseUser)}</strong>.
                  </p>
                  <button
                    type="button"
                    onClick={() => router.replace(next)}
                    className="btn-brand w-full flex items-center justify-center gap-2 py-3 mb-3"
                  >
                    Continue
                  </button>
                  <button
                    type="button"
                    onClick={() => logout()}
                    className="w-full text-center text-stone-400 text-xs hover:text-stone-600"
                  >
                    Not you? Sign out and use a different account
                  </button>
                </>
              ) : (
              <>
              <h2 className="text-xl font-display font-semibold text-stone-900 mb-1">
                {t.auth.loginTitle}
              </h2>
              <p className="text-stone-500 text-sm mb-6">
                {t.auth.loginSubtitle}
              </p>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={submitting || loading}
                className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl border border-stone-300
                           font-semibold text-sm text-stone-700 hover:bg-stone-50 transition-all mb-4"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="h-px bg-stone-200 flex-1" />
                <span className="text-xs text-stone-400">or</span>
                <div className="h-px bg-stone-200 flex-1" />
              </div>

              {/* Email / Phone tabs — hidden while linking a Google credential to an
                  existing password account, since neither tab applies to that flow */}
              <div className={`flex gap-1 mb-4 bg-stone-100 p-1 rounded-xl ${googleLinkEmail ? "hidden" : ""}`}>
                <button type="button" onClick={() => setMode("email")}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg transition-all
                    ${mode === "email" ? "bg-white shadow-sm text-stone-900" : "text-stone-500"}`}>
                  <Mail className="w-3.5 h-3.5" /> Email
                </button>
                <button type="button" onClick={() => setMode("phone")}
                  className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg transition-all
                    ${mode === "phone" ? "bg-white shadow-sm text-stone-900" : "text-stone-500"}`}>
                  <Phone className="w-3.5 h-3.5" /> Phone
                </button>
              </div>

              {/* Kept mounted for the page's whole lifetime — Firebase's RecaptchaVerifier
                  is cached against this exact DOM node, and re-mounting it (e.g. by
                  conditionally rendering it inside the phone sub-forms) breaks that cache
                  and throws "reCAPTCHA has already been rendered in this element". */}
              <div id="recaptcha-container" />

              {googleLinkEmail ? (
                <form onSubmit={handleLinkGoogle} className="space-y-5">
                  <div className="bg-sky-50 border border-sky-200 text-sky-800 text-sm px-4 py-3.5 rounded-xl leading-relaxed">
                    You already have an account for <strong>{googleLinkEmail}</strong> signed in with
                    a password. Enter it once below to connect Google — after that, either option
                    signs you in.
                  </div>
                  <div>
                    <label className="label">Password</label>
                    <input
                      type="password"
                      className="input"
                      placeholder="••••••••"
                      value={linkPassword}
                      onChange={(e) => setLinkPassword(e.target.value)}
                      required
                      autoFocus
                      autoComplete="current-password"
                    />
                  </div>

                  {error && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3.5 rounded-xl font-medium">
                      {formatAuthError(error)}
                    </div>
                  )}

                  <button type="submit" disabled={submitting || loading}
                    className="btn-brand w-full flex items-center justify-center gap-2 py-3">
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Linking...</>
                      : "Link Google Account"}
                  </button>
                  <button type="button"
                    onClick={() => { cancelGoogleLink(); setLinkPassword(""); }}
                    className="w-full text-center text-stone-400 text-xs">
                    Cancel
                  </button>
                </form>
              ) : mode === "email" ? (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="label">{t.auth.email}</label>
                    <input
                      type="email"
                      className="input"
                      placeholder="teacher@school.edu.ng"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label className="label">{t.auth.password}</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="input pr-11"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                      />
                      <button type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3.5 rounded-xl font-medium"
                    >
                      {formatAuthError(error)}
                    </motion.div>
                  )}

                  <button type="submit" disabled={submitting || loading}
                    className="btn-brand w-full flex items-center justify-center gap-2 py-3">
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</>
                      : t.auth.login}
                  </button>
                </form>
              ) : !confirmation ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label className="label">Phone number</label>
                    <div className="flex gap-2">
                      <CountrySelect
                        value={countryIso}
                        onChange={(iso) => {
                          setCountryIso(iso);
                          setPhoneNumber(""); // previous formatting no longer matches the new country
                        }}
                      />
                      <input
                        type="tel"
                        className="input flex-1"
                        placeholder="801 234 5678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(new AsYouType(countryIso as CountryCode).input(e.target.value))}
                        required
                      />
                    </div>
                    <p className="text-xs text-stone-400 mt-1.5">Select your country, then enter your number without the code</p>
                  </div>

                  {localError && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3.5 rounded-xl font-medium">
                      {formatAuthError(localError)}
                    </div>
                  )}

                  <button type="submit" disabled={submitting}
                    className="btn-brand w-full flex items-center justify-center gap-2 py-3">
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending code...</>
                      : "Send Verification Code"}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div>
                    <label className="label">Enter the 6-digit code</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="input text-center tracking-[0.3em] text-lg"
                      placeholder="000000"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      required
                    />
                    <p className="text-xs text-stone-400 mt-1.5">Sent to {fullPhoneNumber}</p>
                  </div>

                  {localError && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3.5 rounded-xl font-medium">
                      {formatAuthError(localError)}
                    </div>
                  )}

                  <button type="submit" disabled={submitting}
                    className="btn-brand w-full flex items-center justify-center gap-2 py-3">
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</>
                      : "Verify & Sign In"}
                  </button>
                  <button type="button" onClick={() => setConfirmation(null)}
                    className="w-full text-center text-stone-400 text-xs">
                    Use a different number
                  </button>
                </form>
              )}

              <p className="text-center text-stone-400 text-xs mt-6">
                {t.auth.noAccount}{" "}
                <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-brand-600 font-medium">
                  Create one for free
                </Link>
              </p>
              </>
              )}
            </div>

            {/* Module pills — mobile only, hero panel already shows these on desktop */}
            <div className="flex justify-center gap-2 mt-8 lg:hidden">
              <span className="badge-read">{t.modules.read}</span>
              <span className="badge-teach">{t.modules.teach}</span>
              <span className="badge-pulse">{t.modules.pulse}</span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
