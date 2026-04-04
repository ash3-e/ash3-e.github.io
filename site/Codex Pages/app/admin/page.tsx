import { logoutAction, saveTextFileAction, uploadBinaryFileAction } from "@/app/admin/actions";
import { requireAuth } from "@/lib/auth";
import { getEditableFiles, publicContentPath } from "@/lib/content";

export default async function AdminPage() {
  await requireAuth();
  const files = await getEditableFiles();

  return (
    <div className="site-shell">
      <div className="page-wrap">
        <section className="admin-card stack">
          <div className="admin-toolbar">
            <div className="card-kicker">Admin dashboard</div>
            <h2>Editable content files</h2>
            <p className="copy-block">Text files save directly back to the local content tree. Image and PDF uploads replace the current file in place, so public pages stay wired to the same path.</p>
            <div className="button-row">
              <a href="/" className="button-ghost">View site</a>
              <form action={logoutAction}><button type="submit" className="button-solid">Logout</button></form>
            </div>
          </div>
          <div className="editor-grid">
            {files.map((file) => (
              <section className="editor-file-card" key={file.relativePath}>
                <code>{file.relativePath}</code>
                <div className="card-kicker">{file.kind}</div>
                {file.kind === "text" ? (
                  <form action={saveTextFileAction} className="field-stack">
                    <input type="hidden" name="relativePath" value={file.relativePath} />
                    <textarea name="content" defaultValue={file.content} />
                    <button type="submit" className="button-solid">Save text</button>
                  </form>
                ) : file.kind === "image" || file.kind === "pdf" ? (
                  <form action={uploadBinaryFileAction} className="field-stack">
                    <input type="hidden" name="relativePath" value={file.relativePath} />
                    {file.kind === "image" ? <img className="editor-preview" src={publicContentPath(file.relativePath)} alt={file.relativePath} /> : null}
                    <input type="file" name="file" accept={file.kind === "pdf" ? ".pdf" : ".png,.jpg,.jpeg,.svg,.webp"} required />
                    <button type="submit" className="button-solid">Replace file</button>
                  </form>
                ) : (
                  <div className="copy-block">Unsupported file type for inline editing.</div>
                )}
              </section>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
