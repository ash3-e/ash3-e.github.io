"use server";

import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearAuthCookie, requireAuth, setAuthCookie, validateAdminCredentials } from "@/lib/auth";
import { resolveContentPath } from "@/lib/content";

const REVALIDATE_PATHS = ["/", "/portfolio", "/resume", "/gyre", "/emblazon", "/trillium", "/admin"];

export async function loginAction(formData: FormData) {
  const username = String(formData.get("username") || "");
  const password = String(formData.get("password") || "");
  if (!validateAdminCredentials(username, password)) redirect("/admin/login?error=1");
  await setAuthCookie(username);
  redirect("/admin");
}

export async function logoutAction() {
  await clearAuthCookie();
  redirect("/admin/login");
}

export async function saveTextFileAction(formData: FormData) {
  await requireAuth();
  const relativePath = String(formData.get("relativePath") || "");
  const content = String(formData.get("content") || "");
  const filePath = resolveContentPath(relativePath);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
  REVALIDATE_PATHS.forEach((value) => revalidatePath(value));
}

export async function uploadBinaryFileAction(formData: FormData) {
  await requireAuth();
  const relativePath = String(formData.get("relativePath") || "");
  const nextFile = formData.get("file");
  if (!(nextFile instanceof File) || nextFile.size === 0) return;

  const filePath = resolveContentPath(relativePath);
  const ext = path.extname(filePath).toLowerCase();
  const incomingExt = path.extname(nextFile.name).toLowerCase();
  if (incomingExt && incomingExt !== ext) {
    throw new Error(`Uploaded file must match the existing extension: expected ${ext}`);
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const buffer = Buffer.from(await nextFile.arrayBuffer());
  await fs.writeFile(filePath, buffer);
  REVALIDATE_PATHS.forEach((value) => revalidatePath(value));
}
