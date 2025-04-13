import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/script";
import { z } from "zod";


const evidenceSchema = z.object({
    evidenceType: z.string().min(1),
    description: z.string().optional(),
    img: z
        .string()
        .nullable()
        .refine(
            (val) => val === null || val.startsWith("data:image/"),
            { message: "Invalid image format" }
        ),
});


const crimeSchema = z.object({
    title: z.string().min(10),
    crimeType: z.string().min(1),
    description: z.string().optional(),
    dateOccurred: z.string().refine(val => !isNaN(Date.parse(val)), {
        message: "Invalid date",
    }),
    accusedIds: z.array(z.number()).optional(),
    victimIds: z.array(z.number()).optional(),
    location: z.object({
        city: z.string(),
        state: z.string(),
        country: z.string(),
    }),
    evidence: z.array(evidenceSchema).optional(),
});

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = crimeSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const {
        title,
        crimeType,
        description,
        dateOccurred,
        accusedIds = [],
        victimIds = [],
        location,
        evidence = [],
    } = parsed.data;

    try {

        const reporter = await prisma.user.findUnique({
            where: { userId: Number(session.user.id) }
        });
        if (!reporter) {
            return NextResponse.json({ error: "Reporting user not found" }, { status: 400 });
        }


        if (accusedIds.length > 0) {
            const accusedUsers = await Promise.all(
                accusedIds.map((id) => prisma.user.findUnique({ where: { userId: id } }))
            );
            if (accusedUsers.some(user => !user)) {
                return NextResponse.json({ error: "One or more accused users not found" }, { status: 400 });
            }
        }


        if (victimIds.length > 0) {
            const victimUsers = await Promise.all(
                victimIds.map((id) => prisma.user.findUnique({ where: { userId: id } }))
            );
            if (victimUsers.some(user => !user)) {
                return NextResponse.json({ error: "One or more victim users not found" }, { status: 400 });
            }
        }


        if (!prisma || !prisma.location) {
            throw new Error("Prisma client is not properly initialized.");
        }


        const createdLocation = await prisma.location.create({
            data: {
                city: location.city,
                state: location.state,
                country: location.country,
            },
        });


        const newCrime = await prisma.crime.create({
            data: {
                title,
                crimeType,
                description,
                dateOccurred: new Date(dateOccurred),
                status: "Reported",
                userId: Number(session.user.id),
                locationId: createdLocation.locationId,
                accused: {
                    connect: accusedIds.map((id) => ({ userId: id })),
                },
                victim: {
                    connect: victimIds.map((id) => ({ userId: id })),
                },
            },
        });


        if (evidence.length > 0) {
            await Promise.all(
                evidence.map((ev) =>
                    prisma.evidence.create({
                        data: {
                            crimeId: newCrime.crimeId,
                            evidenceType: ev.evidenceType,
                            description: ev.description || "",
                            img: ev.img ? Buffer.from(ev.img.split(",")[1], "base64") : undefined,
                            submittedBy: Number(session.user.id),
                        },
                    })
                )
            );
        }

        return NextResponse.json({ success: true, crimeId: newCrime.crimeId }, { status: 201 });
    } catch (error) {
        console.error("Error creating crime report:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const crimeId = searchParams.get("crimeId");

    try {
        if (crimeId) {
            // Fetch a single crime by ID
            const crime = await prisma.crime.findUnique({
                where: { crimeId: Number(crimeId) },
                include: {
                    location: true,
                    user: true, // Include the user who reported the crime
                    administrative: true, // Directly include the administrative user
                    victim: true, // Include victim details
                    accused: true, // Include accused details
                    Evidence: true, // Use the correct relation name for evidence
                },
            });

            if (!crime) {
                return NextResponse.json({ error: "Crime not found" }, { status: 404 });
            }

            return NextResponse.json(crime);
        } else {
            // Fetch all crimes
            const crimes = await prisma.crime.findMany({
                include: {
                    location: true,
                    user: true, // Include the user who reported the crime
                    administrative: true, // Directly include the administrative user
                    victim: true, // Include victim details
                    accused: true, // Include accused details
                    Evidence: true, // Use the correct relation name for evidence
                },
            });

            return NextResponse.json(crimes);
        }
    } catch (error) {
        console.error("Error fetching crimes:", error.message); // Log the error message
        console.error("Stack trace:", error.stack); // Log the stack trace for debugging
        return NextResponse.json({ error: "Failed to fetch crimes", details: error.message }, { status: 500 });
    }
}
