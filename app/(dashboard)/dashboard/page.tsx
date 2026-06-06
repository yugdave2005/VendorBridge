import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const roleLabels: Record<string, string> = {
    ADMIN: "System Administrator",
    PROCUREMENT_OFFICER: "Procurement Officer",
    VENDOR: "Vendor",
    MANAGER: "Manager",
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-blue-500/25">
            {session.user.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Welcome, {session.user.name}!
            </h1>
            <p className="text-slate-500 text-sm">
              {roleLabels[session.user.role] ?? session.user.role} •{" "}
              {session.user.email}
            </p>
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <svg
            className="w-6 h-6 text-green-500 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h2 className="font-medium text-green-800">
              Authentication Successful
            </h2>
            <p className="text-green-700 text-sm mt-1">
              Phase 1 complete — Login, session management, and role-based access
              are working. The full dashboard with KPIs, navigation, and
              module-specific views will be built in Phase 2.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-slate-500 mb-1">User ID</p>
            <p className="font-mono text-slate-700 text-xs break-all">
              {session.user.id}
            </p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-slate-500 mb-1">Role</p>
            <p className="font-medium text-slate-700">{session.user.role}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
