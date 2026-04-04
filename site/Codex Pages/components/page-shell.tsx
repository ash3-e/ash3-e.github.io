import Link from "next/link";
import { isAuthenticated } from "@/lib/auth";

export async function PageShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const authenticated = await isAuthenticated();
  return (
    <div className="site-shell">
      <div className="page-wrap">
        <header className="topbar">
          <div className="brand-lockup">
            <div className="eyebrow">Codex Pages Prototype</div>
            <h1 className="brand-title">{title}</h1>
            <p className="brand-subtitle">{subtitle}</p>
          </div>
          <div className="topbar-actions">
            <Link href="/" className="pill-link">Home</Link>
            <Link href="/portfolio" className="pill-link">Portfolio</Link>
            <Link href="/resume" className="pill-link">Resume</Link>
            <Link href={authenticated ? "/admin" : "/admin/login"} className="pill-link">{authenticated ? "Admin" : "Login"}</Link>
          </div>
        </header>
        <main className="page-grid">{children}</main>
      </div>
    </div>
  );
}
