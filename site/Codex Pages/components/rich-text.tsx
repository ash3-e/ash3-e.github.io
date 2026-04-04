export function RichText({ text, className = "copy-block" }: { text: string; className?: string }) {
  const blocks = text.split(/\n\s*\n/).map((block) => block.trim()).filter(Boolean);
  if (blocks.length === 0) {
    return <p className={className}>Add content in admin mode or by editing the linked text file.</p>;
  }
  return (
    <div className="stack">
      {blocks.map((block, index) => (
        <p key={`${index}-${block.slice(0, 24)}`} className={className}>
          {block}
        </p>
      ))}
    </div>
  );
}
