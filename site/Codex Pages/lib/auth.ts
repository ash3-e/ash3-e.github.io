import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "codex-pages-admin";

function getSecret() {
  return process.env.CODEX_SESSION_SECRET || "codex-pages-dev-secret";
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionValue(user: string) {
  const payload = `${user}:${Date.now()}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionValue(sessionValue: string | undefined) {
  if (!sessionValue || !sessionValue.includes(".")) return false;
  const [payload, signature] = sessionValue.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  return verifySessionValue(cookieStore.get(COOKIE_NAME)?.value);
}

export async function requireAuth() {
  const authenticated = await isAuthenticated();
  if (!authenticated) redirect("/admin/login");
}

export async function setAuthCookie(user: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionValue(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function validateAdminCredentials(user: string, password: string) {
  const expectedUser = process.env.CODEX_ADMIN_USER || "admin";
  const expectedPassword = process.env.CODEX_ADMIN_PASSWORD || "change-me";
  return user === expectedUser && password === expectedPassword;
}
