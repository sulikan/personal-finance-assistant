"use server";

import { compare } from "bcryptjs";
import { loginSchema } from "@/lib/zod/schemas";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { verifyCaptcha } from "@/lib/security/captcha";
import prisma from "@/lib/prisma";
import { headers } from "next/headers";

export async function loginAction(formData: {
  email: string;
  password: string;
  captchaId: string;
  captchaAnswer: string;
}): Promise<{ error: string } | { success: true }> {
  const parsed = loginSchema.safeParse(formData);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message;
    return { error: firstError ?? "Invalid input" };
  }

  const { email, password, captchaId, captchaAnswer } = parsed.data;

  const ip =
    (await headers()).get("x-forwarded-for") ??
    (await headers()).get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(`login:${ip}`)) {
    return { error: "Too many attempts. Please try again later." };
  }

  const captchaValid = await verifyCaptcha(captchaId, captchaAnswer);
  if (!captchaValid) {
    return { error: "Invalid CAPTCHA" };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "Invalid email or password" };
  }

  const passwordValid = await compare(password, user.password);
  if (!passwordValid) {
    return { error: "Invalid email or password" };
  }

  return { success: true };
}
