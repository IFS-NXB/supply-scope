import Link from "next/link";

export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span className={className} aria-hidden="true">
      <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
        <rect width="40" height="40" rx="11" fill="url(#ss-grad)" />
        <circle cx="20" cy="20" r="11" stroke="white" strokeOpacity="0.45" strokeWidth="1.6" />
        <circle cx="20" cy="20" r="6.5" stroke="white" strokeOpacity="0.75" strokeWidth="1.6" />
        <circle cx="20" cy="20" r="2.4" fill="white" />
        <path d="M20 4.5V9M20 31v4.5M35.5 20H31M9 20H4.5" stroke="white" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" />
        <defs>
          <linearGradient id="ss-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#15803d" />
            <stop offset="0.55" stopColor="#16a34a" />
            <stop offset="1" stopColor="#4ade80" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

export function Logo({
  className = "",
  textClassName = "text-slate-900",
}: {
  className?: string;
  textClassName?: string;
}) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className={`text-lg font-bold tracking-tight ${textClassName}`}>
        Supply<span className="text-brand-600">Scope</span>
      </span>
    </Link>
  );
}
