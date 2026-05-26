"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { getTransactions } from "@/actions/transaction.actions";
import { getBalanceSheetAction } from "@/actions/accounting.actions";
import { getUsersAction } from "@/actions/user.actions";
import {
  exportTransactionsToPDF, exportBalanceSheetToPDF,
  exportFinancialSnapshotToPDF, exportCashflowSummaryToPDF,
} from "@/lib/exports/export-pdf";
import { exportTransactionsToXLSX } from "@/lib/exports/export-xlsx";
import { exportTransactionsToDOCX } from "@/lib/exports/export-docx";
import { Filter } from "lucide-react";

function toLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function todayISO() {
  return toLocalDate(new Date());
}
function firstOfMonthISO() {
  const d = new Date();
  return toLocalDate(new Date(d.getFullYear(), d.getMonth(), 1));
}

function daysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24)) || 1;
}

export default function ReportsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";

  const [startDate, setStartDate] = useState(firstOfMonthISO);
  const [endDate, setEndDate] = useState(todayISO);
  const [filterUserId, setFilterUserId] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, net: 0 });
  const [balanceSheet, setBalanceSheet] = useState({ assets: 0, liabilities: 0, equity: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [snapshot, setSnapshot] = useState({ count: 0, avgPerDay: 0, savingsRate: 0 });
  const [cashflowRows, setCashflowRows] = useState<{ month: string; income: number; expense: number; net: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsersAction,
    enabled: isAdmin,
  });

  const fetchReport = useCallback(async (start: string, end: string, userId?: string) => {
    if (!start || !end) return;
    setLoading(true);
    try {
      const result = await getTransactions({ startDate: start, endDate: end, userId: userId || undefined });
      const txns = result.data;
      setTransactions(txns);

      const totalIncome = txns.filter((t: any) => t.type === "INCOME").reduce((s: number, t: any) => s + t.amount, 0);
      const totalExpense = txns.filter((t: any) => t.type === "EXPENSE").reduce((s: number, t: any) => s + t.amount, 0);
      const net = totalIncome - totalExpense;
      setSummary({ totalIncome, totalExpense, net });

      const catMap: Record<string, { INCOME: number; EXPENSE: number }> = {};
      for (const t of txns) {
        const catName = t.category?.name || "Lainnya";
        if (!catMap[catName]) catMap[catName] = { INCOME: 0, EXPENSE: 0 };
        catMap[catName][t.type as "INCOME" | "EXPENSE"] += t.amount;
      }
      setChartData(Object.entries(catMap).map(([name, vals]) => ({ name, ...vals })));

      const bs = await getBalanceSheetAction(userId || undefined);
      setBalanceSheet(bs);

      // Financial Snapshot
      const days = daysBetween(new Date(start), new Date(end));
      setSnapshot({
        count: txns.length,
        avgPerDay: days > 0 ? Math.round(totalExpense / days) : 0,
        savingsRate: totalIncome > 0 ? ((net / totalIncome) * 100) : 0,
      });

      // Cashflow Summary (by month)
      const monthMap: Record<string, { income: number; expense: number }> = {};
      for (const t of txns) {
        const d = new Date(t.date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
        monthMap[key][t.type === "INCOME" ? "income" : "expense"] += t.amount;
      }
      const rows = Object.entries(monthMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, vals]) => {
          const [y, m] = key.split("-");
          const monthName = new Date(Number(y), Number(m) - 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
          return { month: monthName, income: vals.income, expense: vals.expense, net: vals.income - vals.expense };
        });
      setCashflowRows(rows);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(startDate, endDate, filterUserId || undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleGenerate() {
    fetchReport(startDate, endDate, filterUserId || undefined);
  }

  function periodLabel() {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
    return `${new Date(startDate).toLocaleDateString("id-ID", opts)} - ${new Date(endDate).toLocaleDateString("id-ID", opts)}`;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Laporan Keuangan</h1>

      <div className="flex gap-4 items-end flex-wrap">
        <div className="form-control">
          <label className="label"><span className="label-text">Tanggal Mulai</span></label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input input-bordered" />
        </div>
        <div className="form-control">
          <label className="label"><span className="label-text">Tanggal Akhir</span></label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input input-bordered" />
        </div>
        {isAdmin && (
          <div className="form-control">
            <label className="label"><span className="label-text"><Filter className="h-3.5 w-3.5 inline" /> User</span></label>
            <select className="select select-bordered" value={filterUserId} onChange={(e) => setFilterUserId(e.target.value)}>
              <option value="">Semua User</option>
              {allUsers.map((u: any) => (
                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
              ))}
            </select>
          </div>
        )}
        <button onClick={handleGenerate} disabled={loading} className="btn btn-primary">
          {loading ? <span className="loading loading-spinner"></span> : "Generate"}
        </button>
      </div>

      <div className="stats shadow stats-vertical lg:stats-horizontal">
        <div className="stat">
          <div className="stat-title">Total Pemasukan</div>
          <div className="stat-value text-green-600">Rp {summary.totalIncome.toLocaleString("id-ID")}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Pengeluaran</div>
          <div className="stat-value text-red-600">Rp {summary.totalExpense.toLocaleString("id-ID")}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Laba Bersih</div>
          <div className="stat-value text-blue-600">Rp {summary.net.toLocaleString("id-ID")}</div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-base-100 p-4 rounded-box border">
          <h2 className="text-lg font-semibold mb-4">Grafik per Kategori</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: any) => { const n = Number(v); return n >= 1000000 ? `${(n / 1000000).toFixed(1)}jt` : n >= 1000 ? `${(n / 1000).toFixed(0)}rb` : String(n); }} />
              <Tooltip formatter={(v: any) => [`Rp ${Number(v).toLocaleString("id-ID")}`, undefined]} />
              <Legend />
              <Bar dataKey="INCOME" fill="#22c55e" name="Pemasukan" radius={[4, 4, 0, 0]} />
              <Bar dataKey="EXPENSE" fill="#ef4444" name="Pengeluaran" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="bg-base-100 p-4 rounded-box border">
          <h2 className="text-lg font-semibold mb-4">Transaksi</h2>
          <div className="flex gap-2 mb-4 flex-wrap">
            <button onClick={() => exportTransactionsToPDF(transactions)} className="btn btn-outline btn-sm">Export PDF</button>
            <button onClick={() => exportTransactionsToXLSX(transactions, "laporan-transaksi")} className="btn btn-outline btn-sm">Export XLSX</button>
            <button onClick={() => exportTransactionsToDOCX(transactions, "laporan-transaksi")} className="btn btn-outline btn-sm">Export DOCX</button>
            <button onClick={() => exportBalanceSheetToPDF(balanceSheet)} className="btn btn-outline btn-sm">Neraca PDF</button>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  {isAdmin && <th>Owner</th>}
                  <th>Tanggal</th>
                  <th>Deskripsi</th>
                  <th>Kategori</th>
                  <th>Tipe</th>
                  <th className="text-right">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t: any) => (
                  <tr key={t.id}>
                    {isAdmin && <td className="text-sm">{t.user?.name || "-"}</td>}
                    <td>{new Date(t.date).toLocaleDateString("id-ID")}</td>
                    <td>{t.description}</td>
                    <td>{t.category?.name || "-"}</td>
                    <td>
                      <span className={`badge ${t.type === "INCOME" ? "badge-success" : "badge-error"}`}>
                        {t.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                      </span>
                    </td>
                    <td className="text-right">Rp {t.amount.toLocaleString("id-ID")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-base-100 p-4 rounded-box border">
        <h2 className="text-lg font-semibold mb-4">Neraca Keuangan</h2>
        <div className="stats shadow stats-vertical lg:stats-horizontal">
          <div className="stat">
            <div className="stat-title">Total Aset</div>
            <div className="stat-value text-purple-600">Rp {balanceSheet.assets.toLocaleString("id-ID")}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Total Liabilitas</div>
            <div className="stat-value text-orange-600">Rp {balanceSheet.liabilities.toLocaleString("id-ID")}</div>
          </div>
          <div className="stat">
            <div className="stat-title">Total Ekuitas</div>
            <div className="stat-value text-teal-600">Rp {balanceSheet.equity.toLocaleString("id-ID")}</div>
          </div>
        </div>
        <button onClick={() => exportBalanceSheetToPDF(balanceSheet)} className="btn btn-outline btn-sm mt-4">Export Neraca PDF</button>
      </div>

      {/* Financial Snapshot */}
      {summary.totalIncome > 0 && (
        <div className="bg-base-100 p-4 rounded-box border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Financial Snapshot</h2>
            <button
              onClick={() => exportFinancialSnapshotToPDF({
                totalIncome: summary.totalIncome,
                totalExpense: summary.totalExpense,
                net: summary.net,
                count: snapshot.count,
                avgPerDay: snapshot.avgPerDay,
                savingsRate: snapshot.savingsRate,
                period: periodLabel(),
              })}
              className="btn btn-outline btn-sm"
            >
              Export PDF
            </button>
          </div>
          <div className="stats shadow stats-vertical lg:stats-horizontal">
            <div className="stat">
              <div className="stat-title">Jumlah Transaksi</div>
              <div className="stat-value">{snapshot.count}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Rata-rata Pengeluaran / Hari</div>
              <div className="stat-value text-sm lg:text-xl">Rp {snapshot.avgPerDay.toLocaleString("id-ID")}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Savings Rate</div>
              <div className={`stat-value ${snapshot.savingsRate >= 20 ? "text-success" : snapshot.savingsRate >= 10 ? "text-warning" : "text-error"}`}>
                {snapshot.savingsRate.toFixed(1)}%
              </div>
              <div className="stat-desc">Ideal: &ge; 20%</div>
            </div>
          </div>
        </div>
      )}

      {/* Cashflow Summary */}
      {cashflowRows.length > 0 && (
        <div className="bg-base-100 p-4 rounded-box border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Cashflow Summary</h2>
            <button
              onClick={() => exportCashflowSummaryToPDF({
                rows: cashflowRows,
                totalIncome: summary.totalIncome,
                totalExpense: summary.totalExpense,
                totalNet: summary.net,
                period: periodLabel(),
              })}
              className="btn btn-outline btn-sm"
            >
              Export PDF
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th className="text-right">Pemasukan</th>
                  <th className="text-right">Pengeluaran</th>
                  <th className="text-right">Bersih</th>
                </tr>
              </thead>
              <tbody>
                {cashflowRows.map((r) => (
                  <tr key={r.month}>
                    <td className="font-medium">{r.month}</td>
                    <td className="text-right text-success">Rp {r.income.toLocaleString("id-ID")}</td>
                    <td className="text-right text-error">Rp {r.expense.toLocaleString("id-ID")}</td>
                    <td className={`text-right font-semibold ${r.net >= 0 ? "text-success" : "text-error"}`}>
                      Rp {r.net.toLocaleString("id-ID")}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td>TOTAL</td>
                  <td className="text-right text-success">Rp {summary.totalIncome.toLocaleString("id-ID")}</td>
                  <td className="text-right text-error">Rp {summary.totalExpense.toLocaleString("id-ID")}</td>
                  <td className={`text-right ${summary.net >= 0 ? "text-success" : "text-error"}`}>
                    Rp {summary.net.toLocaleString("id-ID")}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
