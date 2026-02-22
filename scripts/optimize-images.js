const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, '../public/images');

const convertToWebp = async (dir) => {
    try {
        const files = await fs.promises.readdir(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = await fs.promises.stat(filePath);

            if (stat.isDirectory()) {
                await convertToWebp(filePath); // Recurse
            } else if (file.match(/\.(jpg|jpeg|png)$/i)) {
                const ext = path.extname(file);
                const webpPath = filePath.replace(ext, '.webp');

                console.log(`Converting ${filePath} -> ${webpPath}`);
                await sharp(filePath)
                    .webp({ quality: 80 })
                    .toFile(webpPath);

                // Optionally remove the old file:
                await fs.promises.unlink(filePath);
            }
        }
    } catch (err) {
        console.error('Error processing directory', err);
    }
};

convertToWebp(directoryPath).then(() => console.log('✅ Conversion finished!'));
