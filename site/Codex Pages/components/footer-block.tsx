import { RichText } from "@/components/rich-text";

export function FooterBlock({ footer }: { footer: string }) {
  return (
    <footer className="footer-card">
      <div>
        <div className="footer-note">Editable footer corpus</div>
        <RichText text={footer} className="footer-copy" />
      </div>
      <div className="footer-note">Local content + admin mode</div>
    </footer>
  );
}
