import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  href?: string;
  isLoading?: boolean;
  children: React.ReactNode;
}

export function AdminButton({
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  href,
  isLoading = false,
  children,
  className = "",
  disabled,
  ...props
}: AdminButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-sans font-medium text-xs rounded-lg transition-colors cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: "px-2.5 py-1.5 text-xs space-x-1.5 h-8",
    md: "px-3.5 py-2 text-xs space-x-2 h-9",
    lg: "px-5 py-2.5 text-sm space-x-2.5 h-10",
  };

  const variantClasses = {
    primary:
      "bg-[#9e472a] hover:bg-[#b85433] text-white focus:ring-[#9e472a] shadow-xs active:bg-[#873c22]",
    secondary:
      "bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 focus:ring-slate-400 shadow-2xs",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-300",
    danger:
      "bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-xs",
    outline:
      "bg-transparent hover:bg-slate-100 text-slate-700 border border-slate-300 focus:ring-slate-400",
  };

  const content = (
    <>
      {isLoading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8H4z"
          />
        </svg>
      ) : (
        Icon && iconPosition === "left" && <Icon className="w-3.5 h-3.5" />
      )}
      <span>{children}</span>
      {!isLoading && Icon && iconPosition === "right" && (
        <Icon className="w-3.5 h-3.5" />
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {content}
    </button>
  );
}
