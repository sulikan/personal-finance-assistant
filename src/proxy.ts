import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (!token) return false;
      if (req.nextUrl.pathname.startsWith("/users")) {
        return token.role === "ADMIN";
      }
      return true;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/users/:path*", "/api/protected/:path*"],
};
