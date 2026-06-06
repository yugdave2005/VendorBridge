"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/modules/DataTable";
import { TableSkeleton } from "@/components/modules/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/modules/StatusBadge";
import { Eye } from "lucide-react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";

export default function InvoicesPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const res = await fetch("/api/invoices");
      if (!res.ok) throw new Error("Failed to fetch invoices");
      return res.json();
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "invoiceNumber",
      header: "Invoice No",
      cell: ({ row }) => (
        <span className="font-semibold text-slate-900">{row.original.invoiceNumber}</span>
      ),
    },
    {
      accessorKey: "purchaseOrder.poNumber",
      header: "PO Reference",
      cell: ({ row }) => (
        <span className="text-blue-600 font-medium">{row.original.purchaseOrder?.poNumber}</span>
      ),
    },
    {
      accessorKey: "purchaseOrder.vendor.companyName",
      header: "Vendor",
      cell: ({ row }) => (
        <span className="font-medium text-slate-700">{row.original.purchaseOrder?.vendor?.companyName}</span>
      ),
    },
    {
      accessorKey: "totalAmount",
      header: "Amount",
      cell: ({ row }) => (
        <span className="font-bold text-slate-900">₹{row.original.totalAmount.toLocaleString()}</span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => format(new Date(row.original.dueDate), "MMM d, yyyy"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Link href={`/invoices/${row.original.id}`}>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track billing</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : isError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
            Failed to load invoices.
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data?.data || []} 
            searchKey="invoiceNumber" 
            searchPlaceholder="Search by Invoice Number..."
          />
        )}
      </div>
    </div>
  );
}
