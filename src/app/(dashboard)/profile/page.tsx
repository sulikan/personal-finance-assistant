"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { updateNameAction, changePasswordAction } from "@/actions/profile.actions";
import { User, Lock, Save } from "lucide-react";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [name, setName] = useState("");

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
  }, [session?.user?.name]);

  const [nameMsg, setNameMsg] = useState("");
  const [nameError, setNameError] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameMsg("");
    setNameError("");
    const fd = new FormData();
    fd.set("name", name);
    const res = await updateNameAction(fd);
    if (res?.error) {
      setNameError(res.error);
    } else {
      setNameMsg("Nama berhasil diperbarui");
      await update();
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    setPwError("");
    const fd = new FormData(e.target as HTMLFormElement);
    const res = await changePasswordAction(fd);
    if (res?.error) {
      setPwError(res.error);
    } else {
      setPwMsg("Password berhasil diubah");
      (e.target as HTMLFormElement).reset();
    }
  }

  const role = session?.user?.role;

  return (
    <div className="max-w-xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Profil</h1>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title"><User className="h-5 w-5" /> Informasi Akun</h2>
          <div className="space-y-2 text-sm">
            <div><span className="font-semibold">Email:</span> {session?.user?.email}</div>
            <div><span className="font-semibold">Role:</span> {role}</div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title"><User className="h-5 w-5" /> Ubah Nama</h2>
          <form onSubmit={handleNameSubmit} className="space-y-3">
            <label className="form-control w-full">
              <span className="label-text">Nama Lengkap</span>
              <input type="text" className="input input-bordered w-full" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            {nameError && <div className="alert alert-error py-2 text-sm">{nameError}</div>}
            {nameMsg && <div className="alert alert-success py-2 text-sm">{nameMsg}</div>}
            <button type="submit" className="btn btn-primary mt-3"><Save className="h-4 w-4" /> Simpan</button>
          </form>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-300">
        <div className="card-body">
          <h2 className="card-title"><Lock className="h-5 w-5" /> Ganti Password</h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <label className="form-control w-full">
              <span className="label-text">Password Saat Ini</span>
              <input type="password" name="currentPassword" className="input input-bordered w-full" required />
            </label>
            <label className="form-control w-full">
              <span className="label-text">Password Baru</span>
              <input type="password" name="newPassword" className="input input-bordered w-full" minLength={6} required />
            </label>
            {pwError && <div className="alert alert-error py-2 text-sm">{pwError}</div>}
            {pwMsg && <div className="alert alert-success py-2 text-sm">{pwMsg}</div>}
            <button type="submit" className="btn btn-primary mt-3"><Lock className="h-4 w-4" /> Ganti Password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
