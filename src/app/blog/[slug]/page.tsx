import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getBlogPostById, blogPosts } from '@/data/posts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BookingForm from '@/components/BookingForm';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import styles from './page.module.css';

type Props = {
    params: Promise<{ slug: string }>
};

// Next.js static generation for all known posts
export async function generateStaticParams() {
    return blogPosts.map((post) => ({
        slug: post.id,
    }));
}

export async function generateMetadata(
    props: Props
): Promise<Metadata> {
    const params = await props.params;
    const post = getBlogPostById(params.slug);

    if (!post) {
        return { title: 'Статья не найдена | GrandTransfer' }
    }

    return {
        title: `${post.title} | Блог GrandTransfer`,
        description: post.description,
        keywords: post.seoKeywords,
        openGraph: {
            title: post.title,
            description: post.description,
            type: 'article',
            publishedTime: post.date,
            authors: [post.author],
        }
    };
}

export default async function BlogPostPage(props: Props) {
    const params = await props.params;
    const post = getBlogPostById(params.slug);

    if (!post) {
        notFound();
    }

    // Schema.org Article
    const articleSchema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": post.title,
        "description": post.description,
        "image": `https://xn--c1acbe2apap.com${post.imageUrl}`,
        "author": {
            "@type": "Organization",
            "name": post.author
        },
        "publisher": {
            "@type": "Organization",
            "name": "GrandTransfer",
            "logo": {
                "@type": "ImageObject",
                "url": "https://xn--c1acbe2apap.com/icon.png"
            }
        },
        "datePublished": post.date,
        "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": `https://xn--c1acbe2apap.com/blog/${post.id}`
        }
    };

    return (
        <main>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '500px',
                    background: 'linear-gradient(to bottom, rgba(99, 102, 241, 0.15) 0%, transparent 100%)',
                    pointerEvents: 'none',
                    zIndex: -1,
                }}
            />

            <Header />

            <article className={styles.article}>
                <div className="container" style={{ paddingTop: '80px' }}>

                    {/* Breadcrumbs */}
                    <div className={styles.breadcrumbs}>
                        <Link href="/">Главная</Link>
                        <ChevronRight size={14} />
                        <Link href="/blog">Блог</Link>
                        <ChevronRight size={14} />
                        <span>{post.title}</span>
                    </div>

                    {/* Article Header */}
                    <header className={styles.header}>
                        <h1 className={styles.title}>{post.title}</h1>
                        <div className={styles.meta}>
                            <time dateTime={post.date}>
                                {new Date(post.date).toLocaleDateString('ru-RU', {
                                    year: 'numeric', month: 'long', day: 'numeric'
                                })}
                            </time>
                            <span className={styles.dot}>•</span>
                            <span>{post.author}</span>
                        </div>
                    </header>

                    {/* Hero Image */}
                    <div className={styles.heroImage}>
                        <Image
                            src={post.imageUrl}
                            alt={post.title}
                            fill
                            priority
                            sizes="(max-width: 1000px) 100vw, 1000px"
                            style={{ objectFit: 'cover' }}
                        />
                    </div>

                    {/* Content Body */}
                    <div
                        className={styles.content}
                        dangerouslySetInnerHTML={{ __html: post.content }}
                    />

                </div>
            </article>

            {/* Conversion Block */}
            <section style={{ padding: '60px 0', background: 'rgba(0,0,0,0.3)' }}>
                <div className="container" style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-bodoni)', color: 'var(--color-primary)' }}>
                        Готовы к поездке?
                    </h2>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '600px', margin: '10px auto 0' }}>
                        Рассчитайте стоимость вашего маршрута онлайн. Фиксированная цена и подача точно ко времени.
                    </p>
                </div>
                <BookingForm />
            </section>

            <Footer />
        </main>
    );
}
