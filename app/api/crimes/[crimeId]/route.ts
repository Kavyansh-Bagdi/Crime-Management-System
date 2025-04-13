import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/script";

export async function GET(
    req: NextRequest,
    context: { params: { crimeId: string } }
) {
    try {
        const { params } = await context; // Await context.params
        const crimeId = params.crimeId;

        if (!crimeId || isNaN(Number(crimeId))) {
            return NextResponse.json({ error: "Invalid or missing crimeId" }, { status: 400 });
        }

        const parsedCrimeId = parseInt(crimeId, 10);

        const crime = await prisma.crime.findUnique({
            where: { crimeId: parsedCrimeId },
            include: {
                Evidence: true,
                victim: true,
                accused: true,
                user: true, // reported by
                administrative: true, // related user
                location: true,
                crimeLogs: { // Fixed relation name
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
            administrative: crime.administrative,
            victim: crime.victim,
            accused: crime.accused,
            Evidence: crime.Evidence,
            crimeLogs: crime.crimeLogs, // Updated response key
        });
    } catch (error) {
        console.error("Error fetching crime details:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: { crimeId: string } }
) {
    try {
        const { params } = context;
        const crimeId = parseInt(params.crimeId, 10);

        if (isNaN(crimeId)) {
            return NextResponse.json({ error: "Invalid crimeId" }, { status: 400 });
        }

        const body = await req.json();
        const { role, updates } = body;

        if (!["Admin", "Administrative"].includes(role)) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const updateData: any = {};

        if (updates.status) {
            updateData.status = updates.status;
        }

        if (updates.evidence) {
            await prisma.evidence.createMany({
                data: updates.evidence.map((e: any) => ({
                    crimeId,
                    description: e.description,
                })),
            });
        }

        if (updates.caseLog) {
            await prisma.crimeLog.create({
                data: {
                    crimeId,
                    update: updates.caseLog.message,
                    userId: updates.caseLog.userId,
                },
            });
        }

        if (Object.keys(updateData).length > 0) {
            await prisma.crime.update({
                where: { crimeId },
                data: updateData,
            });
        }

        return NextResponse.json({ message: "Crime updated successfully" });
    } catch (error) {
        console.error("Error updating crime:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
