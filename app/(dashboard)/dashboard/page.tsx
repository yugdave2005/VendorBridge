"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { KPICard } from "@/components/modules/KPICard";
import { CardSkeleton } from "@/components/modules/SkeletonLoader";
import { 
  FileText, 
  FileSpreadsheet, 
  ShoppingCart, 
  Activity,
  IndianRupee
} from "lucide-react";
import { format } from "date-fns";

export default function DashboardPage() {
  const { data: session } = useSession();
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard-kpis"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/dashboard");
      if (!res.ok) throw new Error("Failed to fetch KPIs");
      return res.json();
    },
    enabled: !!session?.user,
  });

  const kpis = data?.data;

  // Format currency (INR)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Welcome back, {session?.user?.name}
        </h1>
        <p className="text-slate-500 mt-1">
          Here's what's happening with your procurement operations today.
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : isError ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-100">
          Failed to load dashboard metrics. Please try refreshing the page.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KPICard
            title={session?.user?.role === "VENDOR" ? "Invited RFQs" : "Total RFQs"}
            value={kpis?.rfqCount || 0}
            icon={FileText}
            description="All time RFQs"
          />
          <KPICard
            title="Active RFQs"
            value={kpis?.activeRfqCount || 0}
            icon={Activity}
            description="Currently published"
            trend={{ value: 12, isPositive: true, label: "vs last month" }}
          />
          <KPICard
            title={session?.user?.role === "VENDOR" ? "My Quotations" : "Total Quotations"}
            value={kpis?.quotationCount || 0}
            icon={FileSpreadsheet}
            description="Submitted quotes"
          />
          <KPICard
            title={session?.user?.role === "VENDOR" ? "PO Value (MTD)" : "Spend (MTD)"}
            value={formatCurrency(kpis?.poValue || 0)}
            icon={IndianRupee}
            description="Current month to date"
          />
        </div>
      )}

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Recent Activity</h2>
        
        {isLoading ? (
          <div className="space-y-4">
            <CardSkeleton />
          </div>
        ) : kpis?.recentActivity?.length > 0 ? (
          <div className="space-y-6">
            {kpis.recentActivity.map((activity: any) => (
              <div key={activity.id} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                  <span className="text-xs font-medium text-slate-500">
                    {activity.user?.name?.charAt(0) || "S"}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-900 font-medium">
                    {activity.action.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {activity.user?.name || "System"} • {format(new Date(activity.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-8">No recent activity found.</p>
        )}
      </div>
    </div>
  );
}

