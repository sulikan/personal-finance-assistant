"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ArrowRightLeft,
  Wallet,
  Tags,
  FileText,
  Users,
} from "lucide-react";

const mainLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowRightLeft },
  { href: "/wallets", label: "Dompet", icon: Wallet },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/reports", label: "Laporan", icon: FileText },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;

  return (
    <aside className="flex h-screen w-60 flex-col bg-base-100">
      <div className="flex h-14 items-center px-6 font-semibold">Finance App</div>
      <ul className="menu flex-1">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <li key={link.href}>
              <Link href={link.href} className={isActive ? "menu-active" : undefined}>
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <ul className="menu border-t border-base-300 py-2">
        {role === "ADMIN" && (
          <li>
            <Link href="/users" className={pathname === "/users" ? "menu-active" : undefined}>
              <Users className="h-4 w-4" />
              Users
            </Link>
          </li>
        )}
      </ul>
    </aside>
  );
}
