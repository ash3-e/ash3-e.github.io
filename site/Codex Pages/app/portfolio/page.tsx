import { FooterBlock } from "@/components/footer-block";
import { HomeButton } from "@/components/home-button";
import { PageShell } from "@/components/page-shell";
import { RichText } from "@/components/rich-text";
import { SliderModule } from "@/components/slider-module";
import { getPageChrome, getPortfolioContent } from "@/lib/content";

export default async function PortfolioPage() {
  const [portfolio, chrome] = await Promise.all([getPortfolioContent(), getPageChrome()]);

  return (
    <PageShell title={portfolio.title} subtitle="Auto-discovered filesystem content groups rendered as stacked portfolio modules.">
      <section className="summary-card">
        <div className="card-kicker">Portfolio overview</div>
        <h2>Welcome to my Portfolio</h2>
        <RichText text={portfolio.welcomeText} />
      </section>

      {portfolio.groups.map((group, index) => (
        <section key={group.key} className="stack">
          <div className="summary-card">
            <div className="card-kicker">Summary {index + 1}</div>
            <h2>Section {group.key}</h2>
            <RichText text={group.summary} />
          </div>
          <SliderModule heading={`Portfolio Group ${group.key}`} items={group.slides} />
        </section>
      ))}

      <section className="content-card">
        <div className="page-section-header">
          <div>
            <div className="card-kicker">Navigation</div>
            <h2>Return to the main landing page</h2>
          </div>
        </div>
        <HomeButton />
      </section>

      <FooterBlock footer={chrome.footer} />
    </PageShell>
  );
}
