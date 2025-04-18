import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/authOptions";
import prisma from "@/prisma/script";
import { z } from "zod";

const evidenceSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    img: z
        .string()
        .nullable()
        .refine((val) => val === null || val.startsWith("data:image/"), {
            message: "Invalid image format",
        }),
    mime: z.string().optional(),
    filename: z.string().optional(),
    submitedBy: z.number().optional(),
});

const crimeSchema = z.object({
    title: z.string().min(1),
    crimeType: z.string().min(1),
    description: z.string().optional(),
    dateOccurred: z.string().refine((val) => !isNaN(Date.parse(val)), {
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

export async function POST(req: Request): Promise<NextResponse> {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = crimeSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const {
        title = "Untitled Crime Report",
        crimeType,
        description,
        dateOccurred,
        accusedIds = [],
        victimIds = [],
        location,
        evidence = [],
    } = parsed.data;

    try {
        const userId = session.user.id;

        const reporter = await prisma.user.findUnique({
            where: { userId },
        });

        if (!reporter) {
            return NextResponse.json({ error: "Reporting user not found" }, { status: 400 });
        }

        if (accusedIds.length > 0) {
            const accusedUsers = await Promise.all(
                accusedIds.map((id) => prisma.user.findUnique({ where: { userId: id } }))
            );
            if (accusedUsers.some((user) => !user)) {
                return NextResponse.json({ error: "One or more accused users not found" }, { status: 400 });
            }
        }

        if (victimIds.length > 0) {
            const victimUsers = await Promise.all(
                victimIds.map((id) => prisma.user.findUnique({ where: { userId: id } }))
            );
            if (victimUsers.some((user) => !user)) {
                return NextResponse.json({ error: "One or more victim users not found" }, { status: 400 });
            }
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
                userId,
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
                            title: ev.title,
                            crimeId: newCrime.crimeId,
                            description: ev.description || "",
                            img: ev.img ? Buffer.from(ev.img.split(",")[1] || "", "base64") : undefined,
                            mime: ev.mime || "image/jpeg",
                            filename: ev.filename || "evidence.jpg",
                            submitedBy: userId,
                        },
                    })
                )
            );
        }

        return NextResponse.json({ success: true, crimeId: newCrime.crimeId }, { status: 201 });
    } catch (error: any) {
        console.error("Error creating crime report:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}

export async function GET(req: Request): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const userRole = session.user.role;

        let whereClause = {};
        if (userRole === "Civilian") {
            // Show crimes where the user is either a victim or accused
            whereClause = {
                OR: [
                    { victim: { some: { userId } } },
                    { accused: { some: { userId } } }
                ]
            };
        } else if (userRole === "Administrative") {
            whereClause = { administrativeId: userId };
        }
        // Admin can see all crimes, so no where clause needed

        const crimes = await prisma.crime.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        userId: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true,
                    }
                },
                administrative: {
                    select: {
                        userId: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phoneNumber: true,
                    }
                },
                victim: {
                    select: {
                        userId: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                accused: {
                    select: {
                        userId: true,
                        firstName: true,
                        lastName: true,
                    }
                },
                location: true,
            },
            orderBy: {
                dateOccurred: 'desc' // Order by most recent first
            }
        });

        // Transform the data to match the expected format
        const transformedCrimes = crimes.map(crime => ({
            id: crime.crimeId,
            caseId: `CR-${crime.crimeId}`,
            title: crime.title,
            crimeType: crime.crimeType,
            status: crime.status,
            time: new Date(crime.dateOccurred).toLocaleDateString(),
            location: `${crime.location.city}, ${crime.location.state}`,
            assignedOfficer: crime.administrative 
                ? `${crime.administrative.firstName} ${crime.administrative.lastName}`
                : "Unassigned",
            description: crime.description,
            role: crime.victim.some(v => v.userId === userId) ? "Victim" : "Accused"
        }));

        return NextResponse.json(transformedCrimes);
    } catch (error) {
        console.error("Error fetching crimes:", error);
        return NextResponse.json({ error: "Failed to fetch crimes" }, { status: 500 });
    }
}
