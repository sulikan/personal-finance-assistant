"use server";

import prisma from "@/lib/prisma";
import { transactionSchema } from "@/lib/zod/schemas";
import { getCurrentUserId, getCurrentUserRole } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createTransaction(data: unknown) {
  const userId = await getCurrentUserId();
  const parsed = transactionSchema.safeParse(data);
  if (!parsed.success) throw new Error("Validasi gagal");

  const { walletId, ...rest } = parsed.data;

  const transaction = await prisma.$transaction(async (tx) => {
    const txn = await tx.transaction.create({
      data: {
        ...rest,
        date: new Date(rest.date),
        userId,
        categoryId: rest.categoryId,
      },
    });

    const entryType = rest.type === "INCOME" ? "CREDIT" : "DEBIT";
    const accountType = rest.type === "INCOME" ? "INCOME" : "EXPENSE";

    await tx.transactionLine.create({
      data: {
        transactionId: txn.id,
        walletId,
        entryType,
        amount: rest.amount,
        accountType,
      },
    });

    const balanceChange = rest.type === "INCOME" ? rest.amount : -rest.amount;
    await tx.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: balanceChange } },
    });

    return txn;
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
  return transaction;
}

export async function updateTransaction(id: string, data: unknown) {
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();
  const parsed = transactionSchema.safeParse(data);
  if (!parsed.success) throw new Error("Validasi gagal");

  const where = role === "ADMIN" ? { id } : { id, userId };
  const existing = await prisma.transaction.findFirst({
    where,
    include: { lines: true },
  });
  if (!existing) throw new Error("Not found");

  const { walletId, ...rest } = parsed.data;

  await prisma.$transaction(async (tx) => {
    for (const line of existing.lines) {
      const revert = existing.type === "INCOME" ? -existing.amount : existing.amount;
      await tx.wallet.update({
        where: { id: line.walletId },
        data: { balance: { increment: revert } },
      });
    }

    await tx.transactionLine.deleteMany({ where: { transactionId: id } });

    await tx.transaction.update({
      where: { id },
      data: {
        ...rest,
        date: new Date(rest.date),
        categoryId: rest.categoryId,
      },
    });

    const entryType = rest.type === "INCOME" ? "CREDIT" : "DEBIT";
    const accountType = rest.type === "INCOME" ? "INCOME" : "EXPENSE";

    await tx.transactionLine.create({
      data: {
        transactionId: id,
        walletId,
        entryType,
        amount: rest.amount,
        accountType,
      },
    });

    const balanceChange = rest.type === "INCOME" ? rest.amount : -rest.amount;
    await tx.wallet.update({
      where: { id: walletId },
      data: { balance: { increment: balanceChange } },
    });
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteTransaction(id: string) {
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();
  const where = role === "ADMIN" ? { id } : { id, userId };
  const existing = await prisma.transaction.findFirst({
    where,
    include: { lines: true },
  });
  if (!existing) throw new Error("Not found");

  await prisma.$transaction(async (tx) => {
    for (const line of existing.lines) {
      const revert = existing.type === "INCOME" ? -existing.amount : existing.amount;
      await tx.wallet.update({
        where: { id: line.walletId },
        data: { balance: { increment: revert } },
      });
    }
    await tx.transactionLine.deleteMany({ where: { transactionId: id } });
    await tx.transaction.delete({ where: { id } });
  });

  revalidatePath("/dashboard/transactions");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function getTransactions(params?: {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  userId?: string;
  page?: number;
  perPage?: number;
}) {
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();

  const where: any = {};
  if (role === "ADMIN") {
    if (params?.userId) where.userId = params.userId;
  } else {
    where.userId = userId;
  }

  if (params?.startDate || params?.endDate) {
    where.date = {};
    if (params.startDate) where.date.gte = new Date(params.startDate);
    if (params.endDate) where.date.lte = new Date(params.endDate);
  }
  if (params?.categoryId) where.categoryId = params.categoryId;

  const page = params?.page || 1;
  const perPage = params?.perPage || 100;
  const skip = (page - 1) * perPage;

  const [data, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        category: true,
        lines: { include: { wallet: true } },
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: "desc" },
      skip,
      take: perPage,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { data, total, page, perPage };
}
