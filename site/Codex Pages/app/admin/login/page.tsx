import Link from "next/link";
import { loginAction } from "@/app/admin/actions";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const showError = params.error === "1";

  return (
    <div className="site-shell">
      <div className="login-shell">
        <section className="admin-card login-card stack">
          <div className="card-kicker">Admin login</div>
          <h2>Sign in to edit local portfolio content</h2>
          <p className="copy-block">This login is intentionally simple and local: credentials come from `.env.local`, and successful login grants access to filesystem-backed editing tools inside this isolated subtree.</p>
          {showError ? <div className="admin-banner">The username or password did not match the configured admin credentials.</div> : null}
          <form action={loginAction} className="login-form">
            <label className="field-stack">
              <span>Username</span>
              <input type="text" name="username" required />
            </label>
            <label className="field-stack">
              <span>Password</span>
              <input type="password" name="password" required />
            </label>
            <button type="submit" className="button-solid">Login</button>
          </form>
          <Link href="/" className="button-ghost">Back to site</Link>
        </section>
      </div>
    </div>
  );
}
