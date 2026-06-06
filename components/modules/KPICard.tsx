import { cn } from "@/lib/utils";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: {
    value: number; // percentage
    isPositive: boolean;
    label?: string;
  };
  description?: string;
  className?: string;
}

export function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  className,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 p-6 shadow-sm transition-all hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-500">{title}</h3>
        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
      </div>
      
      <div className="flex items-baseline gap-4">
        <div className="text-2xl font-bold text-slate-900 tracking-tight">
          {value}
        </div>
        
        {trend && (
          <div
            className={cn(
              "flex items-center text-xs font-medium",
              trend.isPositive ? "text-emerald-600" : "text-red-600"
            )}
          >
            {trend.isPositive ? (
              <ArrowUpIcon className="w-3.5 h-3.5 mr-1" />
            ) : (
              <ArrowDownIcon className="w-3.5 h-3.5 mr-1" />
            )}
            {Math.abs(trend.value)}%
            {trend.label && <span className="text-slate-400 ml-1 font-normal">{trend.label}</span>}
          </div>
        )}
      </div>
      
      {description && (
        <p className="text-xs text-slate-500 mt-2">{description}</p>
      )}
    </div>
  );
}
