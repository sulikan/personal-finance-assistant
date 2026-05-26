"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { hashSync } from "bcryptjs";
import { z } from "zod/v4";
import { redirect } from "next/navigation";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard");
}

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  role: z.enum(["ADMIN", "USER"]),
});

const updateUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(["ADMIN", "USER"]),
  password: z.string().optional(),
});

export async function getUsersAction() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
  return users.map((u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt.toISOString() }));
}

export async function createUserAction(formData: FormData) {
  await requireAdmin();
  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Data tidak valid" };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "Email sudah terdaftar" };

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password: hashSync(parsed.data.password, 12),
      role: parsed.data.role,
    },
  });

  return { success: true };
}

export async function updateUserAction(formData: FormData) {
  await requireAdmin();
  const parsed = updateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Data tidak valid" };

  const data: Record<string, string> = { name: parsed.data.name, email: parsed.data.email, role: parsed.data.role };
  if (parsed.data.password) data.password = hashSync(parsed.data.password, 12);

  await prisma.user.update({ where: { id: parsed.data.id }, data });
  return { success: true };
}

export async function deleteUserAction(id: string) {
  await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "User tidak ditemukan" };
  if (target.role === "ADMIN") return { error: "Tidak bisa menghapus admin" };

  await prisma.user.delete({ where: { id } });
  return { success: true };
}
