"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/modules/DataTable";
import { StatusBadge } from "@/components/modules/StatusBadge";
import { TableSkeleton } from "@/components/modules/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { Plus, Eye, FileText } from "lucide-react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

export default function RFQsPage() {
  const { data: session } = useSession();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["rfqs"],
    queryFn: async () => {
      const res = await fetch("/api/rfqs");
      if (!res.ok) throw new Error("Failed to fetch RFQs");
      return res.json();
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "rfqNumber",
      header: "RFQ Number",
      cell: ({ row }) => (
        <div className="font-medium text-slate-900">{row.original.rfqNumber}</div>
      ),
    },
    {
      accessorKey: "title",
      header: "Title",
    },
    {
      accessorKey: "deadline",
      header: "Deadline",
      cell: ({ row }) => format(new Date(row.original.deadline), "MMM d, yyyy"),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      id: "stats",
      header: "Stats",
      cell: ({ row }) => {
        const counts = row.original._count;
        return (
          <div className="flex gap-3 text-xs text-slate-500">
            <span>{counts.items} Items</span>
            {session?.user?.role !== Role.VENDOR && (
              <span>{counts.vendors} Vendors</span>
            )}
            <span>{counts.quotations} Quotes</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Link href={`/rfqs/${row.original.id}`}>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Requests for Quotations</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all your procurement requests</p>
        </div>
        
        {session?.user?.role !== Role.VENDOR && (
          <Link href="/rfqs/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Create RFQ
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : isError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center flex flex-col items-center">
            <FileText className="w-8 h-8 mb-2 opacity-50" />
            Failed to load RFQs.
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data?.data || []} 
            searchKey="title" 
            searchPlaceholder="Search by title..."
          />
        )}
      </div>
    </div>
  );
}
