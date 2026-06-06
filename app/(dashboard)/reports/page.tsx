"use client";

import { useQuery } from "@tanstack/react-query";
import { CardSkeleton } from "@/components/modules/SkeletonLoader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Users, ShoppingCart, IndianRupee } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { DataTable } from "@/components/modules/DataTable";
import * as XLSX from "xlsx";
import { format } from "date-fns";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ReportsPage() {
  const { data: dashboardData, isLoading: isDashboardLoading } = useQuery({
    queryKey: ["analytics", "dashboard"],
    queryFn: async () => (await fetch("/api/analytics/dashboard")).json(),
  });

  const { data: rfqTrendsData, isLoading: isTrendsLoading } = useQuery({
    queryKey: ["analytics", "rfq-trends"],
    queryFn: async () => (await fetch("/api/analytics/rfq-trends")).json(),
  });

  const { data: spendingData, isLoading: isSpendingLoading } = useQuery({
    queryKey: ["analytics", "spending"],
    queryFn: async () => (await fetch("/api/analytics/spending")).json(),
  });

  const { data: vendorData, isLoading: isVendorLoading } = useQuery({
    queryKey: ["analytics", "vendor-performance"],
    queryFn: async () => (await fetch("/api/analytics/vendor-performance")).json(),
  });

  const handleExport = (dataArray: any[], sheetName: string, fileName: string) => {
    const ws = XLSX.utils.json_to_sheet(dataArray);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}_${format(new Date(), "yyyyMMdd")}.xlsx`);
  };

  const isLoading = isDashboardLoading || isTrendsLoading || isSpendingLoading || isVendorLoading;

  if (isLoading) return <CardSkeleton />;

  const kpis = dashboardData?.data || { totalRFQs: 0, activeVendors: 0, totalPOs: 0, totalSpent: 0 };
  const rfqTrends = rfqTrendsData?.data || [];
  const spending = spendingData?.data || { byVendor: [], byMonth: [] };
  const vendorPerformance = vendorData?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Data-driven insights for your procurement operations</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Performance</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total RFQs</CardTitle>
                <FileText className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalRFQs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Vendors</CardTitle>
                <Users className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.activeVendors}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Purchase Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalPOs}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
                <IndianRupee className="h-4 w-4 text-slate-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹{(kpis.totalSpent || 0).toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>RFQ Trend (Last 12 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rfqTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <RechartsTooltip />
                    <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Vendor Performance */}
        <TabsContent value="vendors" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable 
                columns={[
                  { accessorKey: "name", header: "Vendor Name" },
                  { accessorKey: "rating", header: "Rating (1-5)" },
                  { accessorKey: "totalQuotes", header: "Total Quotations" },
                  { 
                    accessorKey: "winRate", 
                    header: "Win Rate (%)",
                    cell: ({ row }) => <span className="font-semibold">{row.original.winRate}%</span>
                  },
                ]} 
                data={vendorPerformance} 
                searchKey="name" 
                searchPlaceholder="Search vendors..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Spending Analysis */}
        <TabsContent value="spending" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Vendors by Spend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spending.byVendor}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {spending.byVendor.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Spend Trend (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={spending.byMonth}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
                      <Bar dataKey="amount" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 4: Export */}
        <TabsContent value="export" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-500">Download system data in Excel format for offline analysis.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" onClick={() => handleExport(vendorPerformance, "Vendors", "Vendor_Performance")}>
                  <Download className="w-6 h-6 text-slate-400" />
                  <span>Vendor Performance</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" onClick={() => handleExport(spending.byVendor, "Spend", "Vendor_Spend")}>
                  <Download className="w-6 h-6 text-slate-400" />
                  <span>Spend by Vendor</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" onClick={() => handleExport(spending.byMonth, "MonthlySpend", "Monthly_Spend")}>
                  <Download className="w-6 h-6 text-slate-400" />
                  <span>Monthly Spend Trend</span>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col items-center justify-center gap-2" onClick={() => handleExport(rfqTrends, "RFQs", "RFQ_Trends")}>
                  <Download className="w-6 h-6 text-slate-400" />
                  <span>RFQ Trends</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Icon hack to avoid importing FileText if it overlaps with others
function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}
