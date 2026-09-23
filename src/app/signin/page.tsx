"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/atoms/Field";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("That email and password do not match an account.");
      setBusy(false);
      return;
    }
    window.location.href = "/editor";
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-muted/40 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-sm"
      >
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Map className="h-4 w-4" />
          </div>
          <span className="text-base font-semibold">MapCanva</span>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </Field>
        </div>

        {error && (
          <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="mt-4 w-full" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
