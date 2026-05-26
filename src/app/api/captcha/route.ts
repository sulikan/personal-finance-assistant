import { NextResponse } from "next/server";
import { generateCaptcha } from "@/lib/security/captcha";

export async function GET() {
  const { id, svg } = generateCaptcha();
  return NextResponse.json({ id, svg });
}
