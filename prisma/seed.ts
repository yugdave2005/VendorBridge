import { PrismaClient, Role, VendorStatus, RFQStatus, QuotationStatus, ApprovalStatus, PurchaseOrderStatus, InvoiceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  // Clean existing data
  await prisma.$transaction([
    prisma.activityLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.oTP.deleteMany(),
    prisma.attachment.deleteMany(),
    prisma.quotationItem.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.purchaseOrder.deleteMany(),
    prisma.approval.deleteMany(),
    prisma.quotation.deleteMany(),
    prisma.rFQVendor.deleteMany(),
    prisma.rFQItem.deleteMany(),
    prisma.rFQ.deleteMany(),
    prisma.vendor.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ─── USERS ───────────────────────────────────────────────────────────────────

  const adminHash = await hashPassword("Admin@123");
  const officerHash = await hashPassword("Officer@123");
  const managerHash = await hashPassword("Manager@123");
  const vendorHash = await hashPassword("Vendor@123");

  const admin = await prisma.user.create({
    data: {
      email: "admin@vendorbridge.com",
      passwordHash: adminHash,
      name: "System Admin",
      role: Role.ADMIN,
    },
  });

  const officer1 = await prisma.user.create({
    data: {
      email: "officer1@vendorbridge.com",
      passwordHash: officerHash,
      name: "Rajesh Kumar",
      role: Role.PROCUREMENT_OFFICER,
    },
  });

  const officer2 = await prisma.user.create({
    data: {
      email: "officer2@vendorbridge.com",
      passwordHash: officerHash,
      name: "Priya Sharma",
      role: Role.PROCUREMENT_OFFICER,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: "manager@vendorbridge.com",
      passwordHash: managerHash,
      name: "Anil Mehta",
      role: Role.MANAGER,
    },
  });

  const vendorUser1 = await prisma.user.create({
    data: {
      email: "vendor1@vendorbridge.com",
      passwordHash: vendorHash,
      name: "Suresh Patel",
      role: Role.VENDOR,
    },
  });

  const vendorUser2 = await prisma.user.create({
    data: {
      email: "vendor2@vendorbridge.com",
      passwordHash: vendorHash,
      name: "Meena Iyer",
      role: Role.VENDOR,
    },
  });

  const vendorUser3 = await prisma.user.create({
    data: {
      email: "vendor3@vendorbridge.com",
      passwordHash: vendorHash,
      name: "Vikram Singh",
      role: Role.VENDOR,
    },
  });

  // ─── VENDORS ─────────────────────────────────────────────────────────────────

  const vendor1 = await prisma.vendor.create({
    data: {
      userId: vendorUser1.id,
      companyName: "TechSupply India Pvt. Ltd.",
      category: "IT Services",
      gstNumber: "27AAPFT1234F1ZH",
      panNumber: "AAPFT1234F",
      address: "Tower B, Cyber City, Gurugram, Haryana 122002",
      phone: "+91-9876543210",
      status: VendorStatus.APPROVED,
      rating: 4.5,
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      userId: vendorUser2.id,
      companyName: "OfficeMax Solutions",
      category: "Office Supplies",
      gstNumber: "29AAPFO5678G1ZK",
      panNumber: "AAPFO5678G",
      address: "MG Road, Bengaluru, Karnataka 560001",
      phone: "+91-9876543211",
      status: VendorStatus.APPROVED,
      rating: 4.2,
    },
  });

  const vendor3 = await prisma.vendor.create({
    data: {
      userId: vendorUser3.id,
      companyName: "BuildRight Materials",
      category: "Construction",
      gstNumber: "07AAPFB9012H1ZL",
      panNumber: "AAPFB9012H",
      address: "Connaught Place, New Delhi 110001",
      phone: "+91-9876543212",
      status: VendorStatus.APPROVED,
      rating: 3.8,
    },
  });

  // ─── RFQ 1 — Published with 3 items, all vendors invited ──────────────────

  const rfq1 = await prisma.rFQ.create({
    data: {
      rfqNumber: "RFQ-2024-0001",
      title: "Annual IT Equipment Procurement",
      description: "Procurement of laptops, monitors, and networking equipment for the upcoming fiscal year. All items must meet enterprise-grade specifications.",
      deadline: new Date("2024-12-31T23:59:59Z"),
      status: RFQStatus.PUBLISHED,
      createdById: officer1.id,
    },
  });

  await prisma.rFQItem.createMany({
    data: [
      { rfqId: rfq1.id, name: "Business Laptop (i7, 16GB, 512GB SSD)", description: "Enterprise-grade laptop with Windows 11 Pro", quantity: 50, unit: "units" },
      { rfqId: rfq1.id, name: "27-inch 4K Monitor", description: "IPS panel, USB-C connectivity, adjustable stand", quantity: 50, unit: "units" },
      { rfqId: rfq1.id, name: "Network Switch (48-port)", description: "Managed switch with PoE+ support", quantity: 10, unit: "units" },
    ],
  });

  await prisma.rFQVendor.createMany({
    data: [
      { rfqId: rfq1.id, vendorId: vendor1.id },
      { rfqId: rfq1.id, vendorId: vendor2.id },
      { rfqId: rfq1.id, vendorId: vendor3.id },
    ],
  });

  // ─── RFQ 2 — Published with 3 items, all vendors invited ──────────────────

  const rfq2 = await prisma.rFQ.create({
    data: {
      rfqNumber: "RFQ-2024-0002",
      title: "Office Furniture Refresh Program",
      description: "Complete office furniture upgrade including ergonomic chairs, standing desks, and modular workstations.",
      deadline: new Date("2025-01-31T23:59:59Z"),
      status: RFQStatus.PUBLISHED,
      createdById: officer2.id,
    },
  });

  await prisma.rFQItem.createMany({
    data: [
      { rfqId: rfq2.id, name: "Ergonomic Office Chair", description: "Mesh back, adjustable armrests, lumbar support", quantity: 100, unit: "units" },
      { rfqId: rfq2.id, name: "Standing Desk (Electric)", description: "Height adjustable 60x30 inch, dual motor", quantity: 50, unit: "units" },
      { rfqId: rfq2.id, name: "Modular Workstation Partition", description: "Acoustic panel, 6ft height", quantity: 30, unit: "units" },
    ],
  });

  await prisma.rFQVendor.createMany({
    data: [
      { rfqId: rfq2.id, vendorId: vendor1.id },
      { rfqId: rfq2.id, vendorId: vendor2.id },
      { rfqId: rfq2.id, vendorId: vendor3.id },
    ],
  });

  // ─── RFQ 3 — With submitted quotations (for comparison demo) ──────────────

  const rfq3 = await prisma.rFQ.create({
    data: {
      rfqNumber: "RFQ-2024-0003",
      title: "Server Room Infrastructure Upgrade",
      description: "Procurement of server hardware, UPS systems, and cooling units for the data center expansion.",
      deadline: new Date("2025-03-31T23:59:59Z"),
      status: RFQStatus.PUBLISHED,
      createdById: officer1.id,
    },
  });

  const rfq3Item1 = await prisma.rFQItem.create({
    data: { rfqId: rfq3.id, name: "Rack Server (2U)", description: "Dual Xeon, 128GB RAM, 4x 2TB NVMe", quantity: 5, unit: "units" },
  });
  const rfq3Item2 = await prisma.rFQItem.create({
    data: { rfqId: rfq3.id, name: "Online UPS (10kVA)", description: "True double conversion, 30-min battery backup", quantity: 3, unit: "units" },
  });
  const rfq3Item3 = await prisma.rFQItem.create({
    data: { rfqId: rfq3.id, name: "Precision Cooling Unit", description: "In-row cooling, 20kW capacity", quantity: 2, unit: "units" },
  });
  const rfq3Items = [rfq3Item1, rfq3Item2, rfq3Item3];

  await prisma.rFQVendor.createMany({
    data: [
      { rfqId: rfq3.id, vendorId: vendor1.id },
      { rfqId: rfq3.id, vendorId: vendor2.id },
      { rfqId: rfq3.id, vendorId: vendor3.id },
    ],
  });

  // Quotation from Vendor 1 (lowest price)
  const qt1 = await prisma.quotation.create({
    data: {
      quotationNumber: "QT-2024-0001",
      rfqId: rfq3.id,
      vendorId: vendor1.id,
      status: QuotationStatus.SUBMITTED,
      subtotal: 2850000,
      taxRate: 18,
      taxAmount: 513000,
      totalAmount: 3363000,
      deliveryDays: 21,
      validUntil: new Date("2025-04-30T23:59:59Z"),
      notes: "Includes free installation and 3-year warranty.",
    },
  });

  await prisma.quotationItem.createMany({
    data: [
      { quotationId: qt1.id, rfqItemId: rfq3Items[0].id, name: rfq3Items[0].name, quantity: 5, unitPrice: 350000, totalPrice: 1750000 },
      { quotationId: qt1.id, rfqItemId: rfq3Items[1].id, name: rfq3Items[1].name, quantity: 3, unitPrice: 250000, totalPrice: 750000 },
      { quotationId: qt1.id, rfqItemId: rfq3Items[2].id, name: rfq3Items[2].name, quantity: 2, unitPrice: 175000, totalPrice: 350000 },
    ],
  });

  // Quotation from Vendor 2 (mid price)
  const qt2 = await prisma.quotation.create({
    data: {
      quotationNumber: "QT-2024-0002",
      rfqId: rfq3.id,
      vendorId: vendor2.id,
      status: QuotationStatus.SUBMITTED,
      subtotal: 3100000,
      taxRate: 18,
      taxAmount: 558000,
      totalAmount: 3658000,
      deliveryDays: 14,
      validUntil: new Date("2025-04-15T23:59:59Z"),
      notes: "Express delivery available. 2-year warranty included.",
    },
  });

  await prisma.quotationItem.createMany({
    data: [
      { quotationId: qt2.id, rfqItemId: rfq3Items[0].id, name: rfq3Items[0].name, quantity: 5, unitPrice: 380000, totalPrice: 1900000 },
      { quotationId: qt2.id, rfqItemId: rfq3Items[1].id, name: rfq3Items[1].name, quantity: 3, unitPrice: 280000, totalPrice: 840000 },
      { quotationId: qt2.id, rfqItemId: rfq3Items[2].id, name: rfq3Items[2].name, quantity: 2, unitPrice: 180000, totalPrice: 360000 },
    ],
  });

  // Quotation from Vendor 3 (highest price)
  const qt3 = await prisma.quotation.create({
    data: {
      quotationNumber: "QT-2024-0003",
      rfqId: rfq3.id,
      vendorId: vendor3.id,
      status: QuotationStatus.SUBMITTED,
      subtotal: 3400000,
      taxRate: 18,
      taxAmount: 612000,
      totalAmount: 4012000,
      deliveryDays: 30,
      validUntil: new Date("2025-05-31T23:59:59Z"),
      notes: "Premium grade equipment. 5-year comprehensive warranty.",
    },
  });

  await prisma.quotationItem.createMany({
    data: [
      { quotationId: qt3.id, rfqItemId: rfq3Items[0].id, name: rfq3Items[0].name, quantity: 5, unitPrice: 420000, totalPrice: 2100000 },
      { quotationId: qt3.id, rfqItemId: rfq3Items[1].id, name: rfq3Items[1].name, quantity: 3, unitPrice: 300000, totalPrice: 900000 },
      { quotationId: qt3.id, rfqItemId: rfq3Items[2].id, name: rfq3Items[2].name, quantity: 2, unitPrice: 200000, totalPrice: 400000 },
    ],
  });

  // ─── RFQ 4 — Full happy-path chain ────────────────────────────────────────

  const rfq4 = await prisma.rFQ.create({
    data: {
      rfqNumber: "RFQ-2024-0004",
      title: "Security System Installation",
      description: "Complete security system including CCTV cameras, access control, and alarm systems.",
      deadline: new Date("2024-11-30T23:59:59Z"),
      status: RFQStatus.CLOSED,
      createdById: officer1.id,
    },
  });

  const rfq4Item1 = await prisma.rFQItem.create({
    data: { rfqId: rfq4.id, name: "IP CCTV Camera (4K)", description: "Outdoor rated, night vision, AI motion detection", quantity: 20, unit: "units" },
  });
  const rfq4Item2 = await prisma.rFQItem.create({
    data: { rfqId: rfq4.id, name: "NVR (32-channel)", description: "H.265+, RAID support, 8TB included", quantity: 2, unit: "units" },
  });
  const rfq4Item3 = await prisma.rFQItem.create({
    data: { rfqId: rfq4.id, name: "Access Control System", description: "Biometric + card reader, 10 doors", quantity: 1, unit: "set" },
  });
  const rfq4Items = [rfq4Item1, rfq4Item2, rfq4Item3];

  await prisma.rFQVendor.createMany({
    data: [
      { rfqId: rfq4.id, vendorId: vendor1.id },
      { rfqId: rfq4.id, vendorId: vendor2.id },
    ],
  });

  // Approved quotation
  const approvedQt = await prisma.quotation.create({
    data: {
      quotationNumber: "QT-2024-0004",
      rfqId: rfq4.id,
      vendorId: vendor1.id,
      status: QuotationStatus.ACCEPTED,
      subtotal: 1450000,
      taxRate: 18,
      taxAmount: 261000,
      totalAmount: 1711000,
      deliveryDays: 15,
      validUntil: new Date("2025-01-31T23:59:59Z"),
      notes: "All equipment comes with 3-year warranty and installation.",
    },
  });

  await prisma.quotationItem.createMany({
    data: [
      { quotationId: approvedQt.id, rfqItemId: rfq4Items[0].id, name: rfq4Items[0].name, quantity: 20, unitPrice: 45000, totalPrice: 900000 },
      { quotationId: approvedQt.id, rfqItemId: rfq4Items[1].id, name: rfq4Items[1].name, quantity: 2, unitPrice: 175000, totalPrice: 350000 },
      { quotationId: approvedQt.id, rfqItemId: rfq4Items[2].id, name: rfq4Items[2].name, quantity: 1, unitPrice: 200000, totalPrice: 200000 },
    ],
  });

  // Rejected quotation from vendor 2
  await prisma.quotation.create({
    data: {
      quotationNumber: "QT-2024-0005",
      rfqId: rfq4.id,
      vendorId: vendor2.id,
      status: QuotationStatus.REJECTED,
      subtotal: 1680000,
      taxRate: 18,
      taxAmount: 302400,
      totalAmount: 1982400,
      deliveryDays: 25,
      validUntil: new Date("2025-01-15T23:59:59Z"),
      notes: "Standard equipment with 1-year warranty.",
    },
  });

  // Approval record
  await prisma.approval.create({
    data: {
      quotationId: approvedQt.id,
      approverId: manager.id,
      status: ApprovalStatus.APPROVED,
      remarks: "Best value for money. Vendor has good track record. Approved.",
      requestedAt: new Date("2024-11-15T10:00:00Z"),
      resolvedAt: new Date("2024-11-16T14:30:00Z"),
    },
  });

  // Purchase Order
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2024-0001",
      quotationId: approvedQt.id,
      vendorId: vendor1.id,
      status: PurchaseOrderStatus.CONFIRMED,
      totalAmount: 1711000,
      deliveryDate: new Date("2024-12-01T23:59:59Z"),
      terms: "Net 30 days. Delivery at registered office. Installation included.",
    },
  });

  // Invoice
  await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2024-0001",
      purchaseOrderId: po.id,
      status: InvoiceStatus.SENT,
      subtotal: 1450000,
      taxRate: 18,
      taxAmount: 261000,
      totalAmount: 1711000,
      dueDate: new Date("2025-01-01T23:59:59Z"),
      notes: "Payment due within 30 days of invoice date.",
    },
  });

  // ─── ACTIVITY LOGS ───────────────────────────────────────────────────────────

  const activities = [
    { userId: admin.id, action: "USER_CREATED", entityType: "USER", entityId: officer1.id, metadata: { role: "PROCUREMENT_OFFICER" } },
    { userId: officer1.id, action: "RFQ_CREATED", entityType: "RFQ", entityId: rfq1.id, metadata: { rfqNumber: "RFQ-2024-0001" } },
    { userId: officer1.id, action: "RFQ_PUBLISHED", entityType: "RFQ", entityId: rfq1.id, metadata: { rfqNumber: "RFQ-2024-0001" } },
    { userId: officer2.id, action: "RFQ_CREATED", entityType: "RFQ", entityId: rfq2.id, metadata: { rfqNumber: "RFQ-2024-0002" } },
    { userId: officer2.id, action: "RFQ_PUBLISHED", entityType: "RFQ", entityId: rfq2.id, metadata: { rfqNumber: "RFQ-2024-0002" } },
    { userId: vendorUser1.id, action: "QUOTATION_SUBMITTED", entityType: "QUOTATION", entityId: qt1.id, metadata: { quotationNumber: "QT-2024-0001" } },
    { userId: vendorUser2.id, action: "QUOTATION_SUBMITTED", entityType: "QUOTATION", entityId: qt2.id, metadata: { quotationNumber: "QT-2024-0002" } },
    { userId: vendorUser3.id, action: "QUOTATION_SUBMITTED", entityType: "QUOTATION", entityId: qt3.id, metadata: { quotationNumber: "QT-2024-0003" } },
    { userId: officer1.id, action: "APPROVAL_REQUESTED", entityType: "QUOTATION", entityId: approvedQt.id, metadata: { quotationNumber: "QT-2024-0004" } },
    { userId: manager.id, action: "QUOTATION_APPROVED", entityType: "QUOTATION", entityId: approvedQt.id, metadata: { quotationNumber: "QT-2024-0004" } },
    { userId: null as string | null, action: "PO_GENERATED", entityType: "PURCHASE_ORDER", entityId: po.id, metadata: { poNumber: "PO-2024-0001" } },
    { userId: officer1.id, action: "INVOICE_GENERATED", entityType: "INVOICE", entityId: "inv-placeholder", metadata: { invoiceNumber: "INV-2024-0001" } },
  ];

  for (const activity of activities) {
    await prisma.activityLog.create({
      data: {
        userId: activity.userId,
        action: activity.action,
        entityType: activity.entityType,
        entityId: activity.entityId,
        metadata: activity.metadata,
      },
    });
  }

  // ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

  await prisma.notification.createMany({
    data: [
      { userId: vendorUser1.id, title: "New RFQ Invitation", message: "You have been invited to submit a quotation for RFQ-2024-0001", link: "/rfqs/" + rfq1.id },
      { userId: vendorUser2.id, title: "New RFQ Invitation", message: "You have been invited to submit a quotation for RFQ-2024-0001", link: "/rfqs/" + rfq1.id },
      { userId: vendorUser3.id, title: "New RFQ Invitation", message: "You have been invited to submit a quotation for RFQ-2024-0001", link: "/rfqs/" + rfq1.id },
      { userId: manager.id, title: "Approval Required", message: "A quotation for RFQ-2024-0004 requires your approval", link: "/approvals", isRead: true },
      { userId: vendorUser1.id, title: "Purchase Order Generated", message: "A purchase order PO-2024-0001 has been generated for your quotation", link: "/purchase-orders/" + po.id },
      { userId: officer1.id, title: "Quotation Received", message: "Vendor TechSupply India submitted a quotation for RFQ-2024-0003", link: "/rfqs/" + rfq3.id },
    ],
  });

  /* eslint-disable no-console */
  console.log("✅ Seed data created successfully!");
  console.log("");
  console.log("Test Users:");
  console.log("─────────────────────────────────────────────");
  console.log("Admin:    admin@vendorbridge.com     / Admin@123");
  console.log("Officer1: officer1@vendorbridge.com  / Officer@123");
  console.log("Officer2: officer2@vendorbridge.com  / Officer@123");
  console.log("Manager:  manager@vendorbridge.com   / Manager@123");
  console.log("Vendor1:  vendor1@vendorbridge.com   / Vendor@123");
  console.log("Vendor2:  vendor2@vendorbridge.com   / Vendor@123");
  console.log("Vendor3:  vendor3@vendorbridge.com   / Vendor@123");
  /* eslint-enable no-console */
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
