import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma" // Assuming Prisma is used for database access

export async function GET() {
    try {
        const cases = await prisma.case.findMany({
            select: {
                id: true,
                caseId: true,
                crimeType: true,
                location: true,
                time: true,
                status: true,
                assignedOfficer: true,
            },
        })
        return NextResponse.json(cases)
    } catch (error) {
        console.error("Error fetching cases:", error)
        return NextResponse.json({ error: "Failed to fetch cases" }, { status: 500 })
    }
}
