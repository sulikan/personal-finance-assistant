"use server";

import prisma from "@/lib/prisma";
import { walletSchema } from "@/lib/zod/schemas";
import { getCurrentUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createWallet(data: unknown) {
  const userId = await getCurrentUserId();
  const parsed = walletSchema.safeParse(data);
  if (!parsed.success) throw new Error("Validasi gagal");

  const wallet = await prisma.wallet.create({
    data: { ...parsed.data, userId },
  });

  revalidatePath("/dashboard/wallets");
  return wallet;
}

export async function updateWallet(id: string, data: unknown) {
  const userId = await getCurrentUserId();
  const parsed = walletSchema.safeParse(data);
  if (!parsed.success) throw new Error("Validasi gagal");

  const wallet = await prisma.wallet.updateMany({
    where: { id, userId },
    data: parsed.data,
  });

  if (!wallet.count) throw new Error("Not found");
  revalidatePath("/dashboard/wallets");
  return { ok: true };
}

export async function deleteWallet(id: string) {
  const userId = await getCurrentUserId();
  await prisma.wallet.deleteMany({ where: { id, userId } });
  revalidatePath("/dashboard/wallets");
  return { ok: true };
}

export async function getWallets() {
  const userId = await getCurrentUserId();
  return prisma.wallet.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}
