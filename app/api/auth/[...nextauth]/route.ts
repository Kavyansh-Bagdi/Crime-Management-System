import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/prisma/script";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
                role: {
                    label: "Role",
                    type: "text",
                    placeholder: "Civilian | Admin | Administrative",
                },
            },
            async authorize(credentials) {
                const { email, password, role } = credentials ?? {};
                if (!email || !password || !role) {
                    throw new Error("Missing required fields.");
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                });

                if (!user) throw new Error("User not found.");

                const isPasswordValid = await bcrypt.compare(password, user.password);
                if (!isPasswordValid) throw new Error("Invalid password.");

                if (user.role !== role) throw new Error("Invalid role.");

                return {
                    id: user.userId,
                    name: `${user.firstName} ${user.lastName ?? ""}`,
                    email: user.email,
                    role: user.role,
                };
            },
        }),
    ],

    pages: {
        signIn: "/auth/signin",
    },

    session: {
        strategy: "jwt",
        maxAge: 60 * 60, // 1 hour
    },

    jwt: {
        maxAge: 60 * 60, // 1 hour
    },

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.role = user.role;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as number;
                session.user.name = token.name as string;
                session.user.email = token.email as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
