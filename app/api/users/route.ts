import { NextResponse } from "next/server"
import prisma from "@/prisma/script"

export async function GET(request: Request) {
    const url = new URL(request.url)
    const query = url.searchParams.get('query') || ''

    try {
        const users = await prisma.user.findMany({
            where: {
                OR: [
                    {
                        firstName: {
                            contains: query,
                        },
                    },
                    {
                        lastName: {
                            contains: query,
                        },
                    },
                    {
                        email: {
                            contains: query,
                        },
                    },
                ],
            },
            select: {
                userId: true,
                firstName: true,
                lastName: true,
                email: true,
                phoneNumber: true,
            },
        })

        return NextResponse.json(users)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }
}
