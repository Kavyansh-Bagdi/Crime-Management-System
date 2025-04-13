import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
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
            async authorize(credentials: { email: string; password: string; role: string }) {
                const { email, password, role } = credentials || {};
                if (!email || !password || !role) {
                    throw new Error("Missing required fields: email, password, or role.");
                }

                const user = await prisma.user.findUnique({
                    where: { email },
                });
                if (!user) {
                    throw new Error("User not found.");
                }

                const passwordMatch = await bcrypt.compare(password, user.password);
                if (!passwordMatch) {
                    throw new Error("Invalid password.");
                }

                if (user.role !== role) {
                    throw new Error("Invalid role.");
                }

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
                session.user.id = token.id as string;
                session.user.name = token.name;
                session.user.email = token.email;
                session.user.role = token.role;
            }
            return session;
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
