"use client"

import { useState, useRef, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/actions/category.actions"
import { Plus, Pencil, Trash2, Tags } from "lucide-react"

export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: "", type: "EXPENSE", parentId: "" })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const deleteModalRef = useRef<HTMLDialogElement>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  })

  const createMutation = useMutation({
    mutationFn: (data: unknown) => createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      setForm({ name: "", type: "EXPENSE", parentId: "" })
      setFeedback({ type: "success", message: "Kategori berhasil ditambahkan" })
    },
    onError: () => setFeedback({ type: "error", message: "Gagal menambahkan kategori" }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) => updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      setEditingId(null)
      setForm({ name: "", type: "EXPENSE", parentId: "" })
      setFeedback({ type: "success", message: "Kategori berhasil diperbarui" })
    },
    onError: () => setFeedback({ type: "error", message: "Gagal memperbarui kategori" }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
      setDeleteTarget(null)
      setFeedback({ type: "success", message: "Kategori berhasil dihapus" })
    },
    onError: () => {
      setFeedback({ type: "error", message: "Gagal menghapus kategori" })
      setDeleteTarget(null)
    },
  })

  useEffect(() => {
    if (deleteTarget) deleteModalRef.current?.showModal()
    else deleteModalRef.current?.close()
  }, [deleteTarget])

  const parentOptions = categories.filter((c) => c.id !== editingId).map((c) => ({ value: c.id, label: c.name }))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = { name: form.name, type: form.type as "INCOME" | "EXPENSE", parentId: form.parentId || null }
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  function handleEdit(cat: { id: string; name: string; type: string; parentId: string | null }) {
    setEditingId(cat.id)
    setForm({ name: cat.name, type: cat.type, parentId: cat.parentId || "" })
  }

  function handleCancel() {
    setEditingId(null)
    setForm({ name: "", type: "EXPENSE", parentId: "" })
  }

  if (isLoading) return <div className="p-6">Memuat...</div>

  return (
    <div className="space-y-6">
      {feedback && (
        <div className={`alert ${feedback.type === "success" ? "alert-success" : "alert-error"} flex justify-between`}>
          <span>{feedback.message}</span>
          <button className="btn btn-ghost btn-xs" onClick={() => setFeedback(null)}>✕</button>
        </div>
      )}

      <h1 className="text-3xl font-bold">Kategori</h1>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title">
            <Tags className="h-5 w-5" />
            {editingId ? "Edit Kategori" : "Tambah Kategori"}
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-4">
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">Nama</span>
              </div>
              <input className="input input-bordered" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nama kategori" />
            </label>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">Tipe</span>
              </div>
              <select className="select select-bordered" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="INCOME">Pemasukan</option>
                <option value="EXPENSE">Pengeluaran</option>
              </select>
            </label>
            <label className="form-control w-full max-w-xs">
              <div className="label">
                <span className="label-text">Kategori Induk</span>
              </div>
              <select className="select select-bordered" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
                <option value="">Tidak ada</option>
                {parentOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
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
                <th>Induk</th>
                <th className="w-[100px]">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td>{cat.name}</td>
                  <td>
                    <span className={`badge ${cat.type === "INCOME" ? "badge-success" : "badge-error"}`}>
                      {cat.type === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                    </span>
                  </td>
                  <td className="text-base-content/60">
                    {cat.parentId ? categories.find((p) => p.id === cat.parentId)?.name || "-" : "-"}
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(cat)}><Pencil className="h-4 w-4" /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget({ id: cat.id, name: cat.name })}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-base-content/60">Belum ada kategori</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <dialog ref={deleteModalRef} className="modal modal-middle" onClose={() => setDeleteTarget(null)}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">Hapus Kategori</h3>
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
