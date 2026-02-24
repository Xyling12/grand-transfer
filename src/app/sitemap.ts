import { MetadataRoute } from 'next';
import { cities, getDistanceFromLatLonInKm } from '@/data/cities';
import { blogPosts } from '@/data/posts';

export const dynamic = 'force-dynamic';
export const revalidate = 86400; // Cache for 24 hours so it's not generated every single click

// Required by Next.js to know which dynamic sitemaps to generate
export async function generateSitemaps() {
    // We'll use the first city's ID as a special ID for the main sitemap chunk
    // which includes static pages like home, privacy, and blog index/posts.
    // All other city IDs will generate their respective dynamic routes.
    return [{ id: cities[0].id }, ...cities.slice(1).map((city) => ({ id: city.id }))];
}

export default async function sitemap({ id }: { id: string }): Promise<MetadataRoute.Sitemap> {
    const baseUrl = 'https://xn--c1acbe2apap.com';
    const resolvedId = id; // `id` is already resolved by Next.js for dynamic sitemaps

    const fromCity = cities.find(c => c.id === resolvedId);
    const routes: MetadataRoute.Sitemap = [];

    // Add main pages, blog index, and blog posts only to the first sitemap chunk
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

        // Add blog index
        routes.push({
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.9,
        });

        // Add individual blog posts
        blogPosts.forEach(post => {
            routes.push({
                url: `${baseUrl}/blog/${post.id}`,
                lastModified: new Date(post.date),
                changeFrequency: 'monthly',
                priority: 0.7,
            });
        });
    }

    // Generate dynamic routes only for this specific departure city (limit to < 1500 km)
    if (fromCity) {
        cities.forEach(toCity => {
            if (fromCity.id !== toCity.id) {
                const dist = getDistanceFromLatLonInKm(fromCity.lat, fromCity.lon, toCity.lat, toCity.lon);
                if (dist >= 30 && dist <= 1200) {
                    routes.push({
                        url: `${baseUrl}/routes/${fromCity.id}/${toCity.id}`,
                        lastModified: new Date(),
                        changeFrequency: 'monthly',
                        priority: 0.6,
                    });
                }
            }
        });
    }

    return routes;
}
