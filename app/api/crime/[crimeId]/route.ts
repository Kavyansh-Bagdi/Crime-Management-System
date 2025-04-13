import { NextResponse } from "next/server";
import prisma from "@/prisma/script";

export async function GET(request: Request, { params }: { params: { crimeId: string } }) {
    try {
        const { crimeId } = params;
        const crime = await prisma.crime.findUnique({
            where: { crimeId: parseInt(crimeId) },
            include: {
                evidence: true,
                victim: true,
                accused: true,
                administrative: {
                    include: {
                        user: true,
                    },
                },
                reportedBy: true,
            },
        });

        if (!crime) {
            return NextResponse.json({ error: "Crime not found" }, { status: 404 });
        }

        return NextResponse.json(crime);
    } catch (error) {
        console.error("Error fetching crime details:", error);
        return NextResponse.json({ error: "Failed to fetch crime details" }, { status: 500 });
    }
}
