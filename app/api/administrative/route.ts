import { NextResponse } from "next/server";
import prisma from "@/prisma/script";
import { hash } from "bcryptjs";

export async function GET() {
    try {
        // Fetch users with the role 'Administrative'
        const administrativeUsers = await prisma.user.findMany({
            where: { role: "Administrative" },
            select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
                location: true,
                administrative: {
                    select: {
                        badgeNumber: true,
                        designation: true,
                        department: true,
                    },
                },
                administrativeCrimes: {
                    select: {
                        status: true,
                    },
                },
            },
        });

        // Transform data to include additional details
        const transformedData = administrativeUsers.map((user) => {
            const totalCases = user.administrativeCrimes.length;
            const ongoingCases = user.administrativeCrimes.filter(
                (crime) => crime.status === "Investigation" || crime.status === "Pending"
            ).length;

            return {
                badgeNumber: user.administrative?.badgeNumber || null,
                designation: user.administrative?.designation || null,
                department: user.administrative?.department || null,
                user: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    location: user.location,
                },
                totalCases,
                ongoingCases,
            };
        });

        return NextResponse.json(transformedData);
    } catch (error) {
        console.error("Error fetching administrative data:", error);
        return NextResponse.json({ error: "Failed to fetch administrative data" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { firstName, lastName, email, password, designation, department } = await request.json();

        if (!firstName || !lastName || !email || !password || !designation || !department) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: "Email already exists" }, { status: 400 });
        }

        // Hash the password
        const hashedPassword = await hash(password, 10);

        // Create a new user
        const newUser = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                password: hashedPassword,
                role: "Administrative",
            },
        });

        // Create a new administrative entry
        const newAdministrative = await prisma.administrative.create({
            data: {
                userId: newUser.userId,
                designation,
                department,
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return NextResponse.json(newAdministrative, { status: 201 });
    } catch (error) {
        console.error("Error creating administrative entry:", error);
        return NextResponse.json({ error: "Failed to create administrative entry" }, { status: 500 });
    }
}
