"use client";

import { useState, useEffect } from 'react';

export default function AdminOrdersPage() {
    const [ordersByMonth, setOrdersByMonth] = useState<{ [key: string]: any[] }>({});
    const [months, setMonths] = useState<string[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [pin, setPin] = useState('');

    const ADMIN_PIN = "7878";

    useEffect(() => {
        if (isAuthenticated) {
            loadOrders();
        }
    }, [isAuthenticated]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === ADMIN_PIN) {
            setIsAuthenticated(true);
        } else {
            alert('Неверный PIN');
        }
    };

    const loadOrders = async () => {
        setLoading(true);
        try {
            // As we don't have a direct API for orders yet in this file, we will make a fetch request.
            // Assumption: we need an API route for this. I will build it next.
            const res = await fetch('/api/admin/orders');
            if (res.ok) {
                const data = await res.json();

                // Group by month
                const grouped: { [key: string]: any[] } = {};
                data.forEach((o: any) => {
                    const dateObj = new Date(o.createdAt);
                    let monthName = dateObj.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
                    monthName = monthName.charAt(0).toUpperCase() + monthName.slice(1).replace(' г.', '').trim();
                    if (!grouped[monthName]) grouped[monthName] = [];
                    grouped[monthName].push(o);
                });

                setOrdersByMonth(grouped);
                const monthKeys = Object.keys(grouped);
                setMonths(monthKeys);
                if (monthKeys.length > 0) {
                    setSelectedMonth(monthKeys[0]);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-neutral-950 font-jost p-4">
                <form onSubmit={handleLogin} className="bg-neutral-900 p-10 rounded-2xl border border-neutral-800 text-center w-full max-w-sm">
                    <h1 className="text-white mb-6 text-2xl font-bodoni">Доступ к базе</h1>
                    <input
                        type="password"
                        placeholder="Введите PIN..."
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        className="w-full p-4 bg-white/5 border border-white/20 rounded-xl outline-none text-white text-center text-lg mb-6 focus:border-amber-500 transition-colors"
                        autoFocus
                    />
                    <button type="submit" className="w-full py-4 bg-amber-500 text-neutral-950 font-medium rounded-xl hover:bg-amber-400 transition-colors">
                        Войти
                    </button>
                </form>
            </main>
        );
    }

    const currentOrders = ordersByMonth[selectedMonth] || [];

    return (
        <main className="min-h-screen bg-neutral-950 text-white font-jost p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bodoni text-amber-500">Управление Заказами</h1>
                        <p className="text-gray-400 mt-2">База всех заявок на трансфер</p>
                    </div>
                    <div className="flex gap-2">
                        <a href="/admin/clients" className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
                            Клиенты
                        </a>
                        <a href="/admin/drivers" className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
                            Водители
                        </a>
                        <button onClick={loadOrders} className="px-4 py-2 bg-amber-500 text-neutral-950 font-medium rounded-lg hover:bg-amber-400 transition-colors">
                            Обновить
                        </button>
                    </div>
                </div>

                {/* Tabs for Months */}
                {months.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {months.map(m => (
                            <button
                                key={m}
                                onClick={() => setSelectedMonth(m)}
                                className={`whitespace-nowrap px-6 py-3 rounded-xl border transition-all ${selectedMonth === m
                                        ? 'bg-amber-500 text-neutral-950 font-medium border-amber-500'
                                        : 'bg-neutral-900 border-neutral-800 text-gray-400 hover:text-white'
                                    }`}
                            >
                                {m} ({ordersByMonth[m]?.length || 0})
                            </button>
                        ))}
                    </div>
                )}

                {loading && <p className="text-amber-500 text-center py-10">Загрузка данных...</p>}

                {!loading && currentOrders.length > 0 && (
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
                )}

                {!loading && currentOrders.length === 0 && (
                    <div className="text-center py-20 text-gray-500">
                        В этом периоде нет заказов
                    </div>
                )}
            </div>
        </main>
    );
}
