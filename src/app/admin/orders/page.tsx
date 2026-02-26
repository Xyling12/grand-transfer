import { PrismaClient } from "@prisma/client";
import Link from 'next/link';
import { format } from "date-fns";
import { ru } from "date-fns/locale";

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            driver: true,
            dispatcher: true
        }
    });

    const activeCount = orders.filter(o => !['COMPLETED', 'CANCELLED'].includes(o.status)).length;
    const completedCount = orders.filter(o => o.status === 'COMPLETED').length;

    const translateStatus = (status: string) => {
        switch (status) {
            case 'NEW': return <span className="text-blue-400">Новая</span>;
            case 'PROCESSING': return <span className="text-amber-400">У диспетчера</span>;
            case 'DISPATCHED': return <span className="text-purple-400">Поиск водителя</span>;
            case 'TAKEN': return <span className="text-indigo-400">У водителя</span>;
            case 'COMPLETED': return <span className="text-green-400">Выполнена</span>;
            case 'CANCELLED': return <span className="text-red-400">Отменена</span>;
            default: return status;
        }
    };

    const translateTariff = (tariff: string) => {
        switch (tariff?.toLowerCase()) {
            case 'econom': return 'Эконом';
            case 'comfort': return 'Комфорт';
            case 'minivan': return 'Минивэн';
            case 'business': return 'Бизнес';
            default: return tariff;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-jost p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header & Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bodoni text-amber-500">Доска Заказов</h1>
                        <p className="text-gray-400 mt-2">Мониторинг всех заявок и исполнителей</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/drivers" className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
                            Водители
                        </Link>
                        <Link href="/admin/clients" className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
                            Клиенты
                        </Link>
                        <Link href="/" className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
                            На сайт
                        </Link>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Всего Заказов</div>
                        <div className="text-3xl font-light text-white">{orders.length}</div>
                    </div>
                    <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6">
                        <div className="text-gray-400 text-sm mb-1">В Работе</div>
                        <div className="text-3xl font-light text-amber-500">{activeCount}</div>
                    </div>
                    <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Завершено</div>
                        <div className="text-3xl font-light text-green-400">{completedCount}</div>
                    </div>
                </div>

                {/* Orders List */}
                <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-gray-400 text-sm">
                                    <th className="p-4 font-normal">ID / Дата</th>
                                    <th className="p-4 font-normal">Маршрут / Пассажиры</th>
                                    <th className="p-4 font-normal">Клиент</th>
                                    <th className="p-4 font-normal">Исполнители</th>
                                    <th className="p-4 font-normal text-right">Статус / Цена</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            Нет данных о заказах
                                        </td>
                                    </tr>
                                ) : (
                                    orders.map((o) => (
                                        <tr key={o.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-white">#{o.id}</div>
                                                <div className="text-xs text-gray-500">{format(new Date(o.createdAt), 'dd MMM yyyy, HH:mm', { locale: ru })}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm text-gray-300">
                                                    <span className="text-amber-500 font-medium">{o.fromCity}</span> → <span className="text-amber-500 font-medium">{o.toCity}</span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-1">
                                                    {translateTariff(o.tariff)} • {o.passengers} чел.
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="text-sm font-medium text-gray-200">{o.customerName}</div>
                                                <div className="text-xs text-gray-400">{o.customerPhone}</div>
                                            </td>
                                            <td className="p-4">
                                                {o.dispatcher && (
                                                    <div className="text-xs text-gray-400">
                                                        Дисп: <span className="text-purple-300">{o.dispatcher.fullFio || o.dispatcher.firstName}</span>
                                                    </div>
                                                )}
                                                {o.driver && o.status === 'TAKEN' || o.status === 'COMPLETED' ? (
                                                    <div className="text-xs text-gray-400 mt-1">
                                                        Вод: <span className="text-indigo-300">{o.driver?.fullFio || o.driver?.firstName}</span>
                                                    </div>
                                                ) : o.status === 'DISPATCHED' ? (
                                                    <div className="text-xs text-gray-500 italic mt-1">Идет поиск водителя...</div>
                                                ) : null}
                                                {!o.dispatcher && !o.driver && (
                                                    <div className="text-xs text-gray-500 italic">Свободная заявка</div>
                                                )}
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="text-sm font-medium mb-1">
                                                    {translateStatus(o.status)}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    ~{o.priceEstimate || '0'} ₽
                                                </div>
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
