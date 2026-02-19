const fs = require('fs');
const https = require('https');
const path = require('path');

// Configuration
const CITIES_FILE = path.join(__dirname, '../src/data/cities.ts');
const IMAGES_DIR = path.join(__dirname, '../public/images/cities');

// Ensure directory exists
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}

// Read cities.ts to find IDs
const content = fs.readFileSync(CITIES_FILE, 'utf-8');
const idMatches = [...content.matchAll(/id:\s*['"]([^'"]+)['"]/g)];
const ids = idMatches.map(m => m[1]);

console.log(`Found ${ids.length} cities.`);

// Download function with redirect support
const downloadImage = (id) => {
    return new Promise((resolve, reject) => {
        const destPath = path.join(IMAGES_DIR, `${id}.jpg`);

        // Skip if already exists and size > 0
        if (fs.existsSync(destPath)) {
            const stats = fs.statSync(destPath);
            if (stats.size > 0) {
                // console.log(`Skipping ${id} (exists)`);
                resolve(false);
                return;
            }
        }

        const url = `https://loremflickr.com/1280/720/${id},city/all`;

        const handleResponse = (response) => {
            // Handle Redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                // console.log(`Redirecting ${id}...`);
                const redirectUrl = new URL(response.headers.location, url).toString();
                https.get(redirectUrl, handleResponse).on('error', (err) => {
                    console.error(`Error redirecting ${id}: ${err.message}`);
                    reject(err);
                });
                return;
            }

            if (response.statusCode !== 200) {
                console.error(`Failed to download ${id}: ${response.statusCode}`);
                // Create a placeholder if failed? No, improved logic should work.
                // Or maybe create a fallback 1x1 pixel or copy a default?
                // For now, just reject.
                response.resume(); // consume data
                reject(new Error(`Status ${response.statusCode}`));
                return;
            }

            const file = fs.createWriteStream(destPath);
            response.pipe(file);

            file.on('finish', () => {
                file.close(() => {
                    console.log(`Downloaded ${id}`);
                    resolve(true);
                });
            });
            file.on('error', (err) => {
                fs.unlink(destPath, () => { });
                reject(err);
            });
        };

        https.get(url, handleResponse).on('error', (err) => {
            console.error(`Error downloading ${id}: ${err.message}`);
            reject(err);
        });
    });
};

// Main loop with delay to verify behavior
const main = async () => {
    let downloadedCount = 0;
    for (const id of ids) {
        try {
            const downloaded = await downloadImage(id);
            if (downloaded) downloadedCount++;
            // Small delay to be nice to the server (optional, but good practice)
            // await new Promise(r => setTimeout(r, 100)); 
        } catch (e) {
            console.error(`Failed to process ${id}`);
        }
    }
    console.log(`Done! Downloaded ${downloadedCount} new images.`);
};

main();
