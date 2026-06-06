"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/modules/StatusBadge";
import { CardSkeleton } from "@/components/modules/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Truck, Package, FileText, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import Link from "next/link";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["purchase-order", id],
    queryFn: async () => {
      const res = await fetch(`/api/purchase-orders/${id}`);
      if (!res.ok) throw new Error("Failed to fetch PO details");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const res = await fetch(`/api/purchase-orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-order", id] });
      toast.success(`PO marked as ${status}`);
    },
    onError: (error: any) => toast.error(error.message),
  });

  if (isLoading) return <CardSkeleton />;
  if (isError || !data?.data) return <div className="p-8 text-center text-red-500">Failed to load Purchase Order.</div>;

  const po = data.data;
  const isOfficerOrAdmin = session?.user?.role === Role.ADMIN || session?.user?.role === Role.PROCUREMENT_OFFICER;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{po.poNumber}</h1>
              <StatusBadge status={po.status} />
            </div>
            <p className="text-slate-500 text-sm mt-1">From RFQ: {po.quotation.rfq.title}</p>
          </div>
        </div>

        {/* Action Controls based on status */}
        <div className="flex gap-3">
          {po.status === "DRAFT" && isOfficerOrAdmin && (
            <Button onClick={() => updateStatusMutation.mutate("ISSUED")} disabled={updateStatusMutation.isPending}>
              <CheckCircle2 className="w-4 h-4 mr-2" /> Issue PO to Vendor
            </Button>
          )}
          {po.status === "ISSUED" && (
            <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => updateStatusMutation.mutate("SHIPPED")} disabled={updateStatusMutation.isPending}>
              <Truck className="w-4 h-4 mr-2" /> Mark as Shipped
            </Button>
          )}
          {po.status === "SHIPPED" && isOfficerOrAdmin && (
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => updateStatusMutation.mutate("DELIVERED")} disabled={updateStatusMutation.isPending}>
              <Package className="w-4 h-4 mr-2" /> Confirm Delivery
            </Button>
          )}
          {po.invoice && (
            <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50" onClick={() => router.push(`/invoices/${po.invoice.id}`)}>
              <FileText className="w-4 h-4 mr-2" /> View Invoice
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main detail */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Line Items</h2>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2 text-center">Qty</th>
                    <th className="px-4 py-2 text-right">Unit Price</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {po.quotation.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                      <td className="px-4 py-3 text-right text-slate-600">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">₹{item.totalPrice.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{po.quotation.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-600 border-b border-slate-200 pb-2">
                  <span>Tax ({po.quotation.taxRate}%)</span>
                  <span>₹{po.quotation.taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold text-lg pt-1">
                  <span>Total</span>
                  <span>₹{po.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">Vendor Information</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium text-slate-900">{po.vendor.companyName}</p>
              <p className="text-slate-500">{po.vendor.user?.email || "N/A"}</p>
              <p className="text-slate-500">{po.vendor.phone}</p>
              <p className="text-slate-500 mt-2 whitespace-pre-wrap">{po.vendor.address}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h3 className="font-semibold text-slate-900 text-sm uppercase tracking-wider">Terms & Delivery</h3>
            <div className="text-sm space-y-3">
              <div>
                <p className="text-slate-500 mb-1">Expected Delivery</p>
                <p className="font-medium text-slate-900">
                  {po.deliveryDate ? format(new Date(po.deliveryDate), "PPP") : "TBD"}
                </p>
              </div>
              <div>
                <p className="text-slate-500 mb-1">Terms</p>
                <p className="text-slate-700 whitespace-pre-wrap">{po.terms}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
