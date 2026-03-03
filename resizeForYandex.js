const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'public', 'images', 'tariffs');
const outputDir = path.join(__dirname, 'public', 'images', 'yandex-ads');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const files = fs.readdirSync(inputDir).filter(f => f.includes('-feed'));

async function processImages() {
    for (const file of files) {
        const inputPath = path.join(inputDir, file);
        // Yandex accepts JPG, PNG. Let's save as JPG with a dark background to match the site's dark theme
        const parsed = path.parse(file);
        const outputPath = path.join(outputDir, `${parsed.name}-yandex.jpg`);

        try {
            await sharp(inputPath)
                .resize(800, 800, {
                    fit: 'contain',
                    background: { r: 15, g: 15, b: 15, alpha: 1 } // very dark gray (close to #0f0f0f)
                })
                .jpeg({ quality: 90 })
                .toFile(outputPath);

            console.log(`✅ Processed: ${file} -> ${outputPath}`);
        } catch (err) {
            console.error(`❌ Failed to process ${file}:`, err);
        }
    }
}

processImages();
