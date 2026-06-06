"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { StatusBadge } from "@/components/modules/StatusBadge";
import { CardSkeleton } from "@/components/modules/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";
import { 
  FileText, Calendar, User, Package, Users, FileUp, 
  Send, CheckCircle2, AlertCircle, PlayCircle, Plus 
} from "lucide-react";

export default function RFQDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState<"items" | "vendors" | "attachments" | "quotations">("items");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["rfq", id],
    queryFn: async () => {
      const res = await fetch(`/api/rfqs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch RFQ");
      return res.json();
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/rfqs/${id}/publish`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to publish");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfq", id] });
      toast.success("RFQ Published successfully!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const rfq = data?.data;
  const isCreatorOrAdmin = session?.user?.role !== Role.VENDOR;

  if (isLoading) return <div className="space-y-6"><CardSkeleton /><CardSkeleton /></div>;
  if (isError || !rfq) return <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 text-center">Failed to load RFQ details.</div>;

  const isDraft = rfq.status === "DRAFT";

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {rfq.rfqNumber}
              </span>
              <StatusBadge status={rfq.status} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-3">{rfq.title}</h1>
            {rfq.description && (
              <p className="text-slate-500 mt-2 max-w-2xl text-sm leading-relaxed">{rfq.description}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-6 mt-6 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-700">Deadline:</span>
                {format(new Date(rfq.deadline), "PPP")}
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-700">Created By:</span>
                {rfq.createdBy.name}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isCreatorOrAdmin && isDraft && (
            <div className="flex shrink-0 gap-3">
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
              >
                <Send className="w-4 h-4 mr-2" />
                Publish RFQ
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-px">
        <button 
          onClick={() => setActiveTab("items")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "items" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
        >
          <Package className="w-4 h-4" /> Line Items ({rfq.items.length})
        </button>
        {isCreatorOrAdmin && (
          <button 
            onClick={() => setActiveTab("vendors")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "vendors" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
          >
            <Users className="w-4 h-4" /> Invited Vendors ({rfq.vendors.length})
          </button>
        )}
        <button 
          onClick={() => setActiveTab("attachments")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "attachments" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
        >
          <FileText className="w-4 h-4" /> Attachments ({rfq.attachments?.length || 0})
        </button>
        <button 
          onClick={() => setActiveTab("quotations")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === "quotations" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"}`}
        >
          <FileText className="w-4 h-4" /> Quotations ({rfq.quotations?.length || 0})
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        
        {/* ITEMS TAB */}
        {activeTab === "items" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Requested Items</h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Item Name</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3 text-right">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rfq.items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                      <td className="px-4 py-3 text-slate-500">{item.description || "-"}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {item.quantity} {item.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VENDORS TAB */}
        {activeTab === "vendors" && isCreatorOrAdmin && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Invited Vendors</h3>
              {isDraft && (
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                  <Plus className="w-4 h-4 mr-2" />
                  Assign Vendors
                </Button>
              )}
            </div>
            {rfq.vendors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rfq.vendors.map((v: any) => (
                  <div key={v.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{v.vendor.companyName}</p>
                      <p className="text-xs text-slate-500">{v.vendor.user?.email || "N/A"}</p>
                    </div>
                    <StatusBadge status={v.vendor.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-slate-500">No vendors have been invited yet.</p>
              </div>
            )}
          </div>
        )}

        {/* ATTACHMENTS TAB */}
        {activeTab === "attachments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Attachments</h3>
              {isCreatorOrAdmin && isDraft && (
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                  <FileUp className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              )}
            </div>
            {rfq.attachments?.length > 0 ? (
              <ul className="space-y-3">
                {rfq.attachments.map((att: any) => (
                  <li key={att.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-3 hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm font-medium text-slate-900">{att.filename}</p>
                        <p className="text-xs text-slate-500">{(att.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.open(att.path, "_blank")}>
                      View
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-slate-500">No attachments uploaded.</p>
              </div>
            )}
          </div>
        )}

        {/* QUOTATIONS TAB */}
        {activeTab === "quotations" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Quotations Received</h3>
            {rfq.quotations?.length > 0 ? (
              <div className="space-y-3">
                {rfq.quotations.map((q: any) => (
                  <div key={q.id} className="flex items-center justify-between border border-slate-200 rounded-lg p-4">
                    <div>
                      <p className="font-semibold text-slate-900">{isCreatorOrAdmin ? q.vendor.companyName : "Your Quotation"}</p>
                      <p className="text-sm text-slate-500 font-medium">₹{q.totalAmount.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <StatusBadge status={q.status} />
                      <Button variant="outline" size="sm">View Quote</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-slate-500">No quotations received yet.</p>
                {session?.user?.role === Role.VENDOR && rfq.status === "PUBLISHED" && (
                  <Button className="mt-4 bg-blue-600 hover:bg-blue-700">Submit Quotation</Button>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
