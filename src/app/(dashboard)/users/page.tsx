"use client";

import { useEffect, useState, useCallback } from "react";
import { getUsersAction, createUserAction, updateUserAction, deleteUserAction } from "@/actions/user.actions";
import { Users, Plus, Pencil, Trash2, X } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

type ModalMode = "create" | "edit" | null;

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalMode>(null);
  const [editId, setEditId] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<string>("USER");
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const data = await getUsersAction();
    setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function openCreate() {
    setModal("create");
    setEditId("");
    setFormName("");
    setFormEmail("");
    setFormPassword("");
    setFormRole("USER");
    setFormError("");
  }

  function openEdit(u: User) {
    setModal("edit");
    setEditId(u.id);
    setFormName(u.name);
    setFormEmail(u.email);
    setFormPassword("");
    setFormRole(u.role);
    setFormError("");
  }

  function closeModal() {
    setModal(null);
    setFormError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const fd = new FormData();
    fd.set("name", formName);
    fd.set("email", formEmail);
    fd.set("role", formRole);
    if (modal === "edit") {
      fd.set("id", editId);
      if (formPassword) fd.set("password", formPassword);
      const res = await updateUserAction(fd);
      if (res?.error) { setFormError(res.error); return; }
    } else {
      fd.set("password", formPassword);
      const res = await createUserAction(fd);
      if (res?.error) { setFormError(res.error); return; }
    }
    closeModal();
    await fetchUsers();
  }

  async function handleDelete(id: string) {
    const res = await deleteUserAction(id);
    if (res?.error) return;
    setDeleteConfirm(null);
    await fetchUsers();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold"><Users className="h-6 w-6 inline mr-2" />Manajemen User</h1>
        <button className="btn btn-primary" onClick={openCreate}><Plus className="h-4 w-4" /> Tambah User</button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Dibuat</th>
              <th className="w-32">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-8">Memuat...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8">Belum ada user</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge ${u.role === "ADMIN" ? "badge-primary" : "badge-ghost"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="text-sm text-base-content/60">{new Date(u.createdAt).toLocaleDateString("id-ID")}</td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-xs" onClick={() => openEdit(u)} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {u.role !== "ADMIN" && (
                      <>
                        {deleteConfirm === u.id ? (
                          <div className="flex gap-1">
                            <button className="btn btn-error btn-xs" onClick={() => handleDelete(u.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                            <button className="btn btn-ghost btn-xs" onClick={() => setDeleteConfirm(null)}>
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteConfirm(u.id)} title="Hapus">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Create/Edit */}
      {modal && (
        <dialog className="modal modal-open" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">{modal === "create" ? "Tambah User Baru" : "Edit User"}</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="form-control w-full">
                <span className="label-text">Nama</span>
                <input type="text" className="input input-bordered w-full" value={formName} onChange={(e) => setFormName(e.target.value)} required />
              </label>
              <label className="form-control w-full">
                <span className="label-text">Email</span>
                <input type="email" className="input input-bordered w-full" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} required />
              </label>
              {modal === "create" && (
                <label className="form-control w-full">
                  <span className="label-text">Password</span>
                  <input type="password" className="input input-bordered w-full" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} minLength={6} required />
                </label>
              )}
              {modal === "edit" && (
                <label className="form-control w-full">
                  <span className="label-text">Password Baru (biarkan kosong jika tidak diganti)</span>
                  <input type="password" className="input input-bordered w-full" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} minLength={6} placeholder="Kosongkan jika tidak diganti" />
                </label>
              )}
              <label className="form-control w-full">
                <span className="label-text">Role</span>
                <select className="select select-bordered w-full" value={formRole} onChange={(e) => setFormRole(e.target.value)}>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </label>
              {formError && <div className="alert alert-error py-2 text-sm">{formError}</div>}
              <div className="modal-action">
                <button type="button" className="btn" onClick={closeModal}>Batal</button>
                <button type="submit" className="btn btn-primary">
                  {modal === "create" ? "Simpan" : "Update"}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}
    </div>
  );
}
