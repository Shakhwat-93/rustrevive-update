import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "editorial" | "outline-light" | "outline-dark";
  size?: "sm" | "md" | "lg";
  href?: string;
  showArrow?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  href,
  showArrow = false,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-mono-meta uppercase text-xs tracking-[0.2em] transition-all duration-300 select-none group cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#9e472a]";

  const sizeClasses = {
    sm: "px-4 py-2 text-[10px]",
    md: "px-6 py-3.5 text-[11px]",
    lg: "px-8 py-4.5 text-xs",
  };

  const variantClasses = {
    primary:
      "bg-[#9e472a] text-[#ffffff] hover:bg-[#b85433] active:scale-[0.98] shadow-sm",
    secondary:
      "bg-[#1c1a18] text-[#fbf9f5] hover:bg-[#262421] border border-[#383530] active:scale-[0.98]",
    editorial:
      "bg-transparent text-current hover:text-[#9e472a] p-0 font-medium tracking-[0.22em] border-b border-current hover:border-[#9e472a] pb-1",
    "outline-light":
      "bg-transparent text-[#fbf9f5] border border-[#383530] hover:border-[#fbf9f5] hover:bg-[#fbf9f5] hover:text-[#0e0d0c]",
    "outline-dark":
      "bg-transparent text-[#141312] border border-[#ded7c8] hover:border-[#141312] hover:bg-[#141312] hover:text-[#fbf9f5]",
  };

  const isEditorial = variant === "editorial";
  const appliedSize = isEditorial ? "" : sizeClasses[size];

  const content = (
    <>
      <span>{children}</span>
      {(showArrow || isEditorial) && (
        <ArrowRight className="w-3.5 h-3.5 ml-2 transform transition-transform duration-300 group-hover:translate-x-1" />
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseClasses} ${appliedSize} ${variantClasses[variant]} ${className}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      className={`${baseClasses} ${appliedSize} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {content}
    </button>
  );
}
