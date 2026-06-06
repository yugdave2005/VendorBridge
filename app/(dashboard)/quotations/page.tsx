"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/modules/DataTable";
import { TableSkeleton } from "@/components/modules/SkeletonLoader";
import { Badge } from "@/components/ui/badge";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

const statusColors: Record<string, string> = {
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  ACCEPTED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function QuotationsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["quotations"],
    queryFn: async () => {
      const res = await fetch("/api/quotations");
      if (!res.ok) throw new Error("Failed to fetch quotations");
      return res.json();
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      id: "rfqTitle",
      accessorFn: (row: any) => row.rfq?.title,
      header: "RFQ Title",
      cell: ({ row }) => {
        const title = row.original.rfq?.title || "Unknown RFQ";
        const rfqNum = row.original.rfq?.rfqNumber;
        return (
          <div>
            <p className="font-medium text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{rfqNum}</p>
          </div>
        );
      },
    },
    {
      id: "vendorName",
      accessorFn: (row: any) => row.vendor?.companyName,
      header: "Vendor",
      cell: ({ row }) => (
        <span className="font-medium text-slate-700">{row.original.vendor?.companyName}</span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total Value",
      cell: ({ row }) => (
        <span className="font-medium text-slate-900">
          ₹{row.original.totalAmount?.toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        return (
          <Badge className={statusColors[status] || "bg-slate-100 text-slate-800"} variant="outline">
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Date Submitted",
      cell: ({ row }) => (
        <span className="text-slate-500 text-sm">
          {format(new Date(row.original.createdAt), "MMM d, yyyy")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quotations</h1>
          <p className="text-slate-500 text-sm mt-1">View and track all quotation submissions.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : isError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
            Failed to load quotations.
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data?.data || []} 
            searchKey="rfqTitle" 
            searchPlaceholder="Search by RFQ title..."
          />
        )}
      </div>
    </div>
  );
}
