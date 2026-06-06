"use client";

import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/modules/DataTable";
import { StatusBadge } from "@/components/modules/StatusBadge";
import { TableSkeleton } from "@/components/modules/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { Plus, Eye } from "lucide-react";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { useRouter } from "next/navigation";

export default function VendorsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // If vendor tries to access vendor list, redirect them to their own profile
  if (session?.user?.role === Role.VENDOR) {
    // In a real app we'd fetch their vendorId from their userId, but we'll do it cleanly here
    // Redirect handled by middleware ideally, but fallback here
    router.push("/dashboard"); 
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const res = await fetch("/api/vendors");
      if (!res.ok) throw new Error("Failed to fetch vendors");
      return res.json();
    },
  });

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "companyName",
      header: "Company Name",
      cell: ({ row }) => (
        <div className="font-medium text-slate-900">{row.original.companyName}</div>
      ),
    },
    {
      accessorKey: "contactName",
      header: "Contact Person",
      cell: ({ row }) => (
        <div className="text-slate-900">{row.original.user?.name || "N/A"}</div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="text-slate-600">{row.original.user?.email || "N/A"}</div>
      ),
    },
    {
      accessorKey: "category",
      header: "Categories",
      cell: ({ row }) => {
        const cats = row.original.category ? row.original.category.split(",").map((s: string) => s.trim()) : [];
        return (
          <div className="flex flex-wrap gap-1">
            {cats.slice(0, 2).map((c: string) => (
              <span key={c} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                {c}
              </span>
            ))}
            {cats.length > 2 && (
              <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                +{cats.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
      cell: ({ row }) => format(new Date(row.original.createdAt), "MMM d, yyyy"),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <Link href={`/vendors/${row.original.id}`}>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Vendors</h1>
          <p className="text-slate-500 text-sm mt-1">Manage supplier directory and approvals</p>
        </div>
        
        {session?.user?.role !== Role.VENDOR && (
          <Link href="/vendors/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Register Vendor
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : isError ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
            Failed to load vendors.
          </div>
        ) : (
          <DataTable 
            columns={columns} 
            data={data?.data || []} 
            searchKey="companyName" 
            searchPlaceholder="Search by company name..."
          />
        )}
      </div>
    </div>
  );
}
