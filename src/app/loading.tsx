export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#9e472a] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs uppercase tracking-widest text-[#57534e] font-mono">
          Loading...
        </span>
      </div>
    </div>
  );
}
