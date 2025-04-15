import { getServerSession } from "next-auth/next";
import { NextRequest } from "next/server";
import authOptions from "@/lib/auth/authOptions";
import prisma from "@/prisma/script";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return new Response(
                JSON.stringify({ message: "Not authenticated" }),
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { userId: session.user.id },
            include: {
                admin: true,
                administrative: true,
            },
        });

        if (!user) {
            return new Response(
                JSON.stringify({ message: "User not found" }),
                { status: 404 }
            );
        }

        const data = {
            userId: user.userId,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            dob: user.dob?.toISOString().split("T")[0] || null,
            location: user.location || "", // Return location as a string
            role: user.role,
            ...(user.role === "Admin" && user.admin
                ? { adminDetails: user.admin }
                : {}),
            ...(user.role === "Administrative" && user.administrative
                ? { administrativeDetails: user.administrative }
                : {}),
        };

        return new Response(JSON.stringify(data), { status: 200 });
    } catch (error) {
        console.error("Error fetching user profile:", error);

        return new Response(
            JSON.stringify({ message: "Internal Server Error" }),
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            console.error("Authentication failed: No session or user ID");
            return new Response(
                JSON.stringify({ message: "Not authenticated" }),
                { status: 401 }
            );
        }

        const body = await req.json();
        const { firstName, lastName, phoneNumber, dob, location } = body;

        const updatedUser = await prisma.user.update({
            where: { userId: session.user.id },
            data: {
                firstName,
                lastName,
                phoneNumber,
                dob: dob ? new Date(dob) : null,
                location, // Save location as a string
            },
        });

        console.log("User updated successfully:", updatedUser);
        return new Response(JSON.stringify(updatedUser), { status: 200 });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return new Response(
            JSON.stringify({ message: "Internal Server Error" }),
            { status: 500 }
        );
    }
}
