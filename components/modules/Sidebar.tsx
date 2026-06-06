"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Users,
  FileText,
  FileSpreadsheet,
  CheckSquare,
  ShoppingCart,
  Receipt,
  History,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.VENDOR, Role.MANAGER],
  },
  {
    title: "Vendors",
    href: "/vendors",
    icon: Users,
    roles: [Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.MANAGER],
  },
  {
    title: "RFQs",
    href: "/rfqs",
    icon: FileText,
    roles: [Role.ADMIN, Role.PROCUREMENT_OFFICER, Role.VENDOR, Role.MANAGER],
  },
  {
    title: "Quotations",
    href: "/quotations",
    icon: FileSpreadsheet,
    roles: [Role.PROCUREMENT_OFFICER, Role.VENDOR, Role.MANAGER],
  },
  {
    title: "Approvals",
    href: "/approvals",
    icon: CheckSquare,
    roles: [Role.MANAGER, Role.ADMIN],
  },
  {
    title: "Purchase Orders",
    href: "/purchase-orders",
    icon: ShoppingCart,
    roles: [Role.PROCUREMENT_OFFICER, Role.VENDOR, Role.MANAGER],
  },
  {
    title: "Invoices",
    href: "/invoices",
    icon: Receipt,
    roles: [Role.PROCUREMENT_OFFICER, Role.VENDOR, Role.MANAGER],
  },
  {
    title: "Activity Logs",
    href: "/activity-logs",
    icon: History,
    roles: [Role.ADMIN],
  },
  {
    title: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: [Role.ADMIN, Role.MANAGER],
  },
];

export function Sidebar({ userRole }: { userRole: Role }) {
  const pathname = usePathname();
  const { isOpen, toggle } = useSidebarStore();

  const filteredItems = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 border-r border-slate-800",
        isOpen ? "w-64" : "w-20"
      )}
    >
      {/* Header */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-800">
        <div
          className={cn(
            "flex items-center gap-3 overflow-hidden transition-all duration-300",
            !isOpen && "w-0 opacity-0"
          )}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/25">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <span className="font-bold text-white text-lg tracking-tight whitespace-nowrap">
            VendorBridge
          </span>
        </div>

        <button
          onClick={toggle}
          className={cn(
            "p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors",
            !isOpen && "mx-auto"
          )}
          aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
        <nav className="space-y-1.5 px-3">
          {filteredItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  isActive
                    ? "bg-blue-600/10 text-blue-400 font-medium"
                    : "hover:bg-slate-800 hover:text-white"
                )}
                title={!isOpen ? item.title : undefined}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive ? "text-blue-400" : "text-slate-400 group-hover:text-white"
                  )}
                />
                <span
                  className={cn(
                    "whitespace-nowrap transition-all duration-300",
                    !isOpen && "w-0 opacity-0 hidden"
                  )}
                >
                  {item.title}
                </span>

                {/* Active Indicator Line */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Settings */}
      <div className="p-4 border-t border-slate-800 shrink-0">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition-all group",
            pathname.startsWith("/settings") && "bg-slate-800 text-white"
          )}
          title={!isOpen ? "Settings" : undefined}
        >
          <Settings className="w-5 h-5 text-slate-400 group-hover:text-white" />
          <span
            className={cn(
              "whitespace-nowrap transition-all duration-300",
              !isOpen && "w-0 opacity-0 hidden"
            )}
          >
            Settings
          </span>
        </Link>
      </div>
    </aside>
  );
}
