"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Eye, Mail, Lock, User, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function getSignupErrorMessage(errorMessage: string): string {
  const lowerMessage = errorMessage.toLowerCase();

  if (
    lowerMessage.includes("email rate limit exceeded") ||
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("over_email_send_rate_limit") ||
    lowerMessage.includes("too many requests") ||
    lowerMessage.includes("too many signups")
  ) {
    return "Too many signup attempts. Please wait a while before trying again.";
  }

  if (lowerMessage.includes("invalid email") || lowerMessage.includes("email address is invalid")) {
    return "Please enter a valid email address.";
  }

  if (lowerMessage.includes("password") && (lowerMessage.includes("short") || lowerMessage.includes("characters") || lowerMessage.includes("weak"))) {
    return "Password must meet the minimum requirements.";
  }

  if (
    lowerMessage.includes("already registered") ||
    lowerMessage.includes("already exists") ||
    lowerMessage.includes("user already exists") ||
    lowerMessage.includes("duplicate") ||
    lowerMessage.includes("already been registered")
  ) {
    return "An account with this email may already exist. Try logging in instead.";
  }

  return errorMessage;
}

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isSubmitting = useRef(false);

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting.current || loading) return;

    isSubmitting.current = true;
    setLoading(true);
    setError(null);

    if (!email || !email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address.");
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    if (password.length < 6) {
      setError("Password must meet the minimum requirements.");
      setLoading(false);
      isSubmitting.current = false;
      return;
    }

    const supabase = createClient();

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        if (process.env.NODE_ENV === "development") {
          console.log("[CivicEye] Signup error:", signUpError.message);
        }
        setError(getSignupErrorMessage(signUpError.message));
        setLoading(false);
        isSubmitting.current = false;
        return;
      }

      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          email: email.trim().toLowerCase(),
          role: "citizen",
        }, {
          onConflict: "id",
        });

        if (profileError) {
          if (process.env.NODE_ENV === "development") {
            console.log("[CivicEye] Profile creation error:", profileError.message);
          }
        }
      }

      setSuccess(true);
      setLoading(false);
      isSubmitting.current = false;
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.log("[CivicEye] Signup exception:", err instanceof Error ? err.message : err);
      }
      const message = err instanceof Error ? err.message : "Unable to connect to CivicEye. Please try again.";
      if (message.toLowerCase().includes("fetch") || message.toLowerCase().includes("network") || message.toLowerCase().includes("load failed")) {
        setError("Unable to connect to CivicEye. Please check your internet connection and try again.");
      } else {
        setError(getSignupErrorMessage(message));
      }
      setLoading(false);
      isSubmitting.current = false;
    }
  }, [email, password, confirmPassword, fullName, loading]);

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Eye className="w-6 h-6 text-blue-500" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                CivicEye
              </span>
            </Link>
          </div>

          <Card className="bg-[#1e2433] border-[#2e3548]">
            <CardContent className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Account Created Successfully!</h3>
              <p className="text-slate-400 mb-6">
                You can now log in to your CivicEye account.
              </p>
              <Link href="/login">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Eye className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              CivicEye
            </span>
          </Link>
        </div>

        <Card className="bg-[#1e2433] border-[#2e3548]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Create Account</CardTitle>
            <CardDescription>Join CivicEye to report and track civic issues</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-sm text-red-400">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 bg-[#0f1419] border-[#2e3548]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="pl-10 bg-[#0f1419] border-[#2e3548]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    className="pl-10 bg-[#0f1419] border-[#2e3548]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    disabled={loading}
                    className="pl-10 bg-[#0f1419] border-[#2e3548]"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-400">
                Already have an account?{" "}
                <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
