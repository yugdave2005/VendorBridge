"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/modules/StatusBadge";
import { CardSkeleton } from "@/components/modules/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { Mail, Phone, MapPin, FileText, CheckCircle2, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

export default function VendorDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["vendor", id],
    queryFn: async () => {
      const res = await fetch(`/api/vendors/${id}`);
      if (!res.ok) throw new Error("Failed to fetch vendor");
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/vendors/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor", id] });
      toast.success("Vendor status updated");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const vendor = data?.data;
  const canApprove = session?.user?.role === Role.MANAGER || session?.user?.role === Role.ADMIN;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (isError || !vendor) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center">
        Failed to load vendor details.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shrink-0">
              <span className="text-3xl font-bold text-blue-600">
                {vendor.companyName.charAt(0)}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{vendor.companyName}</h1>
                <StatusBadge status={vendor.status} />
              </div>
              <p className="text-slate-500 font-medium">{vendor.user?.name}</p>
              <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {vendor.user?.email || "N/A"}
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {vendor.phone}
                </div>
                <div className="flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-slate-400" />
                  Tax ID: {vendor.gstNumber}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          {canApprove && vendor.status === "PENDING" && (
            <div className="flex items-center gap-3 shrink-0">
              <Button
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                onClick={() => statusMutation.mutate("REJECTED")}
                disabled={statusMutation.isPending}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => statusMutation.mutate("APPROVED")}
                disabled={statusMutation.isPending}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Approve Vendor
              </Button>
            </div>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400" />
              Registered Address
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed max-w-sm">
              {vendor.address}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Categories</h3>
            <div className="flex flex-wrap gap-2">
              {vendor.category ? vendor.category.split(",").map((cat: string) => (
                <span key={cat} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-medium border border-slate-200">
                  {cat.trim()}
                </span>
              )) : null}
            </div>
          </div>
        </div>
      </div>

      {/* History Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quotations */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Quotations</h2>
          {vendor.quotations?.length > 0 ? (
            <div className="space-y-4">
              {vendor.quotations.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-1">Quote #{q.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-slate-500">{format(new Date(q.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 mb-1">₹{q.totalAmount.toLocaleString()}</p>
                    <StatusBadge status={q.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">No quotations found.</p>
          )}
        </div>

        {/* Purchase Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Purchase Orders</h2>
          {vendor.purchaseOrders?.length > 0 ? (
            <div className="space-y-4">
              {vendor.purchaseOrders.map((po: any) => (
                <div key={po.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900 mb-1">PO #{po.id.slice(-6).toUpperCase()}</p>
                    <p className="text-xs text-slate-500">{format(new Date(po.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900 mb-1">₹{po.totalAmount.toLocaleString()}</p>
                    <StatusBadge status={po.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500 text-center py-6">No purchase orders found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
