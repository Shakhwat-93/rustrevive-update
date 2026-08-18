import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  actionHref?: string;
  theme?: "dark" | "light";
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  actionText,
  actionHref,
  theme = "dark",
  className = "",
}: SectionHeaderProps) {
  const isLight = theme === "light";

  return (
    <div
      className={`w-full flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 md:pb-6 border-b ${
        isLight ? "border-[#ded7c8]" : "border-[#262421]"
      } ${className}`}
    >
      <div className="space-y-1">
        <h2
          className={`font-serif-editorial text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight ${
            isLight ? "text-[#141312]" : "text-[#fbf9f5]"
          }`}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={`text-xs md:text-sm font-sans-ui ${
              isLight ? "text-[#5c574e]" : "text-[#9c9689]"
            }`}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actionText && actionHref && (
        <Link
          href={actionHref}
          className={`text-xs font-mono-meta uppercase tracking-[0.2em] flex items-center group transition-colors pb-0.5 ${
            isLight
              ? "text-[#141312] hover:text-[#9e472a]"
              : "text-[#9c9689] hover:text-[#fbf9f5]"
          }`}
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1.5 transform transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
