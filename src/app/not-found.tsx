import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full border border-[#ded7c8] bg-[#f3efe6] p-8 text-center space-y-4">
        <span className="text-4xl font-serif text-[#9e472a]">404</span>
        <h1 className="text-xl font-serif tracking-tight text-[#1a1918]">
          Page Not Found
        </h1>
        <p className="text-xs text-[#57534e]">
          The requested resource could not be found or has been moved.
        </p>
        <div className="pt-4 border-t border-[#ded7c8]">
          <Link
            href="/"
            className="inline-block px-4 py-2 bg-[#1a1918] text-[#fbf9f5] text-xs uppercase tracking-wider font-mono hover:bg-[#2e2c2a] transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    </main>
  );
}
