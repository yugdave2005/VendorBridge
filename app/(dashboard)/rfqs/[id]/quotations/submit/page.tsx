"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quotationSchema, QuotationFormData } from "@/lib/validations/quotation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SubmitQuotationPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();

  const [taxRate, setTaxRate] = useState(0);

  const { data: rfqData, isLoading: rfqLoading } = useQuery({
    queryKey: ["rfq", id],
    queryFn: async () => {
      const res = await fetch(`/api/rfqs/${id}`);
      if (!res.ok) throw new Error("Failed to fetch RFQ");
      return res.json();
    },
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<QuotationFormData>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      items: [],
      taxRate: 0,
      deliveryDays: 7,
    },
  });

  const { fields } = useFieldArray({
    control,
    name: "items",
  });

  const watchItems = watch("items");

  // Calculate totals
  const subtotal = watchItems.reduce((acc, item, index) => {
    const qty = rfqData?.data?.items?.[index]?.quantity || 0;
    const price = Number(item?.unitPrice) || 0;
    return acc + (qty * price);
  }, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  // Initialize form items when RFQ data loads
  useEffect(() => {
    if (rfqData?.data?.items && fields.length === 0) {
      const initialItems = rfqData.data.items.map((item: any) => ({
        rfqItemId: item.id,
        unitPrice: 0,
      }));
      setValue("items", initialItems);
    }
  }, [rfqData, fields.length, setValue]);

  const mutation = useMutation({
    mutationFn: async (data: QuotationFormData) => {
      data.taxRate = taxRate; // Ensure state sync
      const res = await fetch(`/api/rfqs/${id}/quotations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to submit quotation");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rfq", id] });
      toast.success("Quotation submitted successfully!");
      router.push(`/rfqs/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  if (rfqLoading) return <div className="p-8 text-center text-slate-500">Loading RFQ details...</div>;
  if (!rfqData?.data) return <div className="p-8 text-center text-red-500">RFQ not found.</div>;

  const rfq = rfqData.data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Submit Quotation</h1>
        <p className="text-slate-500 text-sm mt-1">Provide your best pricing for {rfq.title}</p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        
        {/* Line Items Pricing */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">Line Items Pricing</h2>
          
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Item Details</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 w-48 text-right">Unit Price (₹)</th>
                  <th className="px-4 py-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rfq.items.map((item: any, index: number) => {
                  const currentPrice = Number(watchItems[index]?.unitPrice) || 0;
                  const itemTotal = item.quantity * currentPrice;
                  
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                        {/* Hidden input for ID binding */}
                        <input type="hidden" {...register(`items.${index}.rfqItemId`)} value={item.id} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          type="number" 
                          step="0.01"
                          className="text-right"
                          {...register(`items.${index}.unitPrice`, { valueAsNumber: true })} 
                        />
                        {errors.items?.[index]?.unitPrice && (
                          <p className="text-red-500 text-xs mt-1 text-right">{errors.items[index].unitPrice?.message}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {itemTotal.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Commercial Terms & Totals */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">Commercial Terms</h2>
            
            <div className="space-y-2">
              <Label htmlFor="deliveryDays">Delivery Timeline (Days)</Label>
              <Input type="number" id="deliveryDays" {...register("deliveryDays", { valueAsNumber: true })} />
              {errors.deliveryDays && <p className="text-red-500 text-xs">{errors.deliveryDays.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="validUntil">Quotation Valid Until</Label>
              <Input type="date" id="validUntil" {...register("validUntil")} />
              {errors.validUntil && <p className="text-red-500 text-xs">{errors.validUntil.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes / Terms</Label>
              <Textarea id="notes" rows={3} placeholder="Warranty terms, shipping conditions..." {...register("notes")} />
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-3">Summary Calculation</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium text-slate-900">₹{subtotal.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 flex items-center gap-2">
                  Tax Rate (%)
                  <Input 
                    type="number" 
                    className="w-20 h-8 text-right" 
                    value={taxRate}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                  />
                </span>
                <span className="font-medium text-slate-900">₹{taxAmount.toLocaleString()}</span>
              </div>
              
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-lg">Total Amount</span>
                <span className="font-bold text-blue-600 text-xl">₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-10">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700">
            {mutation.isPending ? "Submitting..." : "Submit Formal Quotation"}
          </Button>
        </div>
      </form>
    </div>
  );
}
