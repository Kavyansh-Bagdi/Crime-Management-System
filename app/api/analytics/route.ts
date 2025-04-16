import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
    const userCount = await prisma.user.count();
    const crimeCount = await prisma.crime.count();
    const evidenceCount = await prisma.evidence.count();

    // Example: crimes by status for chart
    const crimesByStatus = await prisma.crime.groupBy({
        by: ["status"],
        _count: { _all: true },
    });

    // Fetch latest 5 FIRs (crimes)
    const latestFIRs = await prisma.crime.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
            crimeId: true,
            title: true,
            crimeType: true,
            status: true,
            dateOccurred: true,
            createdAt: true,
            location: {
                select: {
                    city: true,
                    state: true,
                    country: true,
                }
            }
        }
    });

    return NextResponse.json({
        userCount,
        crimeCount,
        evidenceCount,
        crimesByStatus,
        latestFIRs,
    });
}
