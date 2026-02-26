import { PrismaClient } from "@prisma/client";
import Link from 'next/link';

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
    // 1. Fetch Orders
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' }
    });

    // 2. Aggregate Data into Clients
    const clientsMap = new Map();
    let totalClientRevenue = 0;

    orders.forEach((o) => {
        if (!o.customerPhone) return;

        const key = o.customerPhone;
        if (!clientsMap.has(key)) {
            clientsMap.set(key, {
                name: o.customerName,
                phone: key,
                ordersCount: 0,
                totalSpent: 0,
                lastOrder: o.createdAt,
                months: new Set<string>() // Keep track of months they ordered in
            });
        }

        const client = clientsMap.get(key);
        client.ordersCount++;

        if (o.priceEstimate && o.status === 'COMPLETED') {
            client.totalSpent += o.priceEstimate;
            totalClientRevenue += o.priceEstimate;
        }

        if (new Date(o.createdAt) > new Date(client.lastOrder)) {
            client.lastOrder = o.createdAt;
        }

        const dateObj = new Date(o.createdAt);
        let monthName = dateObj.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
        monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1).replace(' г.', '').trim();
        client.months.add(monthName);
    });

    const clients = Array.from(clientsMap.values());

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-jost p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header & Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bodoni text-amber-500">База Клиентов</h1>
                        <p className="text-gray-400 mt-2">Аналитика по заказчикам Grand Transfer</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/drivers" className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
                            Водители
                        </Link>
                        <Link href="/" className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
                            На сайт
                        </Link>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Всего уникальных клиентов</div>
                        <div className="text-3xl font-light text-white">{clients.length}</div>
                    </div>
                    <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Выручка со всех клиентов</div>
                        <div className="text-3xl font-light text-amber-500">{totalClientRevenue} ₽</div>
                    </div>
                </div>

                {/* Client List (Client-side interactive part) */}
                <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-gray-400 text-sm">
                                    <th className="p-4 font-normal">Имя</th>
                                    <th className="p-4 font-normal">Телефон</th>
                                    <th className="p-4 font-normal text-center">Кол-во поездок</th>
                                    <th className="p-4 font-normal text-center">Сумма поездок</th>
                                    <th className="p-4 font-normal text-right">Последний заказ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            Нет данных о клиентах
                                        </td>
                                    </tr>
                                ) : (
                                    clients.map((c, i) => (
                                        <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-white">{c.name}</div>
                                            </td>
                                            <td className="p-4 text-gray-300">{c.phone}</td>
                                            <td className="p-4 text-center">
                                                <span className="inline-flex items-center justify-center bg-neutral-800 w-8 h-8 rounded-full text-sm">
                                                    {c.ordersCount}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center text-amber-500 font-medium">
                                                {c.totalSpent > 0 ? c.totalSpent + " ₽" : "-"}
                                            </td>
                                            <td className="p-4 text-right text-sm text-gray-400">
                                                {new Date(c.lastOrder).toLocaleDateString("ru-RU")}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
