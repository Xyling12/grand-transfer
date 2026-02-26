import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ fileId: string }> }) {
    const { fileId } = await params;

    if (!fileId) {
        return new NextResponse("File ID is required", { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
        return new NextResponse("TELEGRAM_BOT_TOKEN is not configured", { status: 500 });
    }

    try {
        // Step 1: Request file metadata from Telegram API to get the current downloadable file_path
        const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`;
        const fileRes = await fetch(getFileUrl);
        const fileData = await fileRes.json();

        if (!fileData.ok || !fileData.result.file_path) {
            console.error("Telegram API Error:", fileData);
            return new NextResponse("Failed to retrieve file metadata from Telegram", { status: 404 });
        }

        const filePath = fileData.result.file_path;

        // Step 2: Download the actual file from Telegram
        const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;
        const imageRes = await fetch(downloadUrl);

        if (!imageRes.ok) {
            return new NextResponse("Failed to download file from Telegram", { status: 502 });
        }

        // Step 3: Stream the binary data back to the client directly
        const headers = new Headers();

        // Ensure proper content type based on Telegram's extension (usually jpg)
        const ext = filePath.split('.').pop()?.toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'pdf') contentType = 'application/pdf';

        headers.set('Content-Type', contentType);
        headers.set('Cache-Control', 'public, max-age=86400'); // Cache for 1 day

        return new NextResponse(imageRes.body, {
            status: 200,
            headers,
        });

    } catch (error) {
        console.error("Error fetching Telegram file:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
