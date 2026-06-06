"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { initiateApprovalSchema, InitiateApprovalData } from "@/lib/validations/approval";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function InitiateApprovalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quotationId = searchParams.get("quotationId");
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<InitiateApprovalData>({
    resolver: zodResolver(initiateApprovalSchema),
    defaultValues: {
      quotationId: quotationId || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InitiateApprovalData) => {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to initiate approval");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      toast.success("Approval request sent to Manager!");
      router.push("/rfqs"); // Go back to RFQs list
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  if (!quotationId) {
    return <div className="p-8 text-center text-red-500">No Quotation Selected. Please start from the RFQ Compare page.</div>;
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 mt-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Request Final Approval</h1>
        <p className="text-slate-500 text-sm mt-1">Submit this quotation to management for final sign-off.</p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        
        {/* Simplified assignment. In reality, you'd fetch users with MANAGER role and show a dropdown. */}
        <div className="space-y-2">
          <Label htmlFor="approverId">Select Manager / Approver ID</Label>
          <input 
            type="text" 
            placeholder="Paste Manager User ID here for now..." 
            className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
            {...register("approverId")} 
          />
          {errors.approverId && <p className="text-red-500 text-xs">{errors.approverId.message}</p>}
          <p className="text-xs text-slate-500 mt-1">
            *In the demo environment, you must paste a valid User ID with the MANAGER role.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="remarks">Officer Remarks / Justification</Label>
          <Textarea 
            id="remarks" 
            rows={4} 
            placeholder="Why are you recommending this vendor over others?" 
            {...register("remarks")} 
          />
          {errors.remarks && <p className="text-red-500 text-xs">{errors.remarks.message}</p>}
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700">
            {mutation.isPending ? "Submitting..." : "Send to Manager"}
          </Button>
        </div>
      </form>
    </div>
  );
}
