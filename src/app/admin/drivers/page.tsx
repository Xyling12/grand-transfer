import { prisma } from "@/lib/prisma";
import CrmDashboardClient from "./CrmDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminCrmPage() {
    // 1. Fetch all users from the Driver schema (which stores all bots interactions/roles)
    const users = await prisma.driver.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            ordersAsDriver: true,
            ordersAsDispatcher: true,
        }
    });

    // 2. Fetch all orders to build the Clients list (people who ordered)
    const orders = await prisma.order.findMany({
        orderBy: { createdAt: 'desc' }
    });

    // Aggregate Data into Clients
    const clientsMap = new Map();
    orders.forEach((o: any) => {
        if (!o.customerPhone) return;

        const key = o.customerPhone;
        if (!clientsMap.has(key)) {
            clientsMap.set(key, {
                name: o.customerName,
                phone: key,
                ordersCount: 0,
                totalSpent: 0,
                lastOrder: o.createdAt,
                orders: []
            });
        }

        const client = clientsMap.get(key);
        client.ordersCount++;
        client.orders.push(o);

        if (o.priceEstimate && o.status === 'COMPLETED') {
            client.totalSpent += o.priceEstimate;
        }

        if (new Date(o.createdAt) > new Date(client.lastOrder)) {
            client.lastOrder = o.createdAt;
        }
    });

    const clientsArray = Array.from(clientsMap.values());

    return (
        <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)', padding: '24px', position: 'relative' }}>
            {/* Background Effects */}
            <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
                <div style={{
                    position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)',
                    width: '600px', height: '600px', background: 'var(--color-primary-glow)',
                    borderRadius: '50%', filter: 'blur(100px)', mixBlendMode: 'screen'
                }}></div>
            </div>

            <div style={{ position: 'relative', zIndex: 10 }}>
                <CrmDashboardClient users={users} clientsMap={clientsArray} />
            </div>
        </div>
    );
}
