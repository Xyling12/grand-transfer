import { PrismaClient } from "@prisma/client";
import Link from 'next/link';

const prisma = new PrismaClient();

export const dynamic = "force-dynamic";

export default async function AdminDriversPage() {
    const drivers = await prisma.driver.findMany({
        orderBy: { createdAt: 'desc' }
    });

    const pendingDrivers = drivers.filter((d: any) => d.status === 'PENDING').length;
    const activeDrivers = drivers.filter((d: any) => d.status === 'APPROVED' && d.role === 'DRIVER').length;

    return (
        <div className="min-h-screen bg-neutral-950 text-white font-jost p-6">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header & Navigation */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bodoni text-amber-500">База Водителей</h1>
                        <p className="text-gray-400 mt-2">Реестр всех зарегистрированных исполнителей</p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/admin/clients" className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
                            Окно Клиентов
                        </Link>
                        <Link href="/" className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition-colors">
                            На сайт
                        </Link>
                    </div>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Всего пользователей (С админами)</div>
                        <div className="text-3xl font-light text-white">{drivers.length}</div>
                    </div>
                    <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Активных Водителей</div>
                        <div className="text-3xl font-light text-amber-500">{activeDrivers}</div>
                    </div>
                    <div className="bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-2xl p-6">
                        <div className="text-gray-400 text-sm mb-1">Ожидают проверки</div>
                        <div className="text-3xl font-light text-red-400">{pendingDrivers}</div>
                    </div>
                </div>

                {/* Drivers List */}
                <div className="bg-neutral-900/30 border border-neutral-800 rounded-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-gray-400 text-sm">
                                    <th className="p-4 font-normal">Пользователь (ФИО)</th>
                                    <th className="p-4 font-normal">Телефон</th>
                                    <th className="p-4 font-normal">Роль / Статус</th>
                                    <th className="p-4 font-normal text-right">Файлы (ПТС, СТС, Права, Авто)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {drivers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-gray-500">
                                            Нет данных о водителях
                                        </td>
                                    </tr>
                                ) : (
                                    drivers.map((d: any, i: number) => (
                                        <tr key={i} className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors">
                                            <td className="p-4">
                                                <div className="font-medium text-white">{d.fullFio || d.firstName || "Без имени"}</div>
                                                <div className="text-sm text-gray-500">{d.username ? `@${d.username}` : `ID: ${d.telegramId}`}</div>
                                            </td>
                                            <td className="p-4 text-gray-300">{d.phone || '—'}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className={`text-xs px-2 py-1 rounded-md ${d.role === 'ADMIN' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : d.role === 'DISPATCHER' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-neutral-800 text-gray-300 border border-neutral-700'}`}>
                                                        {d.role}
                                                    </span>
                                                    <span className={`text-xs px-2 py-1 rounded-md ${d.status === 'APPROVED' ? 'text-green-400' : d.status === 'PENDING' ? 'text-yellow-400' : 'text-red-400'}`}>
                                                        {d.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    {d.ptsNumber ? (
                                                        <a href={`/api/tg-file/${d.ptsNumber}`} target="_blank" rel="noopener noreferrer" title={`ПТС (File ID: ${d.ptsNumber})`} className="p-2 bg-neutral-800 rounded-lg outline-none hover:bg-neutral-700 text-gray-400 hover:text-white transition-colors cursor-pointer">
                                                            📄
                                                        </a>
                                                    ) : <span className="p-2 text-neutral-700">📄</span>}

                                                    {d.stsPhotoId ? (
                                                        <a href={`/api/tg-file/${d.stsPhotoId}`} target="_blank" rel="noopener noreferrer" title={`СТС (File ID: ${d.stsPhotoId})`} className="p-2 bg-neutral-800 rounded-lg outline-none hover:bg-neutral-700 text-gray-400 hover:text-white transition-colors cursor-pointer">
                                                            🪪
                                                        </a>
                                                    ) : <span className="p-2 text-neutral-700">🪪</span>}

                                                    {d.licensePhotoId ? (
                                                        <a href={`/api/tg-file/${d.licensePhotoId}`} target="_blank" rel="noopener noreferrer" title={`Водительские права (File ID: ${d.licensePhotoId})`} className="p-2 bg-neutral-800 rounded-lg outline-none hover:bg-neutral-700 text-gray-400 hover:text-white transition-colors cursor-pointer">
                                                            🎫
                                                        </a>
                                                    ) : <span className="p-2 text-neutral-700">🎫</span>}

                                                    {d.carPhotoId ? (
                                                        <a href={`/api/tg-file/${d.carPhotoId}`} target="_blank" rel="noopener noreferrer" title={`Авто с ГРЗ (File ID: ${d.carPhotoId})`} className="p-2 bg-neutral-800 rounded-lg outline-none hover:bg-neutral-700 text-gray-400 hover:text-white transition-colors cursor-pointer">
                                                            🚙
                                                        </a>
                                                    ) : <span className="p-2 text-neutral-700">🚙</span>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 text-xs text-gray-500 bg-neutral-900/50 border-t border-neutral-800">
                        Файлы сохраняются в Telegram. При нажатии на иконку они автоматически скачиваются и открываются в новой вкладке.
                    </div>
                </div>

            </div>
        </div>
    );
}
