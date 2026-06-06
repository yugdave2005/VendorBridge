"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { StatusBadge } from "@/components/modules/StatusBadge";
import { CardSkeleton } from "@/components/modules/SkeletonLoader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Download, Mail, CheckCircle, FileText } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Role } from "@prisma/client";

export default function InvoiceDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState({ toEmail: "", subject: "", message: "" });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["invoice", id],
    queryFn: async () => {
      const res = await fetch(`/api/invoices/${id}`);
      if (!res.ok) throw new Error("Failed to fetch invoice details");
      return res.json();
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/invoices/${id}/mark-paid`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark as paid");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      toast.success("Invoice marked as paid!");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch(`/api/invoices/${id}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to send email");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoice", id] });
      toast.success("Invoice sent via email!");
      setShowEmailDialog(false);
    },
    onError: (error: any) => toast.error(error.message),
  });

  if (isLoading) return <CardSkeleton />;
  if (isError || !data?.data) return <div className="p-8 text-center text-red-500">Failed to load Invoice.</div>;

  const invoice = data.data;
  const po = invoice.purchaseOrder;
  const vendor = po.vendor;

  const handleOpenEmailDialog = () => {
    setEmailData({
      toEmail: vendor.user?.email || "",
      subject: `Invoice ${invoice.invoiceNumber} from VendorBridge`,
      message: `Dear ${vendor.companyName},\n\nPlease find attached the invoice ${invoice.invoiceNumber} for your recent order ${po.poNumber}.\n\nTotal Amount: ₹${invoice.totalAmount.toLocaleString()}\nDue Date: ${format(new Date(invoice.dueDate), "PPP")}\n\nThank you,\nVendorBridge Procurement Team`,
    });
    setShowEmailDialog(true);
  };

  const isAdminOrOfficer = session?.user?.role === Role.ADMIN || session?.user?.role === Role.PROCUREMENT_OFFICER;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{invoice.invoiceNumber}</h1>
              <StatusBadge status={invoice.status} />
            </div>
            <p className="text-slate-500 text-sm mt-1">PO Ref: {po.poNumber}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-3">
          <Button variant="outline" className="border-slate-300" onClick={() => window.open(`/api/invoices/${id}/pdf`, "_blank")}>
            <Download className="w-4 h-4 mr-2" /> Download PDF
          </Button>
          {isAdminOrOfficer && (
            <>
              <Button variant="outline" onClick={handleOpenEmailDialog} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Mail className="w-4 h-4 mr-2" /> Send Email
              </Button>
              {invoice.status !== "PAID" && (
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => markPaidMutation.mutate()} disabled={markPaidMutation.isPending}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Mark as Paid
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {showEmailDialog && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" /> Send Invoice via Email
          </h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>To</Label>
              <Input value={emailData.toEmail} onChange={(e) => setEmailData({...emailData, toEmail: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label>Subject</Label>
              <Input value={emailData.subject} onChange={(e) => setEmailData({...emailData, subject: e.target.value})} />
            </div>
            <div className="space-y-1">
              <Label>Message</Label>
              <Textarea rows={6} value={emailData.message} onChange={(e) => setEmailData({...emailData, message: e.target.value})} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowEmailDialog(false)}>Cancel</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => sendEmailMutation.mutate(emailData)} disabled={sendEmailMutation.isPending}>
              {sendEmailMutation.isPending ? "Sending..." : "Send Now"}
            </Button>
          </div>
        </div>
      )}

      {/* HTML Preview of Invoice matching the PDF style loosely */}
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start border-b border-slate-200 pb-8 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">TAX INVOICE</h2>
            <div className="mt-4 space-y-1 text-sm text-slate-600">
              <p>Invoice No: <span className="font-semibold text-slate-900">{invoice.invoiceNumber}</span></p>
              <p>Date: {format(new Date(invoice.createdAt), "PP")}</p>
              <p>Due Date: <span className="font-semibold text-red-600">{format(new Date(invoice.dueDate), "PP")}</span></p>
              <p>PO Ref: {po.poNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <h3 className="text-xl font-bold text-blue-600 mb-2">VendorBridge Inc.</h3>
            <p className="text-sm text-slate-500">123 Procurement Avenue</p>
            <p className="text-sm text-slate-500">Enterprise City, EC 10001</p>
            <p className="text-sm text-slate-500">GSTIN: 00AAABB1234C1Z5</p>
          </div>
        </div>

        <div className="mb-8">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Bill To</h4>
          <p className="font-bold text-slate-900">{vendor.companyName}</p>
          <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{vendor.address}</p>
          <p className="text-sm text-slate-600 mt-1">GST: {vendor.gstNumber || "N/A"}</p>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-hidden mb-8">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3">Sr</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">Qty</th>
                <th className="px-4 py-3 text-right">Unit Price</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {po.quotation.items.map((item: any, i: number) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-slate-500">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-3 text-right text-slate-600">₹{item.unitPrice.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium text-slate-900">₹{item.totalPrice.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-b border-slate-200 pb-8 mb-8">
          <div className="w-64 space-y-3 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>₹{invoice.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Tax ({invoice.taxRate}%)</span>
              <span>₹{invoice.taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold text-xl pt-3 border-t border-slate-200">
              <span>Total Amount</span>
              <span>₹{invoice.totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-slate-500">
          <p>Thank you for your business. Terms and conditions apply.</p>
        </div>
      </div>
    </div>
  );
}
