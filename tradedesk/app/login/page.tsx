"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800/80">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
              TD
            </div>
            <span className="text-xl font-semibold tracking-tight">TradeDesk</span>
          </Link>
          <Link
            href="/signup"
            className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-slate-500"
          >
            Create Account
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl justify-center px-6 py-16">
        <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl shadow-slate-950/40">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-3 text-slate-300">
            Sign in to continue managing your business with TradeDesk.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSignIn}>
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {errorMessage ? (
            <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {errorMessage}
            </p>
          ) : null}

          <p className="mt-6 text-center text-sm text-slate-300">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-blue-400 transition hover:text-blue-300"
            >
              Create one
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
