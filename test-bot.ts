import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const tariffGroups = await prisma.order.groupBy({
            by: ['tariff'],
            _count: { tariff: true },
            orderBy: { _count: { tariff: 'desc' } }
        });
        console.log(tariffGroups);
    } catch (e) { console.error('Error:', e); }
}

main();
