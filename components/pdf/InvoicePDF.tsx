import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";
import { format } from "date-fns";

// Basic styling for the PDF
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#334155" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 40 },
  headerRight: { textAlign: "right" },
  title: { fontSize: 24, fontWeight: "bold", color: "#0f172a", marginBottom: 5 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", color: "#0f172a", marginBottom: 8, marginTop: 20 },
  row: { flexDirection: "row", gap: 20 },
  col: { flex: 1 },
  bold: { fontWeight: "bold", color: "#0f172a" },
  table: { width: "100%", marginTop: 20 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: 8, fontWeight: "bold" },
  tableRow: { flexDirection: "row", borderBottom: "1px solid #e2e8f0", padding: 8 },
  col1: { width: "10%" },
  col2: { width: "40%" },
  col3: { width: "15%", textAlign: "center" },
  col4: { width: "15%", textAlign: "right" },
  col5: { width: "20%", textAlign: "right" },
  totalsArea: { marginTop: 20, width: "100%", alignItems: "flex-end" },
  totalRow: { flexDirection: "row", justifyContent: "space-between", width: "40%", paddingVertical: 4 },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", width: "40%", paddingVertical: 6, borderTop: "1px solid #94a3b8", marginTop: 4, fontWeight: "bold", fontSize: 12 },
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, textAlign: "center", color: "#94a3b8", fontSize: 8, borderTop: "1px solid #e2e8f0", paddingTop: 10 },
});

export const InvoicePDF = ({ invoice }: { invoice: any }) => {
  const { purchaseOrder } = invoice;
  const { vendor, quotation } = purchaseOrder;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>TAX INVOICE</Text>
            <Text>Invoice No: <Text style={styles.bold}>{invoice.invoiceNumber}</Text></Text>
            <Text>Date: {format(new Date(invoice.createdAt), "PP")}</Text>
            <Text>Due Date: {format(new Date(invoice.dueDate), "PP")}</Text>
            <Text>PO Ref: {purchaseOrder.poNumber}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={{ fontSize: 18, fontWeight: "bold", color: "#2563eb", marginBottom: 5 }}>VendorBridge Inc.</Text>
            <Text>123 Procurement Avenue</Text>
            <Text>Enterprise City, EC 10001</Text>
            <Text>GSTIN: 00AAABB1234C1Z5</Text>
          </View>
        </View>

        {/* Billing Info */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Bill To:</Text>
            <Text style={styles.bold}>{vendor.companyName}</Text>
            {vendor.address && <Text>{vendor.address}</Text>}
            {vendor.gstNumber && <Text>GST: {vendor.gstNumber}</Text>}
            {vendor.panNumber && <Text>PAN: {vendor.panNumber}</Text>}
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Sr</Text>
            <Text style={styles.col2}>Description</Text>
            <Text style={styles.col3}>Qty</Text>
            <Text style={styles.col4}>Unit Price</Text>
            <Text style={styles.col5}>Amount</Text>
          </View>
          {quotation.items.map((item: any, i: number) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={styles.col1}>{i + 1}</Text>
              <Text style={styles.col2}>{item.name}</Text>
              <Text style={styles.col3}>{item.quantity}</Text>
              <Text style={styles.col4}>₹{item.unitPrice.toLocaleString()}</Text>
              <Text style={styles.col5}>₹{item.totalPrice.toLocaleString()}</Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={styles.totalsArea}>
          <View style={styles.totalRow}>
            <Text>Subtotal:</Text>
            <Text>₹{invoice.subtotal.toLocaleString()}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text>Tax ({invoice.taxRate}%):</Text>
            <Text>₹{invoice.taxAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.grandTotal}>
            <Text>Total Amount:</Text>
            <Text>₹{invoice.totalAmount.toLocaleString()}</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Thank you for your business. Terms and conditions apply.</Text>
          <Text>Generated via VendorBridge Procurement ERP on {format(new Date(), "PPp")}</Text>
        </View>
      </Page>
    </Document>
  );
};
