"use server";

import prisma from "@/lib/prisma";
import { getCurrentUserId, getCurrentUserRole } from "@/lib/session";

export async function getBalanceSheetAction(userIdFilter?: string) {
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();

  const targetUserId = role === "ADMIN" && userIdFilter ? userIdFilter : userId;

  const wallets = await prisma.wallet.findMany({ where: { userId: targetUserId } });
  const assets = wallets.reduce((sum, w) => sum + w.balance, 0);

  const hutangCategory = await prisma.category.findFirst({
    where: { userId: targetUserId, name: { contains: "Hutang" } },
  });

  let liabilities = 0;
  if (hutangCategory) {
    const hutangTransactions = await prisma.transaction.aggregate({
      where: { userId: targetUserId, categoryId: hutangCategory.id, type: "EXPENSE" },
      _sum: { amount: true },
    });
    liabilities = hutangTransactions._sum.amount || 0;
  }

  return { assets, liabilities, equity: assets - liabilities };
}
