"use client";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="tr">
            <body style={{
                backgroundColor: '#000',
                color: '#fff',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                fontFamily: 'Inter, system-ui, sans-serif',
                margin: 0,
            }}>
                <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
                    <h1 style={{ fontSize: '4rem', margin: '0 0 1rem', color: '#f97316' }}>500</h1>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontWeight: 600 }}>
                        Bir sorun oluştu
                    </h2>
                    <p style={{ color: '#9ca3af', marginBottom: '2rem', lineHeight: 1.6 }}>
                        Üzgünüz, beklenmedik bir hata oluştu. Lütfen tekrar deneyin.
                    </p>
                    <button
                        onClick={reset}
                        style={{
                            backgroundColor: '#f97316',
                            color: '#fff',
                            border: 'none',
                            padding: '0.75rem 2rem',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Tekrar Dene
                    </button>
                </div>
            </body>
        </html>
    );
}
