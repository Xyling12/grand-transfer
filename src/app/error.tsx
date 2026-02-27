'use client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <main style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            textAlign: 'center',
        }}>
            <h1 style={{
                fontSize: '3rem',
                fontWeight: 800,
                color: 'var(--color-primary)',
                marginBottom: '10px',
            }}>
                Ой, что-то пошло не так
            </h1>
            <p style={{
                color: 'var(--color-text-muted)',
                marginBottom: '32px',
                maxWidth: '450px',
                lineHeight: 1.6,
            }}>
                Произошла непредвиденная ошибка. Попробуйте обновить страницу.
                Если проблема сохраняется — свяжитесь с нами по телефону.
            </p>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                    onClick={() => reset()}
                    style={{
                        padding: '12px 28px',
                        background: 'var(--color-primary)',
                        color: '#fff',
                        borderRadius: '12px',
                        border: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                        cursor: 'pointer',
                    }}
                >
                    Попробовать снова
                </button>
                <a
                    href="/"
                    style={{
                        padding: '12px 28px',
                        border: '1px solid var(--color-primary)',
                        color: 'var(--color-primary)',
                        borderRadius: '12px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '1rem',
                    }}
                >
                    На главную
                </a>
            </div>
        </main>
    );
}
