"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Notice, Segmented, Spinner } from "@/components/qn/ui";
import { resetUserCache } from "@/lib/use-user";

type DemoAccount = { email: string; account_type?: string };

/** Same two fields for parents and students: username (or email) and password. */
export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [role, setRole] = useState<"parent" | "student">("parent");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState<DemoAccount[]>([]);

  useEffect(() => {
    fetch("/api/auth/demo-accounts")
      .then((r) => (r.ok ? r.json() : null))
      // The API returns its synthetic demo users (no passwords) only when it runs in demo mode.
      .then((b) =>
        setDemo(
          Array.isArray(b)
            ? b.map((u: { email: string; user_metadata?: { account_type?: string } }) => ({ email: u.email, account_type: u.user_metadata?.account_type }))
            : [],
        ),
      )
      .catch(() => null);
  }, []);

  const loginErr = tried && !login.trim() ? "Enter your username." : undefined;
  const pwErr = tried && !password ? "Enter your password." : undefined;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTried(true);
    setError(null);
    if (!login.trim() || !password) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ login, password }) });
      const body = await res.json().catch(() => ({}));
      if (res.ok) {
        resetUserCache();
        const next = params.get("next");
        router.push(next && next.startsWith("/") && !next.startsWith("//") ? next : "/home");
        return;
      }
      setError(body.detail || "Couldn’t sign in. Try again.");
    } catch {
      setError("You seem to be offline. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const demoFor = demo.find((d) => (role === "parent" ? d.account_type === "parent" : d.account_type !== "parent"));

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <h1 className="text-[26px] font-black md:text-[32px]">Welcome back</h1>
      <Segmented
        label="Log in as"
        value={role}
        onChange={(v) => {
          setRole(v);
          setTried(false);
        }}
        options={[
          { value: "parent", label: "I’m a parent" },
          { value: "student", label: "I’m a student" },
        ]}
        size="lg"
      />
      <Field
        label="Username"
        autoComplete="username"
        placeholder={role === "parent" ? "Username or email" : "e.g. nova_reads or your email"}
        value={login}
        onChange={(e) => setLogin(e.target.value)}
        error={loginErr}
      />
      <Field
        label="Password"
        type={showPw ? "text" : "password"}
        autoComplete="current-password"
        placeholder="Your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={pwErr}
        labelExtra={
          <button type="button" onClick={() => setShowPw((v) => !v)} aria-pressed={showPw} className="h-7 px-1 text-[13px] font-black text-brand-ink">
            {showPw ? "Hide" : "Show"}
          </button>
        }
      />
      {error && <Notice>{error}</Notice>}
      <Button type="submit" variant="brand" size="cta" disabled={busy}>
        {busy && <Spinner />}
        Log in
      </Button>
      {demoFor && (
        <Notice tone="info">
          Demo server: try <b className="break-all">{demoFor.email}</b> with the demo password from the backend README.{" "}
          <button type="button" className="font-black underline" onClick={() => setLogin(demoFor.email)}>
            Fill in
          </button>
        </Notice>
      )}
      <p className="text-center text-sm font-bold text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-black text-brand-ink">
          Create an account
        </Link>
      </p>
    </form>
  );
}
