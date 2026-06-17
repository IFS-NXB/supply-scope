import Link from "next/link";
import { LogoMark } from "@/components/logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="container-page flex flex-col items-center justify-between gap-6 py-10 sm:flex-row">
        <div className="flex items-center gap-2.5">
          <LogoMark className="h-7 w-7" />
          <span className="text-sm text-slate-500">
            © {new Date().getFullYear()} SupplyScope — Product Idea Intelligence
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-brand-700">Dashboard</Link>
          <Link href="/submit" className="hover:text-brand-700">Submit idea</Link>
          <Link href="/#how-it-works" className="hover:text-brand-700">How it works</Link>
        </div>
      </div>
    </footer>
  );
}
