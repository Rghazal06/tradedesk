import Link from "next/link";

export default function Home() {
  const features = [
    "Instant Quotes",
    "Auto Invoicing",
    "WSIB Tracking",
    "Get Paid Fast",
  ];

  const plans = [
    { name: "Starter", price: "$99/month", description: "For solo contractors" },
    { name: "Pro", price: "$199/month", description: "For growing trade teams" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800/80">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
              TD
            </div>
            <span className="text-xl font-semibold tracking-tight">TradeDesk</span>
          </div>
          <Link
            href="/signup"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main>
        <section className="mx-auto w-full max-w-6xl px-6 pb-24 pt-20 text-center md:pt-28">
          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-bold tracking-tight md:text-6xl">
            Run Your Trade Business From Your Phone
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-pretty text-lg leading-8 text-slate-300">
            The only business software built specifically for Ontario
            contractors. Quoting, invoicing, WSIB tracking and payments in one
            place.
          </p>
          <div className="mt-10">
            <Link
              href="/signup"
              className="rounded-full bg-blue-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Get Started
            </Link>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Everything You Need To Run Operations
          </h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <article
                key={feature}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6"
              >
                <h3 className="text-lg font-semibold">{feature}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Built for Ontario tradespeople to manage work faster with less
                  paperwork.
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-semibold tracking-tight">
            Simple, Transparent Pricing
          </h2>
          <div className="mx-auto mt-10 grid max-w-4xl gap-6 md:grid-cols-2">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900 p-8"
              >
                <h3 className="text-2xl font-semibold">{plan.name}</h3>
                <p className="mt-4 text-4xl font-bold tracking-tight text-white">
                  {plan.price}
                </p>
                <p className="mt-3 text-slate-300">{plan.description}</p>
                <button className="mt-8 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200">
                  Choose {plan.name}
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="mt-16 border-t border-slate-800/80">
        <div className="mx-auto w-full max-w-6xl px-6 py-6 text-center text-sm text-slate-400">
          Copyright © {new Date().getFullYear()} TradeDesk. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
