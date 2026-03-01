// Create test dispatcher and driver accounts
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}

async function createOrUpdate(phone, fullFio, firstName, role, telegramId) {
    const passwordHash = hashPassword('123456');
    const existing = await prisma.driver.findFirst({ where: { phone } });

    if (existing) {
        await prisma.driver.update({
            where: { id: existing.id },
            data: { role, status: 'APPROVED', passwordHash, fullFio, firstName },
        });
        console.log(`🔄 Обновлён: ${fullFio} (${phone}) — роль: ${role}`);
    } else {
        await prisma.driver.create({
            data: { phone, fullFio, firstName, role, status: 'APPROVED', passwordHash, telegramId: BigInt(telegramId) },
        });
        console.log(`✅ Создан: ${fullFio} (${phone}) — роль: ${role}`);
    }
}

async function main() {
    await createOrUpdate('+79995550001', 'Диспетчер Тест', 'Диспетчер', 'DISPATCHER', '9900000001');
    await createOrUpdate('+79995550002', 'Водитель Тест', 'Водитель', 'DRIVER', '9900000002');

    console.log('\n📱 Данные для входа:');
    console.log('Диспетчер: +79995550001 / 123456');
    console.log('Водитель:  +79995550002 / 123456');
}

main().catch(console.error).finally(() => prisma.$disconnect());
