import Link from "next/link";

export function HomeButton() {
  return (
    <Link href="/" className="quick-jump-home" aria-label="Return home">
      <span className="home-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 3.2 3.5 10v10.2h6.4v-6.3h4.2v6.3h6.4V10L12 3.2Zm0 2.1 6.7 5.3v7.9h-2.9v-6.3H8.2v6.3H5.3v-7.9L12 5.3Z" />
        </svg>
      </span>
      <span>
        <strong>Home</strong>
        <span>Return to the landing page and main navigation.</span>
      </span>
    </Link>
  );
}
