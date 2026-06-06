import { cn } from "@/lib/utils";

type StatusVariant = 
  | "success" 
  | "warning" 
  | "error" 
  | "info" 
  | "neutral";

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

// Maps common database enums to variants automatically
function getAutoVariant(status: string): StatusVariant {
  const s = status.toLowerCase();
  
  if (["approved", "completed", "published", "active", "accepted", "confirmed", "paid"].includes(s)) {
    return "success";
  }
  if (["pending", "review", "draft", "submitted", "processing"].includes(s)) {
    return "warning";
  }
  if (["rejected", "cancelled", "closed", "failed", "overdue", "blacklisted"].includes(s)) {
    return "error";
  }
  if (["sent", "invited", "in_progress"].includes(s)) {
    return "info";
  }
  return "neutral";
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const activeVariant = variant || getAutoVariant(status);
  
  // Format string from UPPER_SNAKE to Title Case
  const displayStatus = status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  const variants = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 border-amber-200/60",
    error: "bg-red-50 text-red-700 border-red-200/60",
    info: "bg-blue-50 text-blue-700 border-blue-200/60",
    neutral: "bg-slate-50 text-slate-700 border-slate-200/60",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        variants[activeVariant],
        className
      )}
    >
      {/* Optional dot indicator */}
      <span 
        className={cn(
          "w-1.5 h-1.5 rounded-full mr-1.5",
          activeVariant === "success" && "bg-emerald-500",
          activeVariant === "warning" && "bg-amber-500",
          activeVariant === "error" && "bg-red-500",
          activeVariant === "info" && "bg-blue-500",
          activeVariant === "neutral" && "bg-slate-400"
        )} 
      />
      {displayStatus}
    </span>
  );
}
