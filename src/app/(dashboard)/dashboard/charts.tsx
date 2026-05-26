"use client";

import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1", "#84cc16"];

function rp(v: number) { return `Rp ${v.toLocaleString("id-ID")}`; }

export default function DashboardCharts({
  cashFlow,
  expenseBreakdown,
  budgetActual,
}: {
  cashFlow: { month: string; income: number; expense: number }[];
  expenseBreakdown: { name: string; value: number }[];
  budgetActual: { name: string; budget: number; actual: number }[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Line Chart — Cash Flow */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title">Cash Flow</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cashFlow} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v: any) => `${(Number(v) / 1000000).toFixed(1)}jt`} />
              <Tooltip formatter={(v: any) => [rp(Number(v)), undefined]} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Pemasukan" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Pengeluaran" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Donut Chart — Expense Breakdown */}
      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title">Expense Breakdown</h2>
          {expenseBreakdown.length === 0 ? (
            <p className="text-base-content/50 text-sm py-8 text-center">Belum ada data pengeluaran bulan ini</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={expenseBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenseBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [rp(Number(v)), "Jumlah"]} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bar Chart — Budget vs Actual */}
      <div className="card bg-base-100 border border-base-300 lg:col-span-2">
        <div className="card-body">
          <h2 className="card-title">Budget vs Actual</h2>
          {budgetActual.length === 0 ? (
            <p className="text-base-content/50 text-sm py-8 text-center">Belum ada data perbandingan</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={budgetActual} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v: any) => `${(Number(v) / 1000000).toFixed(1)}jt`} />
                <Tooltip formatter={(v: any) => [rp(Number(v)), undefined]} />
                <Legend />
                <Bar dataKey="budget" fill="#f59e0b" name="Budget (Bulan Lalu)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="actual" fill="#3b82f6" name="Actual (Bulan Ini)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
