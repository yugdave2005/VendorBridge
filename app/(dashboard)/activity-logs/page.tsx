"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/modules/DataTable";
import { TableSkeleton } from "@/components/modules/SkeletonLoader";
import { StatusBadge } from "@/components/modules/StatusBadge";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";

export default function ActivityLogsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["activity-logs"],
    queryFn: async () => {
      const res = await fetch("/api/activity-logs?limit=100");
      if (!res.ok) throw new Error("Failed to fetch activity logs");
      return res.json();
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="text-slate-500 whitespace-nowrap">
          {format(new Date(row.original.createdAt), "PPp")}
        </span>
      ),
    },
    {
      accessorKey: "user.name",
      header: "User",
      cell: ({ row }) => (
        <span className="font-medium text-slate-700">
          {row.original.user?.name || "System Auto"}
        </span>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <StatusBadge status={row.original.action} />
      ),
    },
    {
      accessorKey: "entityType",
      header: "Entity",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900">{row.original.entityType}</span>
      ),
    },
    {
      accessorKey: "metadata",
      header: "Details",
      cell: ({ row }) => {
        const meta = row.original.metadata;
        if (!meta || Object.keys(meta).length === 0) return <span className="text-slate-400">-</span>;
        return (
          <pre className="text-[10px] bg-slate-50 border border-slate-100 p-1.5 rounded text-slate-600 max-w-xs overflow-x-auto">
            {JSON.stringify(meta, null, 2)}
          </pre>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Audit Logs</h1>
          <p className="text-slate-500 text-sm mt-1">Immutable record of all state transitions and system actions</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {isLoading ? (
          <TableSkeleton rows={10} cols={5} />
        ) : isError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
            Failed to load activity logs.
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data?.data || []} 
            searchKey="action" 
            searchPlaceholder="Search by action..."
          />
        )}
      </div>
    </div>
  );
}
