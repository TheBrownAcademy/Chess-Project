import "@auth/core";
import "@auth/core/jwt";

declare module "@auth/core" {
  interface Session {
    user?: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    provider?: string;
  }
}
