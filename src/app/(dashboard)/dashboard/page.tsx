"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getDashboardData } from "@/actions/dashboard.actions";
import { getUsersAction } from "@/actions/user.actions";
import { formatRupiah } from "@/lib/utils";
import DashboardCharts from "./charts";
import { Filter } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";
  const [filterUserId, setFilterUserId] = useState("");

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsersAction,
    enabled: isAdmin,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", filterUserId],
    queryFn: () => getDashboardData(filterUserId || undefined),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const totalBalance = data?.totalBalance ?? 0;
  const totalIncome = data?.totalIncome ?? 0;
  const totalExpense = data?.totalExpense ?? 0;
  const monthlyCashFlow = data?.monthlyCashFlow ?? [];
  const expenseBreakdown = data?.expenseBreakdown ?? [];
  const budgetActual = data?.budgetActual ?? [];
  const recentTransactions = data?.recentTransactions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-base-content/60" />
            <select className="select select-bordered select-sm" value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)}>
              <option value="">Data Saya</option>
              {allUsers.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="stats stats-vertical shadow lg:stats-horizontal w-full">
        <div className="stat">
          <div className="stat-title">Saldo</div>
          <div className="stat-value">{formatRupiah(totalBalance)}</div>
          <div className="stat-desc">Total seluruh dompet</div>
        </div>
        <div className="stat">
          <div className="stat-title">Pemasukan</div>
          <div className="stat-value text-success">{formatRupiah(totalIncome)}</div>
          <div className="stat-desc">Bulan ini</div>
        </div>
        <div className="stat">
          <div className="stat-title">Pengeluaran</div>
          <div className="stat-value text-error">{formatRupiah(totalExpense)}</div>
          <div className="stat-desc">Bulan ini</div>
        </div>
      </div>

      <DashboardCharts
        cashFlow={monthlyCashFlow}
        expenseBreakdown={expenseBreakdown}
        budgetActual={budgetActual}
      />

      <div className="overflow-x-auto">
        <h2 className="text-xl font-semibold mb-3">Transaksi Terbaru</h2>
        <table className="table table-zebra">
          <thead>
            <tr>
              {isAdmin && <th>Owner</th>}
              <th>Deskripsi</th>
              <th>Kategori</th>
              <th>Tanggal</th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {recentTransactions.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 5 : 4} className="text-center text-base-content/60">Belum ada transaksi</td>
              </tr>
            ) : (
              recentTransactions.map((tx: any) => (
                <tr key={tx.id}>
                  {isAdmin && <td className="text-sm">{tx.user?.name || "-"}</td>}
                  <td>{tx.description}</td>
                  <td>{tx.category?.name}</td>
                  <td>{new Date(tx.date).toLocaleDateString("id-ID")}</td>
                  <td>
                    <span className={`badge ${tx.type === "INCOME" ? "badge-success" : "badge-error"}`}>
                      {formatRupiah(tx.amount)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
