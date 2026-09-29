import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Eye, EyeOff, ArrowRight, Building2 } from "lucide-react";
import LoginLayout from "@/components/auth/LoginLayout";
import { safeReturnTo } from "@/lib/authReturnTo";

function signInError(err) {
  const message = String(err?.message || "").toLowerCase();
  if (/invit.*expir/.test(message)) return "Your invitation has expired. Request a new invitation.";
  if (/inactive|disabled|not active|suspend/.test(message)) return "Your account is not currently active. Please contact an ALS Live administrator.";
  if (/invalid|incorrect|wrong|credential|password|unauthorized/.test(message)) return "Incorrect email address or password.";
  return "Sign-in is temporarily unavailable. Please try again.";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Post-login destination (e.g. the MCP OAuth consent page sends users here
  // with returnTo so the grant flow can resume). Same-origin paths only.
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(signInError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleALSLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginWithProvider("microsoft", returnTo);
    } catch (err) {
      setError("Sign-in with your Alliance account is temporarily unavailable. Please try again.");
      setLoading(false);
    }
  };

  return (
    <LoginLayout>
      {error && (
        <div role="alert" className="mb-5 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12"
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 h-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-primary"
            />
            Keep me signed in
          </label>
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              Sign in <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </form>
      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or<span className="h-px flex-1 bg-border" /></div>
        <Button type="button" variant="outline" className="w-full h-12" onClick={handleALSLogin} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
          Sign in with your Alliance account
        </Button>
      </div>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Received an ALS Live invitation?{" "}
        <Link to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")} className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          Activate your account
        </Link>
      </p>
    </LoginLayout>
  );
}