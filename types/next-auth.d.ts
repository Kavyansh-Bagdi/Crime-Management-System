import NextAuth, { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
    interface Session {
        user: {
            id: number;
            name: string;
            email: string;
            role: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: number;
        name: string;
        email: string;
        role: string;
    }
}
