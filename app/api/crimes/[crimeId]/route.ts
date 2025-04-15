import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/script";
import { getServerSession } from "next-auth/next"; // Import getServerSession
import authOptions from "@/lib/auth/authOptions";

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


// abhinav's work
export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const crimeId = parseInt(url.pathname.split("/").pop() || "");

    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (isNaN(crimeId)) {
        return NextResponse.json({ error: "Invalid or missing crimeId" }, { status: 400 });
    }

    try {
        const body = await req.json();
        const { evidenceUpdates = [], deleteEvidenceIds = [], role, updates } = body;

        const crime = await prisma.crime.findUnique({ where: { crimeId } });
        if (!crime) {
            return NextResponse.json({ error: "Crime not found" }, { status: 404 });
        }

        // --- FULL REPLACE LOGIC ---
        if (updates && (role === "Admin" || role === "Administrative")) {
            // Remove all accused and victims
            await prisma.crime.update({
                where: { crimeId },
                data: {
                    accused: { set: [] },
                    victim: { set: [] },
                    administrative: { disconnect: true },
                },
            });

            // Prepare updateData for re-adding
            const updateData: any = {
                title: updates.title,
                crimeType: updates.crimeType,
                status: updates.status,
                description: updates.description,
                dateOccurred: updates.dateOccurred ? new Date(updates.dateOccurred) : undefined,
                location: {
                    update: {
                        city: updates.location.city,
                        state: updates.location.state,
                        country: updates.location.country,
                    },
                },
            };

            // Add new accused and victims
            if (updates.accused) {
                updateData.accused = {
                    connect: updates.accused.map((user: any) => ({ userId: user.userId })),
                };
            }
            if (updates.victims) {
                updateData.victim = {
                    connect: updates.victims.map((user: any) => ({ userId: user.userId })),
                };
            }

            // Only allow Admin to update administrative
            if (role === "Admin" && updates.administrative) {
                updateData.administrative = {
                    connect: { userId: updates.administrative.userId },
                };
            }

            await prisma.crime.update({
                where: { crimeId },
                data: updateData,
            });

            if (updates.caseLog) {
                await prisma.crimeLog.create({
                    data: {
                        crimeId,
                        userId: session.user.id,
                        update: updates.caseLog.message,
                    },
                });
            }
        }

        return NextResponse.json({ status: 200 });
    } catch (error) {
        console.error("Error managing crime and evidence:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
