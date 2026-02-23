import { cities } from '../src/data/cities';
import fs from 'fs';
import path from 'path';

const baseUrl = 'https://межгород.com';

const generateSitemapIndex = () => {
    const sitemaps = [{ id: 'index' }];
    cities.forEach(city => {
        sitemaps.push({ id: city.id });
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${baseUrl}/sitemap/${sitemap.id}.xml</loc>
  </sitemap>`).join('\n')}
</sitemapindex>`;

    const outputPath = path.join(process.cwd(), 'public', 'sitemap.xml');
    fs.writeFileSync(outputPath, xml);
    console.log(`Generated sitemap index at ${outputPath} with ${sitemaps.length} entries.`);
};

generateSitemapIndex();
