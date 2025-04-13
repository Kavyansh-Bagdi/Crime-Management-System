const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
    // Delete all existing data
    await prisma.evidence.deleteMany({});
    await prisma.crime.deleteMany({});
    await prisma.administrative.deleteMany({});
    await prisma.admin.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.location.deleteMany({});
    console.log('All existing data deleted.');

    // Generate Users
    const users = [];
    const admins = [];
    const administratives = [];
    let badgeNumber = 1;

    // Generate Admins
    for (let i = 0; i < 10; i++) {
        const user = await prisma.user.create({
            data: {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                dob: faker.date.past(30, new Date('2000-01-01')),
                location: faker.location.city(),
                phoneNumber: faker.phone.number(),
                email: faker.internet.email(),
                password: '$2b$10$KAHKQ/A09ydJcsCDQ3gQE.cH/teP.WUoWSIUONpKSTQhuhkIekFcW',
                role: 'Admin',
                admin: { create: {} },
            },
        });
        users.push(user);
        admins.push(user);
    }

    // Generate Administrative Users
    for (let i = 0; i < 20; i++) {
        const user = await prisma.user.create({
            data: {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                dob: faker.date.past(30, new Date('2000-01-01')),
                location: faker.location.city(),
                phoneNumber: faker.phone.number(),
                email: faker.internet.email(),
                password: '$2b$10$KAHKQ/A09ydJcsCDQ3gQE.cH/teP.WUoWSIUONpKSTQhuhkIekFcW',
                role: 'Administrative',
                administrative: {
                    create: {
                        designation: faker.helpers.arrayElement([
                            'Officer',
                            'Detective',
                            'Sergeant',
                            'Lieutenant',
                            'Captain',
                            'Major',
                            'DeputyChief',
                            'Chief',
                            'Commissioner',
                            'Sheriff',
                        ]),
                        department: faker.helpers.arrayElement([
                            'Homicide',
                            'Narcotics',
                            'CyberCrime',
                            'Traffic',
                            'Forensics',
                            'InternalAffairs',
                            'K9Unit',
                            'SWAT',
                            'Vice',
                            'Patrol',
                            'Intelligence',
                        ]),
                    },
                },
            },
        });
        users.push(user);
        administratives.push(user);
    }

    // Generate Civilian Users
    for (let i = 0; i < 30; i++) {
        const user = await prisma.user.create({
            data: {
                firstName: faker.person.firstName(),
                lastName: faker.person.lastName(),
                dob: faker.date.past(50, new Date('2000-01-01')),
                location: faker.location.city(),
                phoneNumber: faker.phone.number(),
                email: faker.internet.email(),
                password: '$2b$10$KAHKQ/A09ydJcsCDQ3gQE.cH/teP.WUoWSIUONpKSTQhuhkIekFcW',
                role: 'Civilian',
            },
        });
        users.push(user);
    }

    // Generate Crimes
    for (let i = 0; i < 50; i++) {
        const crime = await prisma.crime.create({
            data: {
                crimeType: faker.helpers.arrayElement(['Theft', 'Assault', 'Cybercrime', 'Drug Trafficking', 'Fraud']),
                title: faker.lorem.sentence(),
                description: faker.lorem.paragraph(),
                dateOccurred: faker.date.past(5),
                location: {
                    create: {
                        city: faker.location.city(),
                        state: faker.location.state(),
                        country: faker.location.country(),
                    },
                },
                status: faker.helpers.arrayElement(['Accepted', 'Rejected', 'Reported', 'Investigation', 'Closed', 'Pending']),
                user: { connect: { userId: faker.helpers.arrayElement(users).userId } },
                administrative: { connect: { userId: faker.helpers.arrayElement(administratives).userId } },
                accused: { connect: [{ userId: faker.helpers.arrayElement(users).userId }] },
                victim: { connect: [{ userId: faker.helpers.arrayElement(users).userId }] },
            },
        });

        // Add Evidence
        await prisma.evidence.create({
            data: {
                crimeId: crime.crimeId,
                evidenceType: faker.word.noun(),
                description: faker.lorem.sentence(),
                submittedBy: faker.helpers.arrayElement(users).userId,
            },
        });

        // Add Crime Logs
        await prisma.crimeLog.createMany({
            data: [
                {
                    crimeId: crime.crimeId,
                    userId: faker.helpers.arrayElement(users).userId,
                    update: 'Initial report created.',
                },
                {
                    crimeId: crime.crimeId,
                    userId: faker.helpers.arrayElement(users).userId,
                    update: 'Investigation started.',
                },
            ],
        });
    }

    console.log('Data generation complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });