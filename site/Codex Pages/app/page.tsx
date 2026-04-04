import Link from "next/link";
import { AdminModeBadge } from "@/components/admin-mode-badge";
import { FooterBlock } from "@/components/footer-block";
import { PageShell } from "@/components/page-shell";
import { RichText } from "@/components/rich-text";
import { SliderModule } from "@/components/slider-module";
import { getLandingContent, getPageChrome } from "@/lib/content";
import { isAuthenticated } from "@/lib/auth";

export default async function LandingPage() {
  const [landing, chrome, authenticated] = await Promise.all([getLandingContent(), getPageChrome(), isAuthenticated()]);

  return (
    <PageShell title={landing.introTitle} subtitle="Filesystem-backed portfolio concept with editable modules and local admin mode.">
      <section className="action-card-row">
        <Link href="/resume" className="action-card">
          <strong>Resume</strong>
          <span>Open the embedded PDF view and direct download control.</span>
        </Link>
        <Link href="/portfolio" className="action-card">
          <strong>Portfolio</strong>
          <span>Browse auto-discovered summary and slider modules.</span>
        </Link>
      </section>

      <SliderModule heading="Featured Preview" items={landing.slider} />

      <section className="hero-card hero-card--green">
        <div className="card-kicker">Intro</div>
        <h2>{chrome.activityTitle.trim() || "Complimentary Professional Activities"}</h2>
        <RichText text={landing.introBody} />
        <div className="subsidiary-links">
          {chrome.landingLinks.map((link) => (
            <Link href={`/${link.slug}`} key={link.slug} className="subsidiary-link">
              <strong>{link.title}</strong>
              <span>{link.description}</span>
            </Link>
          ))}
        </div>
        {authenticated ? <AdminModeBadge /> : null}
      </section>

      <FooterBlock footer={chrome.footer} />
    </PageShell>
  );
}
