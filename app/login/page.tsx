"use client";

import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AlertCircleIcon,
  ViewIcon,
  ViewOffIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/shell/brand-mark";
import { useAdminLogin } from "@/services/auth/auth.queries";
import { safeNextPath } from "@/lib/next-param";
import { apiEnvironment } from "@/lib/env";

function FormAlert({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
    >
      <HugeiconsIcon icon={AlertCircleIcon} className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const searchParams = useSearchParams();
  const unauthorized = searchParams.get("error") === "unauthorized";
  const next = safeNextPath(searchParams.get("next"));
  const loginMutation = useAdminLogin();
  const env = apiEnvironment();

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(
      { email: email.trim().toLowerCase(), password },
      {
        onSuccess: () => {
          // Full navigation so the proxy sees the new session cookie.
          window.location.href = next;
        },
      },
    );
  };

  return (
    <main className="flex min-h-svh flex-col bg-background px-4">
      <div className="flex flex-1 items-center justify-center py-12">
        <div className="w-full max-w-[22rem]">
          <div className="mb-8">
            <div className="mb-6 flex items-center gap-2">
              <BrandMark className="size-6" />
              <span className="text-base font-semibold tracking-[-0.01em]">
                Ticketer Africa
              </span>
            </div>
            <h1 className="text-2xl font-semibold tracking-[-0.01em]">
              Sign in to the admin console
            </h1>
            <p className="mt-1.5 text-base text-muted-foreground">
              For Ticketer Africa staff. Use your admin account.
            </p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {unauthorized && (
              <FormAlert>
                That account doesn&apos;t have admin access. Sign in with a
                staff account.
              </FormAlert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="username"
                autoFocus
                inputMode="email"
                spellCheck={false}
                placeholder="you@ticketer.africa"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={loginMutation.isError || undefined}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={loginMutation.isError || undefined}
                  className="pr-11 md:pr-9"
                />
                <Button
                  type="button"
                  variant="muted"
                  size="icon-sm"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 active:-translate-y-1/2 active:scale-100"
                >
                  <HugeiconsIcon icon={showPassword ? ViewOffIcon : ViewIcon} />
                </Button>
              </div>
            </div>

            {loginMutation.isError && (
              <FormAlert>
                That email and password don&apos;t match an admin account.
              </FormAlert>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </div>

      {env !== "production" && (
        <p className="pb-6 text-center text-xs text-muted-foreground">
          Connected to the <span className="font-medium text-warning">{env}</span>{" "}
          API
        </p>
      )}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
