import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const telegramId = "8115648123"; // Mediko's ID from screenshot

    let driver = await prisma.driver.findUnique({
        where: { telegramId: BigInt(telegramId) }
    });

    if (!driver) {
        console.log(`Водитель с telegramId ${telegramId} не найден. Используем первого попавшегося водителя...`);
        driver = await prisma.driver.findFirst();
    }

    if (!driver) {
        console.log(`В базе данных вообще нет водителей. Пожалуйста, зарегистрируйтесь в боте сначала.`);
        return;
    }

    console.log(`Найден водитель: ${driver.firstName}. Добавляем тестовые заказы...`);

    // Add a completed order
    await prisma.order.create({
        data: {
            fromCity: "Москва",
            toCity: "Санкт-Петербург",
            tariff: "Комфорт",
            passengers: 2,
            comments: "Багаж 10 кг",
            customerName: "Иван Тестовый",
            customerPhone: "+79990001122",
            status: "COMPLETED",
            driverId: driver.id,
            priceEstimate: 12000,
            feedbackReceived: true
        }
    });

    // Add an active order
    await prisma.order.create({
        data: {
            fromCity: "Казань",
            toCity: "Нижний Новгород",
            tariff: "Бизнес",
            passengers: 1,
            comments: "Без багажа",
            customerName: "Анна Пример",
            customerPhone: "+79993334455",
            status: "TAKEN",
            driverId: driver.id,
            priceEstimate: 8500,
            feedbackReceived: false
        }
    });

    console.log(`Успешно добавлено 2 тестовых заказа для водителя ${driver.firstName}.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
