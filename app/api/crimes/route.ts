import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/prisma/script";
import { z } from "zod";


const evidenceSchema = z.object({
    title: z.string().min(1),
    description: z.string().optional(),
    img: z
        .string()
        .nullable()
        .refine(
            (val) => val === null || val.startsWith("data:image/"),
            { message: "Invalid image format" }
        ),
    mime: z.string().optional(),
    filename: z.string().optional(),
    submitedBy: z.number().optional(), // Made optional
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

        // Save evidence with image blob in the same table
        if (evidence.length > 0) {
            await Promise.all(
                evidence.map((ev) =>
                    prisma.evidence.create({
                        data: {
                            title: ev.title, // Ensure `title` is included
                            crimeId: newCrime.crimeId,
                            description: ev.description || "",
                            img: ev.img ? Buffer.from(ev.img.split(",")[1], "base64") : undefined, // Decode base64
                            mime: ev.mime || "image/jpeg",
                            filename: ev.filename || "evidence.jpg",
                            submitedBy: Number(session.user.id),
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

export async function GET() {
    try {
        const crimes = await prisma.crime.findMany();
        return NextResponse.json(crimes);
    } catch (error) {
        console.error("Error fetching crimes:", error);
        return NextResponse.json({ error: "Failed to fetch crimes" }, { status: 500 });
    }
}
