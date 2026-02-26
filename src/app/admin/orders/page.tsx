import { PrismaClient } from "@prisma/client";
import Link from 'next/link';

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
    searchParams
}: {
    searchParams: { month?: string }
}) {
    // 1. Load All Orders Server-Side
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' }
    });

    // 2. Group by month Server-Side
    const grouped: { [key: string]: any[] } = {};
    orders.forEach((o: any) => {
        const dateObj = new Date(o.createdAt);
        let monthName = dateObj.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
        monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1).replace(' г.', '').trim();
        if (!grouped[monthName]) grouped[monthName] = [];
        grouped[monthName].push(o);
    });

    const months = Object.keys(grouped);

    // Determine active tab
    const selectedMonth = searchParams.month || (months.length > 0 ? months[0] : '');
    const currentOrders = grouped[selectedMonth] || [];

    return (
        <main className="min-h-screen bg-neutral-950 text-white font-jost p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bodoni text-amber-500">Управление Заказами</h1>
                        <p className="text-gray-400 mt-2">База всех заявок на трансфер</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/clients" className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
                            Клиенты
                        </Link>
                        <Link href="/admin/drivers" className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
                            Водители
                        </Link>
                        <Link href="/" className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
                            На сайт
                        </Link>
                    </div>
                </div>

                {/* Tabs for Months (Server-side rendering via links) */}
                {months.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {months.map(m => (
                            <Link
                                key={m}
                                href={`?month=${encodeURIComponent(m)}`}
                                className={`whitespace-nowrap px-6 py-3 rounded-xl transition-all ${selectedMonth === m
                                        ? 'bg-amber-500 text-neutral-950 font-medium'
                                        : 'bg-neutral-900 border border-neutral-800 text-gray-400 hover:text-white'
                                    }`}
                            >
                                {m} ({grouped[m]?.length || 0})
                            </Link>
                        ))}
                    </div>
                )}

                {/* Data Table */}
                {currentOrders.length > 0 ? (
                    <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-neutral-800 bg-neutral-900/50 text-gray-400 text-sm">
                                        <th className="p-4 font-normal">ID / Дата</th>
                                        <th className="p-4 font-normal">Маршрут</th>
                                        <th className="p-4 font-normal">Исполнитель</th>
                                        <th className="p-4 font-normal">Сумма</th>
                                        <th className="p-4 font-normal text-right">Статус</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentOrders.map((o, i) => (
                                        <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-white">#{o.id}</div>
                                                <div className="text-sm text-gray-500">{new Date(o.createdAt).toLocaleDateString('ru-RU')}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-gray-300">{o.fromCity} <span className="text-amber-500">→</span> {o.toCity}</div>
                                                <div className="text-xs text-gray-500 mt-1">{o.customerName} ({o.customerPhone})</div>
                                            </td>
                                            <td className="p-4 text-gray-400">
                                                {o.driverId ? `Водитель ID: ${o.driverId}` : (o.dispatcherId ? `Диспетчер ID: ${o.dispatcherId}` : '—')}
                                            </td>
                                            <td className="p-4 text-amber-500 font-medium">
                                                {o.priceEstimate ? `${o.priceEstimate} ₽` : '—'}
                                            </td>
                                            <td className="p-4 text-right">
                                                <span className={`text-xs px-2 py-1 rounded-md ${o.status === 'COMPLETED' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                                        o.status === 'NEW' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                    }`}>
                                                    {o.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500">
                        {months.length > 0 ? "В этом периоде нет заказов" : "В базе нет ни одного заказа"}
                    </div>
                )}
            </div>
        </main>
    );
}
