import styles from './page.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { blogPosts } from '@/data/posts';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
    title: 'Блог о пассажирских перевозках | GrandTransfer',
    description: 'Полезные статьи о правилах поездок на междугороднем такси, советы туристам, перевозка животных и выбор тарифов.',
    keywords: 'блог такси, правила такси межгород, статьи пассажирские перевозки'
};

export default function BlogIndex() {
    return (
        <main>
            <Header />
            <div className={styles.main}>
                <div className="container" style={{ paddingTop: '100px', paddingBottom: '60px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <h1 className={styles.title}>Блог GrandTransfer</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
                            Полезные статьи, советы и актуальная информация о междугородних пассажирских перевозках.
                        </p>
                    </div>

                    <div className={styles.grid}>
                        {blogPosts.map((post) => (
                            <Link href={`/blog/${post.id}`} key={post.id} className={styles.card}>
                                <div className={styles.imageWrapper}>
                                    <Image
                                        src={post.imageUrl}
                                        alt={post.title}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        style={{ objectFit: 'cover' }}
                                    />
                                </div>
                                <div className={styles.content}>
                                    <div className={styles.meta}>
                                        <time dateTime={post.date}>
                                            {new Date(post.date).toLocaleDateString('ru-RU', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </time>
                                    </div>
                                    <h2 className={styles.postTitle}>{post.title}</h2>
                                    <p className={styles.description}>{post.description}</p>
                                    <span className={styles.readMore}>Читать далее →</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
