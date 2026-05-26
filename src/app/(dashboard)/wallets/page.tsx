"use client"

import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getWallets, createWallet, updateWallet, deleteWallet } from "@/actions/wallet.actions"
import { Plus, Pencil, Trash2, Wallet } from "lucide-react"
import { formatRupiah } from "@/lib/utils"

export default function WalletsPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: "", type: "CASH", description: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const deleteModalRef = useRef<HTMLDialogElement>(null)

  const { data: wallets = [], isLoading } = useQuery({
    queryKey: ["wallets"],
    queryFn: getWallets,
  })

  const createMutation = useMutation({
    mutationFn: (data: unknown) => createWallet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] })
      setForm({ name: "", type: "CASH", description: "" })
      setFeedback({ type: "success", message: "Dompet berhasil ditambahkan" })
    },
    onError: () => setFeedback({ type: "error", message: "Gagal menambahkan dompet" }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateWallet(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] })
      setEditingId(null)
      setForm({ name: "", type: "CASH", description: "" })
      setFeedback({ type: "success", message: "Dompet berhasil diperbarui" })
    },
    onError: () => setFeedback({ type: "error", message: "Gagal memperbarui dompet" }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteWallet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallets"] })
      setDeleteTarget(null)
      setFeedback({ type: "success", message: "Dompet berhasil dihapus" })
    },
    onError: () => {
      setFeedback({ type: "error", message: "Gagal menghapus dompet" })
      setDeleteTarget(null)
    },
  })

  useEffect(() => {
    if (deleteTarget) deleteModalRef.current?.showModal()
    else deleteModalRef.current?.close()
  }, [deleteTarget])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = { name: form.name, type: form.type as "CASH" | "BANK" | "E_WALLET", description: form.description }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  function handleEdit(w: { id: string; name: string; type: string; description: string }) {
    setEditingId(w.id)
    setForm({ name: w.name, type: w.type, description: w.description })
  }

  function handleCancel() {
    setEditingId(null)
    setForm({ name: "", type: "CASH", description: "" })
  }

  const badgeMap: Record<string, string> = { CASH: "badge-info", BANK: "badge-primary", E_WALLET: "badge-warning" }
  const typeLabels: Record<string, string> = { CASH: "Tunai", BANK: "Bank", E_WALLET: "E-Wallet" }

  if (isLoading) return <div className="p-6">Memuat...</div>

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`alert ${feedback.type === "success" ? "alert-success" : "alert-error"} flex justify-between`}>
          <span>{feedback.message}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      <h1 className="text-3xl font-bold">Dompet</h1>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title">
            <Wallet className="h-5 w-5" />
            {editingId ? "Edit Dompet" : "Tambah Dompet"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">Nama</span>
              </div>
              <input className="input input-bordered" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama dompet" />
            </label>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">Tipe</span>
              </div>
              <select className="select select-bordered" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="CASH">Tunai</option>
                <option value="BANK">Bank</option>
                <option value="E_WALLET">E-Wallet</option>
              </select>
            </label>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">Deskripsi</span>
              </div>
              <textarea className="textarea textarea-bordered" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi" />
            </label>
            <div className="flex gap-2 pb-1">
              <button type="submit" className="btn btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : <Plus className="h-4 w-4" />}
                {editingId ? "Simpan" : "Tambah"}
              </button>
              {editingId && (
                <button type="button" className="btn btn-ghost" onClick={handleCancel}>Batal</button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Tipe</th>
                <th>Deskripsi</th>
                <th>Saldo</th>
                <th className="w-[100px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {wallets.map((w) => (
                <tr key={w.id}>
                  <td className="font-medium">{w.name}</td>
                  <td>
                    <span className={`badge ${badgeMap[w.type] || ""}`}>{typeLabels[w.type] || w.type}</span>
                  </td>
                  <td className="text-base-content/60">{w.description || "-"}</td>
                  <td>{formatRupiah(w.balance)}</td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(w)}><Pencil className="h-4 w-4" /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget({ id: w.id, name: w.name })}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {wallets.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-base-content/60">Belum ada dompet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <dialog ref={deleteModalRef} className="modal modal-middle" onClose={() => setDeleteTarget(null)}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Hapus Dompet</h3>
          <p className="py-4">Apakah Anda yakin ingin menghapus <strong>{deleteTarget?.name}</strong>?</p>
          <div className="modal-action">
            <button className="btn btn-ghost" onClick={() => { setDeleteTarget(null); deleteModalRef.current?.close() }}>Batal</button>
            <button className="btn btn-error" disabled={deleteMutation.isPending} onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}>
              {deleteMutation.isPending && <span className="loading loading-spinner loading-xs" />}
              Hapus
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  )
}
