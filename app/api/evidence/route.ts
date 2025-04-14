import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/script";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const crimeId = parseInt(searchParams.get("crimeId") || "", 10);

    if (isNaN(crimeId)) {
        return NextResponse.json({ error: "Invalid or missing crimeId" }, { status: 400 });
    }

    try {
        const evidence = await prisma.evidence.findMany({
            where: { crimeId },
            select: {
                evidenceId: true,
                title: true,
                description: true,
                img: true,
                mime: true,
                filename: true,
                submitedBy: true, // Updated field
                User: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        return NextResponse.json(
            evidence.map((ev) => ({
                ...ev,
                img: ev.img ? Buffer.from(ev.img).toString("base64") : null, // Convert Buffer to base64
                submitedByName: ev.User ? `${ev.User.firstName} ${ev.User.lastName}`.trim() : "Unknown User", // Combine firstName and lastName
            }))
        );
    } catch (error) {
        console.error("Error fetching evidence:", error);
        return NextResponse.json({ error: "Failed to fetch evidence" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { crimeId, evidenceUpdates, deleteEvidenceIds = [] } = body;

    if (!crimeId || !Array.isArray(evidenceUpdates)) {
        return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    try {
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
                            description: ev.description,
                            img: ev.img ? Buffer.from(ev.img.split(",")[1], "base64") : undefined, // Decode base64
                            mime: ev.mime || undefined, // Ensure mime is updated only if provided
                            filename: ev.filename || undefined, // Ensure filename is updated only if provided
                            submitedBy: ev.submitedBy || undefined, // Updated field
                        },
                    })
                    : prisma.evidence.create({
                        data: {
                            crimeId,
                            description: ev.description,
                            img: ev.img ? Buffer.from(ev.img.split(",")[1], "base64") : undefined, // Decode base64
                            mime: ev.mime,
                            filename: ev.filename,
                            submitedBy: ev.submitedBy, // Updated field
                        },
                    })
            )
        );

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error updating evidence:", error);
        return NextResponse.json({ error: "Failed to update evidence" }, { status: 500 });
    }
}
