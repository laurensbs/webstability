import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";

const COOKIE_NAME = "webstability-strategie-unlock";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dagen

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function POST(req: NextRequest) {
  const expected = process.env.STRATEGIE_PASSWORD;
  const form = await req.formData();
  const submitted = String(form.get("password") ?? "");

  const back = new URL("/strategie", req.url);

  if (!expected) {
    back.searchParams.set("error", "config");
    return NextResponse.redirect(back, { status: 303 });
  }

  if (!safeEqual(hash(submitted), hash(expected))) {
    back.searchParams.set("error", "1");
    return NextResponse.redirect(back, { status: 303 });
  }

  const res = NextResponse.redirect(back, { status: 303 });
  res.cookies.set({
    name: COOKIE_NAME,
    value: hash(expected),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/strategie",
    maxAge: MAX_AGE,
  });
  return res;
}
