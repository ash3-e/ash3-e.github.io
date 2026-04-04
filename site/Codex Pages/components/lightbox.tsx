"use client";

type LightboxProps = { title: string; src: string; alt: string; onClose: () => void };

export function Lightbox({ title, src, alt, onClose }: LightboxProps) {
  return (
    <div className="lightbox-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="lightbox-card" onClick={(event) => event.stopPropagation()}>
        <div className="lightbox-toolbar">
          <strong>{title}</strong>
          <button type="button" onClick={onClose}>Close preview</button>
        </div>
        <figure className="lightbox-figure">
          <img src={src} alt={alt} />
        </figure>
      </div>
    </div>
  );
}
