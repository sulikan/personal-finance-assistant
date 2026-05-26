"use server";

import prisma from "@/lib/prisma";
import { categorySchema } from "@/lib/zod/schemas";
import { getCurrentUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createCategory(data: unknown) {
  const userId = await getCurrentUserId();
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) throw new Error("Validasi gagal");

  const category = await prisma.category.create({
    data: { ...parsed.data, userId, parentId: parsed.data.parentId || null },
  });

  revalidatePath("/dashboard/categories");
  return category;
}

export async function updateCategory(id: string, data: unknown) {
  const userId = await getCurrentUserId();
  const parsed = categorySchema.safeParse(data);
  if (!parsed.success) throw new Error("Validasi gagal");

  const category = await prisma.category.updateMany({
    where: { id, userId },
    data: { ...parsed.data, parentId: parsed.data.parentId || null },
  });

  if (!category.count) throw new Error("Not found");
  revalidatePath("/dashboard/categories");
  return { ok: true };
}

export async function deleteCategory(id: string) {
  const userId = await getCurrentUserId();
  await prisma.category.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard/categories");
  return { ok: true };
}

export async function getCategories() {
  const userId = await getCurrentUserId();
  return prisma.category.findMany({
    where: { userId },
    include: { children: true },
    orderBy: { name: "asc" },
  });
}
