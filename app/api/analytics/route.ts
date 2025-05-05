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

    // Crimes by location (city)
    const crimesByLocation = await prisma.crime.groupBy({
        by: ["locationId"],
        _count: { _all: true },
    });
    // Attach city/state/country info
    const locationIds = crimesByLocation.map((c) => c.locationId);
    const locations = await prisma.location.findMany({
        where: { locationId: { in: locationIds } },
        select: { locationId: true, city: true, state: true, country: true }
    });
    const crimesByCity = crimesByLocation.map((c) => {
        const loc = locations.find(l => l.locationId === c.locationId);
        return {
            city: loc?.city ?? "Unknown",
            state: loc?.state ?? "",
            country: loc?.country ?? "",
            count: c._count._all
        };
    });

    // Crimes by type
    const crimesByType = await prisma.crime.groupBy({
        by: ["crimeType"],
        _count: { _all: true },
    });

    // Crimes by month (last 12 months)
    const now = new Date();
    const months: { year: number, month: number }[] = [];
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    // Get all crimes in last 12 months
    const startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const crimesLastYear = await prisma.crime.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true }
    });
    // Count by month
    const crimesByMonth = months.map(({ year, month }) => {
        const count = crimesLastYear.filter(c => {
            const d = c.createdAt;
            return d.getFullYear() === year && d.getMonth() + 1 === month;
        }).length;
        return {
            year,
            month,
            count
        };
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
        crimesByCity,
        crimesByType,
        crimesByMonth,
        latestFIRs,
    });
}
