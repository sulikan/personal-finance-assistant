"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from "@/actions/transaction.actions";
import { getCategories } from "@/actions/category.actions";
import { getWallets } from "@/actions/wallet.actions";
import { getUsersAction } from "@/actions/user.actions";
import { formatRupiah } from "@/lib/utils";
import { Pencil, Trash2, Plus, Filter } from "lucide-react";

const typeOptions = [
  { value: "INCOME", label: "Pemasukan" },
  { value: "EXPENSE", label: "Pengeluaran" },
];

const perPageOptions = [10, 20, 50, 100];

export default function TransactionsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isAdmin = role === "ADMIN";

  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [filterUserId, setFilterUserId] = useState("");

  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "EXPENSE",
    date: new Date().toISOString().split("T")[0],
    categoryId: "",
    walletId: "",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: result, isLoading: txLoading } = useQuery({
    queryKey: ["transactions", page, perPage, filterUserId],
    queryFn: () => getTransactions({ page, perPage, userId: filterUserId || undefined }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ["wallets"],
    queryFn: getWallets,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: getUsersAction,
    enabled: isAdmin,
  });

  const transactions = result?.data || [];
  const total = result?.total || 0;
  const totalPages = Math.ceil(total / perPage);

  const createMutation = useMutation({
    mutationFn: (data: unknown) => createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setEditingId(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallets"] });
      setDeleteId(null);
    },
  });

  function resetForm() {
    setForm({
      description: "", amount: "", type: "EXPENSE",
      date: new Date().toISOString().split("T")[0],
      categoryId: "", walletId: "",
    });
  }

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));
  const walletOptions = wallets.map((w) => ({ value: w.id, label: `${w.name} (${formatRupiah(w.balance)})` }));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description.trim() || !form.amount || !form.categoryId || !form.walletId) return;
    const payload = {
      description: form.description,
      amount: parseFloat(form.amount),
      type: form.type as "INCOME" | "EXPENSE",
      date: form.date,
      categoryId: form.categoryId,
      walletId: form.walletId,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function handleEdit(tx: any) {
    setEditingId(tx.id);
    setForm({
      description: tx.description,
      amount: String(tx.amount),
      type: tx.type,
      date: new Date(tx.date).toISOString().split("T")[0],
      categoryId: tx.categoryId,
      walletId: tx.lines?.[0]?.walletId || "",
    });
  }

  function handlePerPageChange(val: number) {
    setPerPage(val);
    setPage(1);
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Transaksi</h1>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title text-lg">
            <Plus className="w-5 h-5" />
            {editingId ? "Edit Transaksi" : "Tambah Transaksi"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
            <label className="form-control w-48">
              <span className="label-text">Deskripsi</span>
              <input className="input input-bordered input-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi" />
            </label>
            <label className="form-control w-28">
              <span className="label-text">Jumlah</span>
              <input type="number" step="any" className="input input-bordered input-sm" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0" />
            </label>
            <label className="form-control w-32">
              <span className="label-text">Tipe</span>
              <select className="select select-bordered select-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="form-control w-36">
              <span className="label-text">Tanggal</span>
              <input type="date" className="input input-bordered input-sm" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
            <label className="form-control w-44">
              <span className="label-text">Kategori</span>
              <select className="select select-bordered select-sm" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Pilih</option>
                {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <label className="form-control w-44">
              <span className="label-text">Dompet</span>
              <select className="select select-bordered select-sm" value={form.walletId} onChange={(e) => setForm({ ...form, walletId: e.target.value })}>
                <option value="">Pilih</option>
                {walletOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
            <div className="flex gap-2 items-end pb-1">
              <button type="submit" className="btn btn-primary btn-sm" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Simpan" : "Tambah"}
              </button>
              {editingId && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setEditingId(null); resetForm(); }}>Batal</button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body p-0">
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">Tampilkan</span>
              <select className="select select-bordered select-sm" value={perPage} onChange={(e) => handlePerPageChange(Number(e.target.value))}>
                {perPageOptions.map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
              <span className="text-sm">dari {total} transaksi</span>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-base-content/60" />
                <select className="select select-bordered select-sm" value={filterUserId} onChange={(e) => { setFilterUserId(e.target.value); setPage(1); }}>
                  <option value="">Semua User</option>
                  {allUsers.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          {txLoading ? (
            <div className="p-8 text-center"><span className="loading loading-spinner loading-lg"></span></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      {isAdmin && <th>Owner</th>}
                      <th>Deskripsi</th>
                      <th>Kategori</th>
                      <th>Dompet</th>
                      <th>Tanggal</th>
                      <th className="text-right">Jumlah</th>
                      <th className="w-24">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx: any) => (
                      <tr key={tx.id}>
                        {isAdmin && <td className="text-sm">{tx.user?.name || "-"}</td>}
                        <td>{tx.description}</td>
                        <td>{tx.category?.name || "-"}</td>
                        <td>{tx.lines?.[0]?.wallet?.name || "-"}</td>
                        <td>{new Date(tx.date).toLocaleDateString("id-ID")}</td>
                        <td className="text-right">
                          <span className={`badge ${tx.type === "INCOME" ? "badge-success" : "badge-error"}`}>
                            {formatRupiah(tx.amount)}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button className="btn btn-ghost btn-xs" onClick={() => handleEdit(tx)}>
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button className="btn btn-ghost btn-xs" onClick={() => setDeleteId(tx.id)}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr><td colSpan={isAdmin ? 7 : 6} className="text-center py-8 text-base-content/50">Belum ada transaksi</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-base-300">
                  <span className="text-sm text-base-content/60">
                    Halaman {page} dari {totalPages}
                  </span>
                  <div className="join">
                    <button className="join-item btn btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>«</button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let p: number;
                      if (totalPages <= 5) {
                        p = i + 1;
                      } else if (page <= 3) {
                        p = i + 1;
                      } else if (page >= totalPages - 2) {
                        p = totalPages - 4 + i;
                      } else {
                        p = page - 2 + i;
                      }
                      return (
                        <button key={p} className={`join-item btn btn-sm ${p === page ? "btn-active" : ""}`} onClick={() => setPage(p)}>
                          {p}
                        </button>
                      );
                    })}
                    <button className="join-item btn btn-sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>»</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <dialog className={`modal ${deleteId ? "modal-open" : ""}`}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Hapus transaksi?</h3>
          <p className="py-4">Transaksi yang dihapus tidak bisa dikembalikan.</p>
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Batal</button>
            <button className="btn btn-error" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <span className="loading loading-spinner"></span> : "Hapus"}
            </button>
          </div>
        </div>
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}></div>
      </dialog>
    </div>
  );
}
