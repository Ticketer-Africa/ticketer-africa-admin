"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminLogin } from "@/services/auth/auth.queries";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const searchParams = useSearchParams();
  const unauthorized = searchParams.get("error") === "unauthorized";
  const loginMutation = useAdminLogin();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { email: email.toLowerCase(), password },
      {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-10 items-center justify-center rounded-md border border-border font-mono text-sm text-primary">
            TA
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Ticketera Admin
            </h1>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Staff access only
            </p>
          </div>
        </div>

        <div className="space-y-5 rounded-xl border border-border bg-card p-6">
          {unauthorized && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              That account doesn&apos;t have admin access.
            </p>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {loginMutation.isError && (
              <p className="text-sm text-destructive">
                Invalid email or password.
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
