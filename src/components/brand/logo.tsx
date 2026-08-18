import Link from "next/link";

interface LogoProps {
  variant?: "light" | "dark" | "auto";
  size?: "sm" | "md" | "lg";
  className?: string;
  showTagline?: boolean;
}

export function Logo({
  variant = "auto",
  size = "md",
  className = "",
  showTagline = false,
}: LogoProps) {
  const sizeClasses = {
    sm: "text-lg tracking-widest",
    md: "text-xl md:text-2xl tracking-[0.25em]",
    lg: "text-3xl md:text-4xl tracking-[0.28em]",
  };

  const colorClasses = {
    light: "text-[#141312]",
    dark: "text-[#fbf9f5]",
    auto: "text-current",
  };

  return (
    <Link
      href="/"
      className={`inline-flex flex-col items-start select-none group transition-opacity hover:opacity-90 ${className}`}
      aria-label="Rust & Revive Home"
    >
      <div className={`font-serif-editorial font-medium uppercase leading-none ${sizeClasses[size]} ${colorClasses[variant]}`}>
        <span>RUST</span>
        <span className="text-[#9e472a] font-normal mx-1">&amp;</span>
        <span>REVIVE</span>
      </div>
      {showTagline && (
        <span className="text-[9px] uppercase tracking-[0.3em] text-[#9c9689] font-mono-meta mt-1">
          Dhaka / Est. 2026
        </span>
      )}
    </Link>
  );
}
