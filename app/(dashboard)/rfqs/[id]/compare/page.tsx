"use client";

import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/modules/StatusBadge";
import { CardSkeleton } from "@/components/modules/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function CompareQuotationsPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["rfq", id, "compare"],
    queryFn: async () => {
      const res = await fetch(`/api/rfqs/${id}/quotations/compare`);
      if (!res.ok) throw new Error("Failed to fetch comparison data");
      return res.json();
    },
  });

  if (isLoading) return <CardSkeleton />;
  if (isError || !data?.data) return <div className="p-8 text-center text-red-500">Failed to load comparison matrix.</div>;

  const { rfq, items, vendors } = data.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Compare Quotations</h1>
          <p className="text-slate-500 text-sm mt-1">{rfq.title} ({rfq.rfqNumber})</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 min-w-[200px]">Item Details</th>
              <th className="px-6 py-4 text-center">Quantity</th>
              {vendors.map((v: any) => (
                <th key={v.vendorId} className="px-6 py-4 text-center min-w-[180px]">
                  <p className="font-bold text-slate-900">{v.companyName}</p>
                  <p className="text-xs text-slate-500 font-normal mt-1 flex justify-center items-center gap-1">
                    Rating: {v.rating > 0 ? `${v.rating} ⭐` : "New"}
                  </p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {/* Items Rows */}
            {items.map((item: any) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <p className="font-medium text-slate-900">{item.name}</p>
                </td>
                <td className="px-6 py-4 text-center text-slate-600">
                  {item.quantity} {item.unit}
                </td>
                {vendors.map((v: any) => {
                  const price = item.vendorPrices[v.vendorId];
                  const isLowest = item.lowestPrice !== null && price === item.lowestPrice;
                  
                  return (
                    <td key={v.vendorId} className="px-6 py-4 text-center">
                      {price > 0 ? (
                        <span className={`px-2 py-1 rounded font-medium ${isLowest ? 'bg-emerald-100 text-emerald-800' : 'text-slate-700'}`}>
                          ₹{price.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Summary Rows */}
            <tr className="bg-slate-50 border-t-2 border-slate-200">
              <td colSpan={2} className="px-6 py-4 text-right font-bold text-slate-900">Total Amount</td>
              {vendors.map((v: any) => (
                <td key={v.vendorId} className="px-6 py-4 text-center font-bold text-lg text-slate-900">
                  ₹{v.totalAmount.toLocaleString()}
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50">
              <td colSpan={2} className="px-6 py-4 text-right font-semibold text-slate-700">Delivery Time</td>
              {vendors.map((v: any) => (
                <td key={v.vendorId} className="px-6 py-4 text-center text-slate-600">
                  {v.deliveryDays} Days
                </td>
              ))}
            </tr>
            <tr className="bg-slate-50">
              <td colSpan={2} className="px-6 py-4 text-right font-semibold text-slate-700">Validity</td>
              {vendors.map((v: any) => (
                <td key={v.vendorId} className="px-6 py-4 text-center text-slate-600">
                  {format(new Date(v.validUntil), "MMM d, yyyy")}
                </td>
              ))}
            </tr>
            
            {/* Actions Row */}
            <tr className="bg-white">
              <td colSpan={2} className="px-6 py-6 border-t border-slate-200"></td>
              {vendors.map((v: any) => (
                <td key={v.vendorId} className="px-6 py-6 text-center border-t border-slate-200">
                  {v.status === "SUBMITTED" ? (
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 w-full"
                      onClick={() => router.push(`/approvals/new?quotationId=${v.quotationId}`)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Select for Approval
                    </Button>
                  ) : (
                    <StatusBadge status={v.status} />
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        
        {vendors.length === 0 && (
          <div className="p-12 text-center text-slate-500 border-t border-slate-200">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-slate-300" />
            <p>No quotations have been submitted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
