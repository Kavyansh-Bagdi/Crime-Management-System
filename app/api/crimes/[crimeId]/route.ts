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

export async function PUT(req: NextRequest) {
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
        // Fetch the crime to check administrative assignment
        const crime = await prisma.crime.findUnique({
            where: { crimeId },
            select: {
                administrative: { select: { userId: true } },
            },
        });

        if (!crime) {
            return NextResponse.json({ error: "Crime not found" }, { status: 404 });
        }

        // Only allow if user is admin or assigned administrative
        const userRole = session.user.role;
        const userId = session.user.id;
        const adminUserId = crime.administrative?.userId;

        if (
            userRole !== "Admin" &&
            (!adminUserId || adminUserId !== userId)
        ) {
            return NextResponse.json({ error: "Forbidden: Only assigned administrative or admin can update this crime" }, { status: 403 });
        }

        const body = await req.json();
        const {
            title,
            crimeType,
            status,
            description,
            dateOccurred,
            location,
            accused = [],
            victims = [],
            administrative,
            caseLogMessage, // <-- allow custom message if sent
        } = body;

        // Prepare update data
        const updateData: any = {
            title,
            crimeType,
            status,
            description,
            dateOccurred: dateOccurred ? new Date(dateOccurred) : undefined,
        };

        // Location update
        if (location) {
            updateData.location = {
                update: {
                    city: location.city || "",
                    state: location.state || "",
                    country: location.country || "",
                },
            };
        }

        // Disconnect all relations first
        await prisma.crime.update({
            where: { crimeId },
            data: {
                accused: { set: [] },
                victim: { set: [] },
                administrative: { disconnect: true },
            },
        });

        // Connect new relations
        if (accused.length) {
            updateData.accused = {
                connect: accused.map((user: any) => ({ userId: user.userId })),
            };
        }
        if (victims.length) {
            updateData.victim = {
                connect: victims.map((user: any) => ({ userId: user.userId })),
            };
        }
        if (administrative && administrative.userId) {
            updateData.administrative = {
                connect: { userId: administrative.userId },
            };
        }

        // Run update and log in a transaction
        await prisma.$transaction([
            prisma.crime.update({
                where: { crimeId },
                data: updateData,
            }),
            prisma.crimeLog.create({
                data: {
                    crimeId,
                    userId: session.user.id,
                    update: caseLogMessage || "Crime details updated.",
                },
            }),
        ]);

        return NextResponse.json({ message: "Crime updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating crime:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

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

        // --- Evidence Handling ---
        const evidenceOps: any[] = [];

        // Handle evidence updates (add or update)
        for (const ev of evidenceUpdates) {
            if (ev.evidenceId) {
                // Update existing evidence
                evidenceOps.push(
                    prisma.evidence.update({
                        where: { evidenceId: ev.evidenceId },
                        data: {
                            title: ev.title,
                            description: ev.description,
                            // Only update img/mime/filename if provided
                            ...(ev.img && { img: ev.img }),
                            ...(ev.mime && { mime: ev.mime }),
                            ...(ev.filename && { filename: ev.filename }),
                        },
                    })
                );
            } else {
                // Create new evidence
                evidenceOps.push(
                    prisma.evidence.create({
                        data: {
                            title: ev.title,
                            description: ev.description,
                            img: ev.img,
                            mime: ev.mime,
                            filename: ev.filename,
                            crimeId: crimeId,
                            submitedBy: ev.submitedBy || session.user.id,
                        },
                    })
                );
            }
        }

        // Handle evidence deletions
        if (deleteEvidenceIds && deleteEvidenceIds.length > 0) {
            evidenceOps.push(
                prisma.evidence.deleteMany({
                    where: {
                        evidenceId: { in: deleteEvidenceIds },
                        crimeId: crimeId,
                    },
                })
            );
        }

        // --- Crime update logic (unchanged) ---
        const validRoles = ["Admin", "Administrative"];
        let crimeOps: any[] = [];
        if (updates && validRoles.includes(role)) {
            // ...existing code for crime update...
            // (leave as is)
            // ...existing code...
            // await prisma.$transaction(transactionOperations);
            // Instead, push to crimeOps and run all in one transaction below
            const transactionOperations = [
                prisma.crime.update({
                    where: { crimeId },
                    data: {
                        accused: { set: [] },
                        victim: { set: [] },
                        administrative: { disconnect: true },
                    },
                }),
                (async () => {
                    const updateData: any = {
                        title: updates.title,
                        crimeType: updates.crimeType,
                        status: updates.status,
                        description: updates.description,
                        dateOccurred: updates.dateOccurred ? new Date(updates.dateOccurred) : undefined,
                    };

                    if (updates.location) {
                        updateData.location = {
                            update: {
                                city: updates.location.city || "",
                                state: updates.location.state || "",
                                country: updates.location.country || "",
                            },
                        };
                    }

                    if (updates.accused?.length) {
                        updateData.accused = {
                            connect: updates.accused.map((user: any) => ({ userId: user.userId })),
                        };
                    }

                    if (updates.victims?.length) {
                        updateData.victim = {
                            connect: updates.victims.map((user: any) => ({ userId: user.userId })),
                        };
                    }

                    if (role === "Admin" && updates.administrative) {
                        updateData.administrative = {
                            connect: { userId: updates.administrative.userId },
                        };
                    }

                    return prisma.crime.update({
                        where: { crimeId },
                        data: updateData,
                    });
                })(),
                updates.caseLog
                    ? prisma.crimeLog.create({
                        data: {
                            crimeId,
                            userId: session.user.id,
                            update: updates.caseLog.message,
                        },
                    })
                    : undefined,
            ].filter(Boolean);
            crimeOps = transactionOperations;
        }

        // Run all operations in a single transaction
        await prisma.$transaction([...evidenceOps, ...crimeOps]);

        return NextResponse.json({ message: "Crime/evidence updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error managing crime and evidence:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
