"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hashSync, compare } from "bcryptjs";
import { z } from "zod/v4";
import { redirect } from "next/navigation";

const updateNameSchema = z.object({
  name: z.string().min(1).max(100),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6).max(100),
});

export async function updateNameAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const parsed = updateNameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Nama tidak valid" };

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name },
  });

  return { success: true };
}

export async function changePasswordAction(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Password minimal 6 karakter" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) return { error: "User tidak ditemukan" };

  const isValid = await compare(parsed.data.currentPassword, user.password);
  if (!isValid) return { error: "Password saat ini salah" };

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashSync(parsed.data.newPassword, 12) },
  });

  return { success: true };
}
