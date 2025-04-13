import { NextResponse } from 'next/server';
import prisma from '@/prisma/script';
import { hash } from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const {
            firstName,
            lastName,
            dob,
            location,
            phoneNumber,
            email,
            password,
        } = data;


        const existing = await prisma.user.findUnique({
            where: { email },
        });

        if (existing) {
            return NextResponse.json(
                { message: 'User with this email already exists.' },
                { status: 409 }
            );
        }
        const hashedPassword = await hash(password, 10);


        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                dob: dob ? new Date(dob) : undefined,
                location,
                phoneNumber,
                email,
                password: hashedPassword,
                role: 'Civilian',
            },
        });

        return NextResponse.json(
            { message: 'User created successfully', user },
            { status: 201 }
        );
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json(
            { message: 'Something went wrong' },
            { status: 500 }
        );
    }
}
