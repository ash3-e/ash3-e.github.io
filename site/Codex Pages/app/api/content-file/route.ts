import { promises as fs } from "fs";
import path from "path";
import { NextRequest } from "next/server";
import { resolveContentPath } from "@/lib/content";

const MIME_TYPES: Record<string, string> = {
  ".md": "text/plain; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf"
};

export async function GET(request: NextRequest) {
  const relativePath = request.nextUrl.searchParams.get("path");
  if (!relativePath) return new Response("Missing path.", { status: 400 });

  try {
    const filePath = resolveContentPath(relativePath);
    const data = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    return new Response(data, {
      headers: {
        "Content-Type": MIME_TYPES[extension] || "application/octet-stream",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return new Response("Not found.", { status: 404 });
  }
}
