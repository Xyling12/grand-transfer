import { PrismaClient } from "@prisma/client";
import Link from 'next/link';
import ClientsTableClient from './ClientsTableClient';

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
                lastOrder: o.createdAt.toISOString(),
                orders: [] // specific orders for this client
            });
        }

        const client = clientsMap.get(key);
        client.ordersCount++;
        client.orders.push({
            id: o.id,
            createdAt: o.createdAt.toISOString(),
            fromCity: o.fromCity,
            toCity: o.toCity,
            priceEstimate: o.priceEstimate,
            status: o.status,
            feedbackReceived: (o as any).feedbackReceived
        });

        if (o.priceEstimate && o.status === 'COMPLETED') {
            client.totalSpent += o.priceEstimate;
            totalClientRevenue += o.priceEstimate;
        }

        if (new Date(o.createdAt) > new Date(client.lastOrder)) {
            client.lastOrder = o.createdAt.toISOString();
        }
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
                            На главную
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
                <ClientsTableClient clients={clients} />

            </div>
        </div>
    );
}
