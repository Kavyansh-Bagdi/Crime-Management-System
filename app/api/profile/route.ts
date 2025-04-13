import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";
import prisma from "@/prisma/script";

export async function GET(req: NextRequest) {
    try {
        // Get the session
        const session = await getServerSession(authOptions);

        // Check if session exists and has a user ID
        if (!session?.user?.id) {
            return new Response(
                JSON.stringify({ message: "Not authenticated" }),
                { status: 401 }
            );
        }

        // Fetch the user from the database
        const user = await prisma.user.findUnique({
            where: { userId: session.user.id },
            include: {
                admin: true,
                administrative: true,
            },
        });

        // Handle case when user is not found
        if (!user) {
            return new Response(
                JSON.stringify({ message: "User not found" }),
                { status: 404 }
            );
        }

        // Return user data as JSON
        return new Response(JSON.stringify(user), { status: 200 });
    } catch (error) {
        // Log the error with additional context
        console.error("Error fetching user profile:", error);

        // Return a generic error message
        return new Response(
            JSON.stringify({ message: "Internal Server Error" }),
            { status: 500 }
        );
    }
}
