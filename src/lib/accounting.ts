import prisma from "@/lib/prisma";

export async function getBalanceSheet(userId: string) {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
  });

  const assets = wallets.reduce((sum, w) => sum + w.balance, 0);

  const hutangCategory = await prisma.category.findFirst({
    where: { userId, name: { contains: "Hutang" } },
  });

  let liabilities = 0;
  if (hutangCategory) {
    const hutangTransactions = await prisma.transaction.aggregate({
      where: {
        userId,
        categoryId: hutangCategory.id,
        type: "EXPENSE",
      },
      _sum: { amount: true },
    });
    liabilities = hutangTransactions._sum.amount || 0;
  }

  const equity = assets - liabilities;

  return { assets, liabilities, equity };
}

export async function getMonthlySummary(userId: string, year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const income = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "INCOME",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });

  const expense = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "EXPENSE",
      date: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });

  const totalIncome = income._sum.amount || 0;
  const totalExpense = expense._sum.amount || 0;
  const net = totalIncome - totalExpense;

  return { totalIncome, totalExpense, net };
}
