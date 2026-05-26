"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";

export function DashboardHeader() {
  const { data: session } = useSession();
  const name = session?.user?.name || session?.user?.email || "";
  const initial = name ? name.charAt(0).toUpperCase() : "?";

  return (
    <header className="flex h-14 items-center justify-end gap-4 border-b border-base-300 px-6">
      <div className="dropdown dropdown-end">
        <div tabIndex={0} role="button" className="avatar placeholder btn btn-ghost btn-circle">
          <div className="w-9 rounded-full bg-primary text-primary-content text-sm font-semibold">
            {initial}
          </div>
        </div>
        <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-[1] w-48 border border-base-300 p-2 shadow">
          <li className="menu-header px-4 py-2 text-xs text-base-content/50">{name}</li>
          <li>
            <Link href="/profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Edit Profil
            </Link>
          </li>
          <div className="divider my-1"></div>
          <li>
            <button className="flex items-center gap-2 text-error" onClick={() => signOut({ callbackUrl: "/login" })}>
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </li>
        </ul>
      </div>
    </header>
  );
}
