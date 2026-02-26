"use client";

import React, { useState } from 'react';
import UserDetailModal from '@/components/admin/UserDetailModal';

export default function ClientsTableClient({ clients }: { clients: any[] }) {
    const [selectedClient, setSelectedClient] = useState<any>(null);

    return (
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
                                <tr
                                    key={i}
                                    className="border-b border-neutral-800/50 hover:bg-neutral-800/20 transition-colors cursor-pointer"
                                    onClick={() => setSelectedClient(c)}
                                >
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

            <UserDetailModal
                isOpen={!!selectedClient}
                onClose={() => setSelectedClient(null)}
                data={selectedClient}
                type="client"
                onUpdateFeedback={async (orderId, currentVal) => {
                    try {
                        const newVal = !currentVal;
                        // Fast optimistic update
                        setSelectedClient({
                            ...selectedClient,
                            orders: selectedClient.orders.map((o: any) => o.id === orderId ? { ...o, feedbackReceived: newVal } : o)
                        });

                        // Note: server API call is needed here for persistence but user requested to "add a mock UI boolean toggle or just a display badge for now"
                        // so this just changes UI state locally. 
                    } catch (e) {
                        console.error('Failed to update feedback state');
                    }
                }}
            />
        </div>
    );
}
