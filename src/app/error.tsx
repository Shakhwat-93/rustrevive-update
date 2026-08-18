"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error logged to client boundary
    console.error("Global React Error Boundary caught:", error);
  }, [error]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full border border-[#ded7c8] bg-[#f3efe6] p-8 text-center space-y-4 shadow-sm">
        <span className="text-3xl font-serif text-[#9e472a]">Notice</span>
        <h2 className="text-xl font-serif tracking-tight text-[#1a1918]">
          Something went wrong
        </h2>
        <p className="text-xs text-[#57534e]">
          An unexpected application error occurred. Our team has been notified.
        </p>
        <div className="pt-4 border-t border-[#ded7c8]">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-[#1a1918] text-[#fbf9f5] text-xs uppercase tracking-wider font-mono hover:bg-[#2e2c2a] transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
