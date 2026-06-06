"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/modules/DataTable";
import { TableSkeleton } from "@/components/modules/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/modules/StatusBadge";
import { Eye, Clock } from "lucide-react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export default function PurchaseOrdersPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["purchase-orders"],
    queryFn: async () => {
      const res = await fetch("/api/purchase-orders");
      if (!res.ok) throw new Error("Failed to fetch purchase orders");
      return res.json();
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "poNumber",
      header: "PO Number",
      cell: ({ row }) => (
        <span className="font-semibold text-blue-600">{row.original.poNumber}</span>
      ),
    },
    {
      accessorKey: "vendor.companyName",
      header: "Vendor",
      cell: ({ row }) => (
        <span className="font-medium text-slate-700">{row.original.vendor.companyName}</span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Total Amount",
      cell: ({ row }) => (
        <span className="font-medium text-slate-900">₹{row.original.totalAmount.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "deliveryDate",
      header: "Expected Delivery",
      cell: ({ row }) => {
        if (!row.original.deliveryDate) return "-";
        return format(new Date(row.original.deliveryDate), "MMM d, yyyy");
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Link href={`/purchase-orders/${row.original.id}`}>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Purchase Orders</h1>
          <p className="text-slate-500 text-sm mt-1">Manage all approved procurement orders</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {isLoading ? (
          <TableSkeleton rows={5} cols={5} />
        ) : isError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
            Failed to load purchase orders.
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data?.data || []} 
            searchKey="poNumber" 
            searchPlaceholder="Search by PO Number..."
          />
        )}
      </div>
    </div>
  );
}
