"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/modules/DataTable";
import { TableSkeleton } from "@/components/modules/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { Eye, Clock } from "lucide-react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { formatDistanceToNow } from "date-fns";

export default function ApprovalsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: async () => {
      const res = await fetch("/api/approvals");
      if (!res.ok) throw new Error("Failed to fetch approvals");
      return res.json();
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      id: "title",
      accessorFn: (row: any) => row.quotation?.rfq?.title,
      header: "RFQ Title",
      cell: ({ row }) => {
        const title = row.original.quotation?.rfq?.title || "Unknown RFQ";
        const rfqNum = row.original.quotation?.rfq?.rfqNumber;
        return (
          <div>
            <p className="font-medium text-slate-900">{title}</p>
            <p className="text-xs text-slate-500">{rfqNum}</p>
          </div>
        );
      },
    },
    {
      accessorKey: "quotation.vendor.companyName",
      header: "Vendor",
      cell: ({ row }) => (
        <span className="font-medium text-slate-700">{row.original.quotation?.vendor?.companyName}</span>
      ),
    },
    {
      accessorKey: "urgency",
      header: "Urgency",
      cell: ({ row }) => {
        const date = new Date(row.original.requestedAt);
        const distance = formatDistanceToNow(date, { addSuffix: true });
        
        // Simple urgency check: > 3 days is urgent
        const daysOld = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        const isUrgent = daysOld > 3;

        return (
          <div className={`flex items-center gap-1.5 text-sm ${isUrgent ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
            <Clock className="w-4 h-4" />
            {distance}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Link href={`/approvals/${row.original.id}`}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Eye className="h-4 w-4 text-slate-500" />
            </Button>
          </Link>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pending Approvals</h1>
          <p className="text-slate-500 text-sm mt-1">Review and action procurement requests</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {isLoading ? (
          <TableSkeleton rows={5} cols={4} />
        ) : isError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
            Failed to load pending approvals.
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data?.data || []} 
            searchKey="title" 
            searchPlaceholder="Search by RFQ title..."
          />
        )}
      </div>
    </div>
  );
}
