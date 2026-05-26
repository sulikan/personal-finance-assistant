import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUserId(): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function getCurrentUserRole(): Promise<string> {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user.role;
}
