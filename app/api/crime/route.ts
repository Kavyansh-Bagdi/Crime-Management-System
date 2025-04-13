import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import prisma from "@/prisma/script"
import { z } from "zod"

const evidenceSchema = z.object({
    evidenceType: z.string().min(1),
    description: z.string().optional(),
    img: z.union([
        z.string().refine(val => val.startsWith("data:image/"), {
            message: "Invalid image format",
        }),
        z.null(),
    ]),
})

const crimeSchema = z.object({
    title: z.string().min(10),
    crimeType: z.string().min(1),
    description: z.string().optional(),
    dateOccurred: z.string().refine(val => !isNaN(Date.parse(val)), {
        message: "Invalid date",
    }),
    accusedId: z.number().optional(),
    victimId: z.number().optional(),
    administrativeId: z.number().optional(),
    location: z.object({
        city: z.string(),
        state: z.string(),
        country: z.string(),
    }),
    evidence: z.array(evidenceSchema).optional(),
})

export async function POST(req: Request) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const parsed = crimeSchema.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
    }

    const {
        title,
        crimeType,
        description,
        dateOccurred,
        accusedId,
        victimId,
        administrativeId,
        location,
        evidence = [],
    } = parsed.data

    try {
        // Validate all users exist
        const userChecks = await Promise.all([
            prisma.user.findUnique({ where: { userId: Number(session.user.id) } }),
            accusedId ? prisma.user.findUnique({ where: { userId: accusedId } }) : Promise.resolve(null),
            victimId ? prisma.user.findUnique({ where: { userId: victimId } }) : Promise.resolve(null),
            administrativeId ? prisma.user.findUnique({ where: { userId: administrativeId } }) : Promise.resolve(null),
        ])

        const [reporter, accusedUser, victimUser, adminUser] = userChecks

        if (!reporter) return NextResponse.json({ error: "Reporting user not found" }, { status: 400 })
        if (accusedId && !accusedUser) return NextResponse.json({ error: "Accused user not found" }, { status: 400 })
        if (victimId && !victimUser) return NextResponse.json({ error: "Victim user not found" }, { status: 400 })
        if (administrativeId && !adminUser) return NextResponse.json({ error: "Administrative user not found" }, { status: 400 })

        // Create location
        const createdLocation = await prisma.location.create({
            data: {
                crime: 0,
                city: location.city,
                state: location.state,
                country: location.country,
            },
        })

        // Create crime
        const newCrime = await prisma.crime.create({
            data: {
                title,
                crimeType,
                description,
                dateOccurred: new Date(dateOccurred),
                status: "Reported",
                userId: Number(session.user.id),
                accusedId,
                victimId,
                administrativeId,
                locationId: createdLocation.locationId,
            },
        })

        // Insert Evidence if provided
        if (evidence.length > 0) {
            await Promise.all(
                evidence.map((ev) =>
                    prisma.evidence.create({
                        data: {
                            crimeId: newCrime.crimeId,
                            evidenceType: ev.evidenceType,
                            description: ev.description,
                            img: ev.img ? Buffer.from(ev.img.split(",")[1], "base64") : undefined,
                            submittedBy: Number(session.user.id),
                        },
                    })
                )
            )
        }

        return NextResponse.json({ success: true, crimeId: newCrime.crimeId }, { status: 201 })
    } catch (error) {
        console.error("Error creating crime report:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
