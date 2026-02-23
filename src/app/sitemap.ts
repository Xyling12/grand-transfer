import { MetadataRoute } from 'next';
import { cities } from '@/data/cities';

// Required by Next.js to know which dynamic sitemaps to generate
export async function generateSitemaps() {
    return cities.map((city) => ({ id: city.id }));
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://xn--c1acbe2apap.com';
    const resolvedId = await id;

    const fromCity = cities.find(c => c.id === resolvedId);
    if (!fromCity) return [];

    const routes: MetadataRoute.Sitemap = [];

    // Add main pages to the first sitemap chunk
    if (resolvedId === cities[0].id) {
        routes.push({
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        });
        routes.push({
            url: `${baseUrl}/privacy`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.1,
        });
    }

    // Generate dynamic routes only for this specific departure city
    cities.forEach(toCity => {
        if (fromCity.id !== toCity.id) {
            routes.push({
                url: `${baseUrl}/routes/${fromCity.id}/${toCity.id}`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.6,
            });
        }
    });

    return routes;
}
