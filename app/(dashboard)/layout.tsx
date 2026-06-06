"use client";

import { useSidebarStore } from "@/lib/stores/sidebar-store";
import { Sidebar } from "@/components/modules/Sidebar";
import { Navbar } from "@/components/modules/Navbar";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen } = useSidebarStore();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  if (status === "loading" || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar userRole={session.user.role as Role} />
      <Navbar user={session.user} />

      <main
        className={cn(
          "pt-24 pb-8 px-4 lg:px-8 transition-all duration-300 min-h-screen",
          isOpen ? "ml-64" : "ml-20"
        )}
      >
        <div className="max-w-7xl mx-auto">
          <Breadcrumb />
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
