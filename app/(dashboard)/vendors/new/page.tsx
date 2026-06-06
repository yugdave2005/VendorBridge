"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorSchema, VendorFormData } from "@/lib/validations/vendor";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewVendorPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [categoriesInput, setCategoriesInput] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      categories: [],
    },
  });

  const categories = watch("categories");

  const addCategory = () => {
    if (categoriesInput.trim() && !categories.includes(categoriesInput.trim())) {
      setValue("categories", [...categories, categoriesInput.trim()], { shouldValidate: true });
      setCategoriesInput("");
    }
  };

  const removeCategory = (cat: string) => {
    setValue(
      "categories",
      categories.filter((c) => c !== cat),
      { shouldValidate: true }
    );
  };

  const mutation = useMutation({
    mutationFn: async (data: VendorFormData) => {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to register vendor");
      }
      return res.json();
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast.success("Vendor registered successfully!");
      router.push(`/vendors/${res.data.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Register New Vendor</h1>
        <p className="text-slate-500 text-sm mt-1">Add a new supplier to the procurement network</p>
      </div>

      <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" {...register("companyName")} />
            {errors.companyName && <p className="text-red-500 text-xs">{errors.companyName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxId">Tax ID (GST / PAN)</Label>
            <Input id="taxId" {...register("taxId")} />
            {errors.taxId && <p className="text-red-500 text-xs">{errors.taxId.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactName">Contact Person</Label>
            <Input id="contactName" {...register("contactName")} />
            {errors.contactName && <p className="text-red-500 text-xs">{errors.contactName.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" {...register("phone")} />
            {errors.phone && <p className="text-red-500 text-xs">{errors.phone.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Product / Service Categories</Label>
          <div className="flex gap-2">
            <Input 
              value={categoriesInput} 
              onChange={(e) => setCategoriesInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCategory();
                }
              }}
              placeholder="e.g. IT Equipment, Office Supplies" 
            />
            <Button type="button" variant="secondary" onClick={addCategory}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {categories.map(cat => (
              <div key={cat} className="flex items-center bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
                {cat}
                <button type="button" onClick={() => removeCategory(cat)} className="ml-2 hover:text-blue-900">&times;</button>
              </div>
            ))}
          </div>
          {errors.categories && <p className="text-red-500 text-xs">{errors.categories.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Registered Address</Label>
          <Textarea id="address" {...register("address")} rows={3} />
          {errors.address && <p className="text-red-500 text-xs">{errors.address.message}</p>}
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending} className="bg-blue-600 hover:bg-blue-700">
            {mutation.isPending ? "Registering..." : "Register Vendor"}
          </Button>
        </div>
      </form>
    </div>
  );
}
