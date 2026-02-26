"use client";

import React from 'react';

type UserDetailModalProps = {
    isOpen: boolean;
    onClose: () => void;
    data: any; // User (Driver/Dispatcher) or Client
    type: 'driver' | 'dispatcher' | 'client';
    onUpdateFeedback?: (orderId: number, currentVal: boolean) => void;
};

export default function UserDetailModal({ isOpen, onClose, data, type, onUpdateFeedback }: UserDetailModalProps) {
    if (!isOpen || !data) return null;

    const renderDocs = () => {
        if (type !== 'driver') return null;

        const docs = [
            { type: 'ptsNumber', icon: '📄', title: 'ПТС', id: data.ptsNumber },
            { type: 'stsPhotoId', icon: '🪪', title: 'СТС', id: data.stsPhotoId },
            { type: 'licensePhotoId', icon: '🎫', title: 'Права', id: data.licensePhotoId },
            { type: 'carPhotoId', icon: '🚙', title: 'Авто', id: data.carPhotoId }
        ];

        return (
            <div className="flex flex-wrap gap-2 mt-4">
                {docs.map((doc, idx) => {
                    if (doc.id) {
                        const isText = doc.type === 'ptsNumber' && !doc.id.startsWith('AgAC') && doc.id.length < 50;
                        return (
                            <a key={idx} href={isText ? undefined : `/api/tg-file/${doc.id}`} target="_blank" rel="noopener noreferrer"
                                title={`${doc.title} (${doc.id})`}
                                className="w-10 h-10 rounded-lg bg-black/40 border border-amber-500/50 flex items-center justify-center text-xl hover:bg-amber-500/20 hover:scale-105 transition-all shadow-[0_0_10px_rgba(202,138,4,0.1)]"
                                onClick={(e) => {
                                    if (isText) {
                                        e.preventDefault();
                                        alert(`Номер ПТС: ${doc.id}`);
                                    }
                                }}
                            >
                                {doc.icon}
                            </a>
                        );
                    }
                    return (
                        <div key={idx} title={`Нет ${doc.title}`} className="w-10 h-10 rounded-lg bg-white/5 border border-dashed border-white/10 flex items-center justify-center opacity-30 grayscale">
                            {doc.icon}
                        </div>
                    );
                })}
            </div>
        );
    };

    const orders = type === 'driver' ? data.ordersAsDriver : (type === 'dispatcher' ? data.ordersAsDispatcher : data.orders);
    const activeStatuses = type === 'driver' ? ['TAKEN'] : (type === 'dispatcher' ? ['DISPATCHED', 'PROCESSING'] : ['NEW', 'DISPATCHED', 'PROCESSING', 'TAKEN']);

    // Sort orders: active first, then by date descending
    const sortedOrders = [...(orders || [])].sort((a: any, b: any) => {
        const aActive = activeStatuses.includes(a.status);
        const bActive = activeStatuses.includes(b.status);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const activeOrder = sortedOrders.find((o: any) => activeStatuses.includes(o.status));
    const completedOrders = sortedOrders.filter((o: any) => o.status === 'COMPLETED');

    const renderOrders = () => {
        if (!sortedOrders || sortedOrders.length === 0) {
            return <div className="text-gray-500 italic mt-4">Нет истории заказов</div>;
        }

        return (
            <div className="mt-6 space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                <h3 className="text-lg font-semibold text-amber-500 mb-4 sticky top-0 bg-[#121212]/90 backdrop-blur-md py-2 z-10 border-b border-white/10">
                    История заказов ({sortedOrders.length})
                </h3>
                {sortedOrders.map((o: any) => {
                    const isActive = activeStatuses.includes(o.status);
                    const mapLink = `https://yandex.ru/maps/?mode=routes&rtt=auto&rtext=${encodeURIComponent(o.fromCity)}~${encodeURIComponent(o.toCity)}`;

                    return (
                        <div key={o.id} className={`p-4 rounded-xl border ${isActive ? 'border-amber-500/50 bg-amber-500/10' : 'border-white/10 bg-white/5'} transition-colors`}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-medium text-white">Заказ #{o.id}</h4>
                                    {isActive && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-black uppercase tracking-wider">Текущий</span>}
                                </div>
                                <span className={`text-xs px-2 py-1 rounded-full ${o.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                    {o.status}
                                </span>
                            </div>

                            <div className="text-sm text-gray-300 mb-2">
                                {new Date(o.createdAt).toLocaleDateString('ru-RU')} • <a href={mapLink} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 underline underline-offset-2 transition-colors">{o.fromCity} &rarr; {o.toCity}</a>
                            </div>

                            <div className="flex justify-between items-end mt-3 text-sm">
                                <div className="text-gray-400">
                                    {o.priceEstimate ? `${o.priceEstimate} ₽` : 'Цена не указана'}
                                </div>

                                {type === 'client' && o.status === 'COMPLETED' && (
                                    <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                        <span className="text-xs text-gray-400">ОС собрана:</span>
                                        <button
                                            onClick={() => onUpdateFeedback && onUpdateFeedback(o.id, !!o.feedbackReceived)}
                                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 ${o.feedbackReceived ? 'border-green-500 bg-green-500/20' : 'border-gray-600 bg-gray-800'} transition-all`}
                                        >
                                            <span className="sr-only">Feedback receive toggle</span>
                                            <span className={`pointer-events-none block h-3 w-3 rounded-full shadow-lg ring-0 transition-all ${o.feedbackReceived ? 'translate-x-2 bg-green-500' : '-translate-x-2 bg-gray-400'}`} />
                                        </button>
                                    </div>
                                )}

                                {(type === 'driver' || type === 'dispatcher') && (
                                    <a href={`/admin/orders`} className="text-amber-500/80 hover:text-amber-400 text-xs transition-colors flex items-center gap-1">
                                        В доску заказов &rarr;
                                    </a>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header Profile Area */}
                <div className="p-6 border-b border-white/10 flex items-start justify-between bg-gradient-to-r from-amber-500/5 to-transparent">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-2xl font-bold text-black shadow-lg shadow-amber-500/20">
                            {data.firstName?.charAt(0) || data.name?.charAt(0) || '?'}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bodoni text-white">{data.fullFio || data.firstName || data.name || "Без имени"}</h2>
                            <div className="text-gray-400 text-sm mt-1 flex items-center gap-3">
                                <span className="flex items-center gap-1">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                                    {data.phone || 'Нет телефона'}
                                </span>
                                {data.username && (
                                    <span className="flex items-center gap-1 text-blue-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path></svg>
                                        @{data.username}
                                    </span>
                                )}
                            </div>

                            <div className="mt-3 flex gap-2">
                                <span className="text-[10px] px-2 py-1 rounded bg-white/10 text-gray-300 uppercase font-semibold tracking-wider">
                                    {type === 'driver' ? 'Водитель' : type === 'dispatcher' ? 'Диспетчер' : 'Клиент'}
                                </span>
                                {type !== 'client' && (
                                    <span className={`text-[10px] px-2 py-1 rounded uppercase font-semibold tracking-wider ${data.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : data.status === 'PENDING' ? 'bg-amber-500/20 text-amber-500' : 'bg-red-500/20 text-red-400'}`}>
                                        {data.status}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full p-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-6">

                    {/* Stats Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1">Всего заказов</div>
                            <div className="text-xl font-semibold text-white">{sortedOrders.length}</div>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-xl p-3">
                            <div className="text-xs text-gray-500 mb-1">Завершено</div>
                            <div className="text-xl font-semibold text-green-400">{completedOrders.length}</div>
                        </div>
                        {type === 'client' && (
                            <div className="bg-white/5 border border-white/5 rounded-xl p-3 col-span-2">
                                <div className="text-xs text-gray-500 mb-1">Сумма всех поездок</div>
                                <div className="text-xl font-semibold text-amber-500">{data.totalSpent || 0} ₽</div>
                            </div>
                        )}
                        {type !== 'client' && (
                            <div className="bg-white/5 border border-white/5 rounded-xl p-3 col-span-2">
                                <div className="text-xs text-gray-500 mb-1">Регистрация</div>
                                <div className="text-sm font-medium text-gray-300 mt-1">{new Date(data.createdAt).toLocaleDateString('ru-RU')}</div>
                            </div>
                        )}
                    </div>

                    {renderDocs()}
                    {renderOrders()}
                </div>
            </div>

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(245, 158, 11, 0.5);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(245, 158, 11, 0.8);
                }
            `}</style>
        </div>
    );
}
