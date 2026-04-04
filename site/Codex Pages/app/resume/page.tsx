import { FooterBlock } from "@/components/footer-block";
import { HomeButton } from "@/components/home-button";
import { PageShell } from "@/components/page-shell";
import { RichText } from "@/components/rich-text";
import { getPageChrome, getResumeContent } from "@/lib/content";

export default async function ResumePage() {
  const [resume, chrome] = await Promise.all([getResumeContent(), getPageChrome()]);

  return (
    <PageShell title="Resume" subtitle="Embedded PDF view with a direct floppy-disk download action.">
      <section className="content-card stack">
        <div className="card-kicker">Resume viewer</div>
        <h2>{resume.title}</h2>
        <RichText text={resume.body} />
        <div className="resume-frame">
          {resume.pdfPath ? <iframe src={resume.pdfPath} title="Embedded resume PDF" /> : <div className="empty-state">Drop `Resume.pdf` into `content/Pages/Resume` or upload one in admin mode.</div>}
        </div>
        <div className="download-row">
          {resume.pdfPath ? (
            <a className="download-button" href={resume.pdfPath} download="Derek-Resume.pdf">
              <img src="/icons/floppy.svg" alt="" />
              <span>Download Resume PDF</span>
            </a>
          ) : null}
        </div>
      </section>

      <section className="content-card">
        <HomeButton />
      </section>

      <FooterBlock footer={chrome.footer} />
    </PageShell>
  );
}
