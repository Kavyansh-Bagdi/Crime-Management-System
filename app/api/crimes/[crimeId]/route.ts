import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/script";
import { getServerSession } from "next-auth/next"; // Import getServerSession
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        const url = new URL(req.url);
        const crimeId = parseInt(url.pathname.split("/").pop() || "");

        if (isNaN(crimeId)) {
            return NextResponse.json({ error: "Invalid or missing crimeId" }, { status: 400 });
        }

        const crime = await prisma.crime.findUnique({
            where: { crimeId },
            include: {
                victim: {
                    select: {
                        firstName: true,
                        lastName: true,
                        userId: true,
                        email: true,
                        phoneNumber: true,
                    }
                },
                accused: {
                    select: {
                        firstName: true,
                        lastName: true,
                        userId: true,
                        email: true,
                        phoneNumber: true,
                    }
                },
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        userId: true,
                        email: true,
                        phoneNumber: true,
                    }
                },
                administrative: {
                    select: {
                        firstName: true,
                        lastName: true,
                        userId: true,
                        email: true,
                        phoneNumber: true,
                        administrative: {
                            select: {
                                designation: true,
                                badgeNumber: true,
                                department: true,
                            }
                        }
                    }
                },
                location: true,
                crimeLogs: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        if (!crime) {
            return NextResponse.json({ error: "Crime not found" }, { status: 404 });
        }

        return NextResponse.json({
            crimeId: crime.crimeId,
            crimeType: crime.crimeType,
            title: crime.title,
            description: crime.description,
            dateOccurred: crime.dateOccurred,
            status: crime.status,
            location: crime.location,
            reportedBy: crime.user,
            administrative: crime.administrative || null,
            victim: crime.victim,
            accused: crime.accused,
            crimeLogs: crime.crimeLogs,
        });
    } catch (error) {
        console.error("Error fetching crime details:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const crimeId = parseInt(url.pathname.split("/").pop() || "");

    const session = await getServerSession(authOptions); // Use getServerSession with authOptions
    if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session.user) {
        return NextResponse.json({ error: "User not found" }, { status: 401 }); // Ensure user is present in session
    }

    if (isNaN(crimeId)) {
        return NextResponse.json({ error: "Invalid or missing crimeId" }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { evidenceUpdates = [], deleteEvidenceIds = [] } = body;

        // Validate crime existence
        const crime = await prisma.crime.findUnique({ where: { crimeId } });
        if (!crime) {
            return NextResponse.json({ error: "Crime not found" }, { status: 404 });
        }

        // Delete evidence if specified
        if (deleteEvidenceIds.length > 0) {
            await prisma.evidence.deleteMany({
                where: {
                    evidenceId: { in: deleteEvidenceIds },
                },
            });
        }

        // Update or create evidence
        await Promise.all(
            evidenceUpdates.map((ev) =>
                ev.evidenceId
                    ? prisma.evidence.update({
                        where: { evidenceId: ev.evidenceId },
                        data: {
                            title: ev.title,
                            description: ev.description,
                            img: ev.img ? Buffer.from(ev.img.split(",")[1], "base64") : undefined, // Decode base64
                            mime: ev.mime || undefined, // Update mime only if provided
                            filename: ev.filename || undefined, // Update filename only if provided
                            submitedBy: ev.submitedBy, // Ensure submitedBy is included
                        },
                    })
                    : prisma.evidence.create({
                        data: {
                            crimeId,
                            title: ev.title,
                            description: ev.description,
                            img: ev.img ? Buffer.from(ev.img.split(",")[1], "base64") : undefined, // Decode base64
                            mime: ev.mime,
                            filename: ev.filename,
                            submitedBy: session.user.id,
                        },
                    })
            )
        );

        return NextResponse.json({ success: true, message: "Evidence managed successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error managing evidence:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

