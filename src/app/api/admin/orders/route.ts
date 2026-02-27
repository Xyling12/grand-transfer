import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const orders = await prisma.order.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(orders);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
    }
}
