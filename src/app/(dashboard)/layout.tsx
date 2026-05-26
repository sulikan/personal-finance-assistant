import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { DashboardNav } from "./(components)/dashboard-nav";
import { DashboardHeader } from "./(components)/dashboard-header";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) redirect("/login");

  return (
    <div className="drawer lg:drawer-open">
      <input id="dashboard-drawer" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
      <div className="drawer-side">
        <label htmlFor="dashboard-drawer" aria-label="close sidebar" className="drawer-overlay" />
        <DashboardNav />
      </div>
    </div>
  );
}
