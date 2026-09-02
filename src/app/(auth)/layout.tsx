import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent to-[#a85f17] font-display text-base font-bold text-[#221202]">
          GS
        </span>
        <span className="font-display text-lg font-semibold text-ink">Go Sheros</span>
      </Link>
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-8 shadow-[0_1px_2px_rgba(19,32,30,0.04),0_8px_24px_-12px_rgba(19,32,30,0.14)]">
        {children}
      </div>
    </div>
  );
}
