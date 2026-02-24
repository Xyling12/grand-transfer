import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const DIR = 'C:\\Users\\ivshinms\\.gemini\\antigravity\\scratch\\grand-transfer\\public\\images\\tariffs';

const images = [
    { src: 'economy-dark-new.webp', dest: 'economy-feed.webp' },
    { src: 'standard-dark-new.webp', dest: 'standard-feed.webp' },
    { src: 'comfort-new.webp', dest: 'comfort-feed.webp' },
    { src: 'minivan-v2.webp', dest: 'minivan-feed.webp' },
    { src: 'business-3d.webp', dest: 'business-feed.webp' },
    { src: 'sober-3d.webp', dest: 'sober-feed.webp' },
    { src: 'delivery-3d.webp', dest: 'delivery-feed.webp' }
];

async function processImages() {
    for (const img of images) {
        const inputPath = path.join(DIR, img.src);
        const outputPath = path.join(DIR, img.dest);

        try {
            const metadata = await sharp(inputPath).metadata();

            // Generate a 141414 (dark grey/black) background matching the site's dark theme
            // By compositing the image over it, any transparent pixels will become dark
            await sharp({
                create: {
                    width: metadata.width,
                    height: metadata.height,
                    channels: 4,
                    background: { r: 12, g: 12, b: 12, alpha: 1 } // very dark grey, almost black
                }
            })
                .composite([{ input: inputPath }])
                .webp({ quality: 90 })
                .toFile(outputPath);

            console.log(`Processed ${img.src} -> ${img.dest}`);
        } catch (e) {
            console.error(`Failed to process ${img.src}:`, e.message);
        }
    }
}

processImages();
