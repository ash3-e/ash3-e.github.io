import { FooterBlock } from "@/components/footer-block";
import { PageShell } from "@/components/page-shell";
import { QuickJump } from "@/components/quick-jump";
import { RichText } from "@/components/rich-text";
import { SliderModule } from "@/components/slider-module";
import type { PageChrome, SubsidiaryContent } from "@/lib/content";

export async function SubsidiaryPageView({ page, chrome }: { page: SubsidiaryContent; chrome: PageChrome }) {
  return (
    <PageShell title={page.title} subtitle={`${page.kicker} · original Codex Pages implementation`}>
      <section className="hero-card hero-card--green">
        <div className="card-kicker">{page.kicker}</div>
        <h2>{page.title}</h2>
        <RichText text={page.heroBody} />
      </section>

      <SliderModule heading={`${page.title} Module`} items={page.slider} />

      <section className="content-card">
        <div className="page-section-header">
          <div>
            <div className="card-kicker">Rotating quick jump</div>
            <h2>Move between related pages</h2>
          </div>
        </div>
        <QuickJump current={page.slug as "gyre" | "emblazon" | "trillium"} />
      </section>

      <FooterBlock footer={chrome.footer} />
    </PageShell>
  );
}
