"use server";

import prisma from "@/lib/prisma";
import { getCurrentUserId, getCurrentUserRole } from "@/lib/session";

export async function getDashboardData(userIdFilter?: string) {
  const userId = await getCurrentUserId();
  const role = await getCurrentUserRole();
  const targetUserId = role === "ADMIN" && userIdFilter ? userIdFilter : userId;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [wallets, incomeResult, expenseResult, recentTransactions] = await Promise.all([
    prisma.wallet.findMany({ where: { userId: targetUserId } }),
    prisma.transaction.aggregate({
      where: { userId: targetUserId, type: "INCOME", date: { gte: startOfMonth, lt: startOfNextMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId: targetUserId, type: "EXPENSE", date: { gte: startOfMonth, lt: startOfNextMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId: targetUserId },
      include: { category: true, user: { select: { id: true, name: true } } },
      orderBy: { date: "desc" },
      take: 5,
    }),
  ]);

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const totalIncome = incomeResult._sum.amount ?? 0;
  const totalExpense = expenseResult._sum.amount ?? 0;

  // Cash Flow: last 6 months
  const monthlyCashFlow: { month: string; income: number; expense: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const [inc, exp] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId: targetUserId, type: "INCOME", date: { gte: m, lt: end } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: targetUserId, type: "EXPENSE", date: { gte: m, lt: end } },
        _sum: { amount: true },
      }),
    ]);
    const label = m.toLocaleDateString("id-ID", { month: "short" });
    monthlyCashFlow.push({ month: label, income: inc._sum.amount ?? 0, expense: exp._sum.amount ?? 0 });
  }

  // Expense Breakdown: this month by category
  const expenseGroups = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId: targetUserId, type: "EXPENSE", date: { gte: startOfMonth, lt: startOfNextMonth } },
    _sum: { amount: true },
  });
  const catIds = expenseGroups.map((g) => g.categoryId);
  const cats = await prisma.category.findMany({
    where: { id: { in: catIds } },
    select: { id: true, name: true },
  });
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const expenseBreakdown = expenseGroups
    .map((g) => ({ name: catMap.get(g.categoryId) || "Unknown", value: g._sum.amount ?? 0 }))
    .filter((g) => g.value > 0)
    .sort((a, b) => b.value - a.value);

  // Budget vs Actual
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const [lastMonthExpenses, thisMonthExpenses] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId: targetUserId, type: "EXPENSE", date: { gte: lastMonthStart, lt: lastMonthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId: targetUserId, type: "EXPENSE", date: { gte: startOfMonth, lt: startOfNextMonth } },
      _sum: { amount: true },
    }),
  ]);
  const allCatIds = [...new Set([...lastMonthExpenses.map((g) => g.categoryId), ...thisMonthExpenses.map((g) => g.categoryId)])];
  const budgetCats = await prisma.category.findMany({
    where: { id: { in: allCatIds } },
    select: { id: true, name: true },
  });
  const budgetCatMap = new Map(budgetCats.map((c) => [c.id, c.name]));
  const lastMap = new Map(lastMonthExpenses.map((g) => [g.categoryId, g._sum.amount ?? 0]));
  const thisMap = new Map(thisMonthExpenses.map((g) => [g.categoryId, g._sum.amount ?? 0]));
  const budgetActual = allCatIds
    .map((id) => ({ name: budgetCatMap.get(id) || "Unknown", budget: lastMap.get(id) ?? 0, actual: thisMap.get(id) ?? 0 }))
    .filter((g) => g.budget > 0 || g.actual > 0);

  return { totalBalance, totalIncome, totalExpense, monthlyCashFlow, expenseBreakdown, budgetActual, recentTransactions };
}
