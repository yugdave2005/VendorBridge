"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/modules/StatusBadge";
import { CardSkeleton } from "@/components/modules/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { format } from "date-fns";
import { ArrowLeft, CheckCircle2, XCircle, FileText, Package, User } from "lucide-react";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

export default function ApprovalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [remarks, setRemarks] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["approval", id],
    queryFn: async () => {
      const res = await fetch(`/api/approvals/${id}`);
      if (!res.ok) throw new Error("Failed to fetch approval details");
      return res.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ action, remarks }: { action: "approve" | "reject", remarks: string }) => {
      const res = await fetch(`/api/approvals/${id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Failed to ${action}`);
      }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["approval", id] });
      queryClient.invalidateQueries({ queryKey: ["approvals", "pending"] });
      toast.success(`Approval ${variables.action === "approve" ? "granted" : "rejected"} successfully!`);
      router.push("/approvals");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  if (isLoading) return <CardSkeleton />;
  if (isError || !data?.data) return <div className="p-8 text-center text-red-500">Failed to load approval details.</div>;

  const approval = data.data;
  const quote = approval.quotation;
  const rfq = quote.rfq;
  const vendor = quote.vendor;

  const isPending = approval.status === "PENDING";
  const canAction = (session?.user?.role === Role.MANAGER || session?.user?.role === Role.ADMIN) && isPending;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Review Quotation Approval</h1>
            <StatusBadge status={approval.status} />
          </div>
          <p className="text-slate-500 text-sm mt-1">Requested {format(new Date(approval.requestedAt), "PPp")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content (Quotation Details) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              Quotation Summary
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
              <div>
                <p className="text-slate-500">Quotation No.</p>
                <p className="font-medium text-slate-900">{quote.quotationNumber}</p>
              </div>
              <div>
                <p className="text-slate-500">RFQ Reference</p>
                <p className="font-medium text-blue-600">{rfq.rfqNumber}</p>
              </div>
              <div>
                <p className="text-slate-500">Delivery Timeline</p>
                <p className="font-medium text-slate-900">{quote.deliveryDays} Days</p>
              </div>
              <div>
                <p className="text-slate-500">Validity Date</p>
                <p className="font-medium text-slate-900">{format(new Date(quote.validUntil), "PP")}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex justify-between items-center mb-6">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total Amount</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">₹{quote.totalAmount.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Subtotal: ₹{quote.subtotal.toLocaleString()}</p>
                <p className="text-xs text-slate-500 mt-0.5">Tax ({quote.taxRate}%): ₹{quote.taxAmount.toLocaleString()}</p>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-slate-900 mb-3">Line Items Pricing</h3>
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
                  {quote.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2 font-medium text-slate-900">{item.name}</td>
                      <td className="px-4 py-2 text-center text-slate-600">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-slate-600">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-medium text-slate-900">₹{item.totalPrice.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {quote.notes && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-sm font-semibold text-slate-900 mb-2">Vendor Notes</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar (Context & Action) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              Vendor Context
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Company Name</p>
                <p className="font-semibold text-slate-900">{vendor.companyName}</p>
              </div>
              <div>
                <p className="text-slate-500">Vendor Rating</p>
                <p className="font-medium text-slate-900">{vendor.rating > 0 ? `${vendor.rating} ⭐` : "New Vendor"}</p>
              </div>
            </div>
            
            <hr className="my-5 border-slate-100" />
            
            <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-400" />
              RFQ Context
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Project Title</p>
                <p className="font-medium text-slate-900">{rfq.title}</p>
              </div>
              <div>
                <p className="text-slate-500">Justification Remarks</p>
                <p className="italic text-slate-600 border-l-2 border-slate-200 pl-3 mt-1">
                  "{approval.remarks || "No justification provided."}"
                </p>
              </div>
            </div>
          </div>

          {/* Action Box */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">
              Management Decision
            </h2>
            
            {!canAction ? (
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-sm">
                {approval.status === "PENDING" ? (
                  <p className="text-slate-600 text-center">Waiting for Manager review.</p>
                ) : (
                  <div>
                    <p className="font-medium text-slate-900 mb-2">Resolved on {format(new Date(approval.resolvedAt!), "PPP")}</p>
                    <p className="text-slate-600 italic">"{approval.remarks}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="decisionRemarks">Decision Remarks (Required)</Label>
                  <Textarea 
                    id="decisionRemarks" 
                    placeholder="Provide reasoning for approval or rejection..." 
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={!remarks || actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ action: "reject", remarks })}
                  >
                    <XCircle className="w-4 h-4 mr-2" /> Reject
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    disabled={!remarks || actionMutation.isPending}
                    onClick={() => actionMutation.mutate({ action: "approve", remarks })}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                  </Button>
                </div>
                <p className="text-xs text-slate-500 text-center mt-2">
                  Approving this will auto-generate a Purchase Order.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
