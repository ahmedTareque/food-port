'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: '#F4F7F5', color: '#15181A', fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', margin: 0 }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠</p>
          <h2 style={{ fontFamily: 'sans-serif', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Critical Error</h2>
          <p style={{ color: '#6B756F', marginBottom: '1.5rem', fontSize: '0.875rem' }}>The application encountered a fatal error.</p>
          <button
            onClick={reset}
            style={{ background: '#58D0A2', color: '#fff', border: 'none', borderRadius: '0.75rem', padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: 600 }}
          >
            Reload Application
          </button>
        </div>
      </body>
    </html>
  );
}
