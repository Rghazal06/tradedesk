import Link from "next/link";

const navLinks = [
  "Dashboard",
  "Quotes",
  "Invoices",
  "Jobs",
  "WSIB Tracking",
  "Settings",
];

const stats = [
  { label: "Total Quotes This Month", value: "24" },
  { label: "Unpaid Invoices", value: "7" },
  { label: "Active Jobs", value: "13" },
  { label: "Revenue This Month", value: "$48,200" },
];

const recentActivity = [
  {
    item: "Kitchen Rewire - Quote #Q-1048",
    type: "Quote",
    status: "Sent",
    date: "May 10, 2026",
  },
  {
    item: "Furnace Installation - Job #J-338",
    type: "Job",
    status: "In Progress",
    date: "May 9, 2026",
  },
  {
    item: "Bathroom Plumbing - Quote #Q-1041",
    type: "Quote",
    status: "Approved",
    date: "May 8, 2026",
  },
  {
    item: "Roof Repair - Job #J-331",
    type: "Job",
    status: "Scheduled",
    date: "May 7, 2026",
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col lg:flex-row">
        <aside className="w-full border-b border-slate-800 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3 px-6 py-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">
              TD
            </div>
            <span className="text-xl font-semibold tracking-tight">TradeDesk</span>
          </div>

          <nav className="grid grid-cols-2 gap-2 px-4 pb-5 lg:grid-cols-1 lg:px-3">
            {navLinks.map((link) => (
              <Link
                key={link}
                href="#"
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  link === "Dashboard"
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`}
              >
                {link}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex-1">
          <header className="border-b border-slate-800">
            <div className="flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back, Contractor
              </h1>
              <button className="w-full rounded-full border border-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-slate-500 sm:w-auto">
                Logout
              </button>
            </div>
          </header>

          <main className="px-6 py-6">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-semibold text-slate-200">
                Business Snapshot
              </h2>
              <button className="w-full rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 sm:w-auto">
                New Quote
              </button>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <article
                  key={stat.label}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-5"
                >
                  <p className="text-sm text-slate-300">{stat.label}</p>
                  <p className="mt-3 text-3xl font-bold tracking-tight">{stat.value}</p>
                </article>
              ))}
            </section>

            <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Activity</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-300">
                      <th className="px-3 py-3 font-medium">Item</th>
                      <th className="px-3 py-3 font-medium">Type</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((activity) => (
                      <tr
                        key={activity.item}
                        className="border-b border-slate-800/80 text-slate-100 last:border-0"
                      >
                        <td className="px-3 py-3">{activity.item}</td>
                        <td className="px-3 py-3">{activity.type}</td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs text-slate-200">
                            {activity.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-slate-300">{activity.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
