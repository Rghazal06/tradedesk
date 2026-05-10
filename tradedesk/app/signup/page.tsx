import Link from "next/link";

const tradeOptions = [
  "Electrician",
  "Plumber",
  "HVAC",
  "General Contractor",
  "Roofer",
  "Other",
];

export default function SignupPage() {
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
            href="/login"
            className="rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-slate-500"
          >
            Sign In
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl justify-center px-6 py-16">
        <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl shadow-slate-950/40">
          <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-3 text-slate-300">
            Start running your trade business with TradeDesk.
          </p>

          <form className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="John Smith"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="tradeType"
                className="mb-2 block text-sm font-medium text-slate-200"
              >
                Trade Type
              </label>
              <select
                id="tradeType"
                defaultValue=""
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="" disabled>
                  Select your trade
                </option>
                {tradeOptions.map((trade) => (
                  <option key={trade} value={trade}>
                    {trade}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Create Account
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-300">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
