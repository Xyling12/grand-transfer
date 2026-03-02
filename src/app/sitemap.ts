import { MetadataRoute } from 'next';
import { cities, getDistanceFromLatLonInKm } from '@/data/cities';
import { blogPosts } from '@/data/posts';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://xn--c1acbe2apap.com';
    const routes: MetadataRoute.Sitemap = [];

    // Main pages
    routes.push({
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 1,
    });

    routes.push({
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
    });

    routes.push({
        url: `${baseUrl}/faq`,
        lastModified: new Date(),
        changeFrequency: 'monthly',
        priority: 0.7,
    });

    routes.push({
        url: `${baseUrl}/routes`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
    });

    routes.push({
        url: `${baseUrl}/terms`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.2,
    });

    routes.push({
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: 'yearly',
        priority: 0.1,
    });

    // Blog
    routes.push({
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.9,
    });

    blogPosts.forEach(post => {
        routes.push({
            url: `${baseUrl}/blog/${post.id}`,
            lastModified: new Date(post.date),
            changeFrequency: 'monthly',
            priority: 0.7,
        });
    });

    // Gradually expand route coverage: use top 60 cities (ordered by importance in cities.ts)
    // This gives ~800-1000 routes — safe growth from previous 30 cities / ~217 routes
    // Can increase to 80-100 over time as domain authority grows
    const routeCities = cities.slice(0, 60);
    routeCities.forEach(fromCity => {
        routeCities.forEach(toCity => {
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
    });

    return routes;
}
