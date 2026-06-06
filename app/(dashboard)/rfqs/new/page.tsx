"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { rfqSchema, RFQFormData } from "@/lib/validations/rfq";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, CalendarIcon } from "lucide-react";

export default function NewRFQPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RFQFormData>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      items: [{ name: "", description: "", quantity: 1, unit: "pcs" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const mutation = useMutation({
    mutationFn: async (data: RFQFormData) => {
      const res = await fetch("/api/rfqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create RFQ");
      }
      return res.json();
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["rfqs"] });
      toast.success("RFQ Draft Created!");
      router.push(`/rfqs/${res.data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Request for Quotation</h1>
        <p className="text-slate-500 text-sm mt-1">Draft a new RFQ and add line items</p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
        
        {/* Basic Details */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-3">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title">RFQ Title</Label>
              <Input id="title" placeholder="e.g. Q3 Office Supplies Replenishment" {...register("title")} />
              {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea id="description" rows={3} placeholder="Brief context or instructions for vendors..." {...register("description")} />
              {errors.description && <p className="text-red-500 text-xs">{errors.description.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Submission Deadline</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input type="date" id="deadline" className="pl-9" {...register("deadline")} />
              </div>
              {errors.deadline && <p className="text-red-500 text-xs">{errors.deadline.message}</p>}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-lg font-semibold text-slate-900">Line Items</h2>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={() => append({ name: "", description: "", quantity: 1, unit: "pcs" })}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-12 gap-4 items-start bg-slate-50 p-4 rounded-lg border border-slate-100 relative group">
                <div className="col-span-12 md:col-span-4 space-y-2">
                  <Label>Item Name</Label>
                  <Input {...register(`items.${index}.name`)} placeholder="e.g. Dell XPS 15" />
                  {errors.items?.[index]?.name && <p className="text-red-500 text-xs">{errors.items[index].name.message}</p>}
                </div>
                
                <div className="col-span-12 md:col-span-4 space-y-2">
                  <Label>Description</Label>
                  <Input {...register(`items.${index}.description`)} placeholder="e.g. 32GB RAM, 1TB SSD" />
                </div>

                <div className="col-span-6 md:col-span-2 space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" step="0.01" {...register(`items.${index}.quantity`, { valueAsNumber: true })} />
                  {errors.items?.[index]?.quantity && <p className="text-red-500 text-xs">{errors.items[index].quantity.message}</p>}
                </div>

                <div className="col-span-6 md:col-span-2 space-y-2">
                  <Label>Unit</Label>
                  <Input {...register(`items.${index}.unit`)} placeholder="pcs, kg, etc." />
                  {errors.items?.[index]?.unit && <p className="text-red-500 text-xs">{errors.items[index].unit.message}</p>}
                </div>

                {fields.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => remove(index)}
                    className="absolute -right-2 -top-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            {errors.items?.root && <p className="text-red-500 text-sm font-medium">{errors.items.root.message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 pb-10">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700">
            {mutation.isPending ? "Creating Draft..." : "Save as Draft"}
          </Button>
        </div>
      </form>
    </div>
  );
}
