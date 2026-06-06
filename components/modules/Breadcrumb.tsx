"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumb() {
  const pathname = usePathname();
  
  if (pathname === "/dashboard") return null;

  const paths = pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center text-sm font-medium text-slate-500 mb-6" aria-label="Breadcrumb">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-slate-900 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join("/")}`;
        const isLast = index === paths.length - 1;
        // Format path (e.g., "purchase-orders" -> "Purchase Orders")
        const formattedPath = path
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        // Basic check if path is an ID (long alphanumeric string)
        // If it is, we might just want to show "Details" or a truncated version
        const isId = path.length > 20 && /^[a-zA-Z0-9]+$/.test(path);
        const displayName = isId ? "Details" : formattedPath;

        return (
          <div key={path} className="flex items-center">
            <ChevronRight className="w-4 h-4 mx-2 text-slate-300" />
            {isLast ? (
              <span className="text-slate-900" aria-current="page">
                {displayName}
              </span>
            ) : (
               // In a real app we might not want intermediate links for things like /rfqs/new where new isn't a directory,
               // but this serves as a basic dynamic breadcrumb
              <Link href={href} className="hover:text-slate-900 transition-colors">
                {displayName}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
