import { useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Pricing() {
  const router = useRouter();
  const [loading, setLoading] = useState(null);

  const handleUpgrade = async (plan) => {
    setLoading(plan);

    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          userId: session.user.id,
          userEmail: session.user.email,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Something went wrong. Please try again.');
        setLoading(null);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Something went wrong. Please try again.');
      setLoading(null);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>Unlock Premium</h1>
        <p style={styles.subtitle}>
          Unlimited ATS scans, AI job matching, and the interview simulator.
        </p>
      </div>

      <div style={styles.cardsWrap}>
        <div style={styles.card}>
          <h2 style={styles.planName}>Weekly</h2>
          <div style={styles.price}>
            $4.99 <span style={styles.period}>/ week</span>
          </div>
          <p style={styles.blurb}>Perfect for an active job search sprint.</p>
          <button
            style={styles.button}
            onClick={() => handleUpgrade('weekly')}
            disabled={loading !== null}
          >
            {loading === 'weekly' ? 'Loading...' : 'Choose Weekly'}
          </button>
        </div>

        <div style={{ ...styles.card, ...styles.cardHighlight }}>
          <div style={styles.badge}>BEST VALUE</div>
          <h2 style={styles.planName}>Monthly</h2>
          <div style={styles.price}>
            $14.99 <span style={styles.period}>/ month</span>
          </div>
          <p style={styles.blurb}>Save over 25% vs weekly billing.</p>
          <button
            style={{ ...styles.button, ...styles.buttonHighlight }}
            onClick={() => handleUpgrade('monthly')}
            disabled={loading !== null}
          >
            {loading === 'monthly' ? 'Loading...' : 'Choose Monthly'}
          </button>
        </div>
      </div>

      <p style={styles.back} onClick={() => router.push('/')}>← Back to dashboard</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '60px 20px',
    background: '#0a0a0a',
    color: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  header: { textAlign: 'center', marginBottom: '48px' },
  title: { fontSize: '36px', fontWeight: 700, marginBottom: '12px' },
  subtitle: { fontSize: '16px', color: '#a0a0a0' },
  cardsWrap: {
    display: 'flex',
    gap: '24px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    maxWidth: '700px',
    margin: '0 auto',
  },
  card: {
    position: 'relative',
    background: '#161616',
    border: '1px solid #2a2a2a',
    borderRadius: '16px',
    padding: '32px',
    width: '280px',
  },
  cardHighlight: {
    border: '2px solid #d4af37',
    background: 'linear-gradient(135deg, #1a1505, #161616)',
  },
  badge: {
    position: 'absolute',
    top: '-12px',
    right: '24px',
    background: '#d4af37',
    color: '#000',
    fontSize: '11px',
    fontWeight: 700,
    padding: '4px 10px',
    borderRadius: '20px',
    letterSpacing: '0.5px',
  },
  planName: { fontSize: '20px', fontWeight: 600, marginBottom: '8px' },
  price: { fontSize: '32px', fontWeight: 700, marginBottom: '12px' },
  period: { fontSize: '14px', fontWeight: 400, color: '#a0a0a0' },
  blurb: { fontSize: '14px', color: '#a0a0a0', marginBottom: '24px', minHeight: '40px' },
  button: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #444',
    background: 'transparent',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  buttonHighlight: {
    background: 'linear-gradient(135deg, #d4af37, #f4d160)',
    color: '#000',
    border: 'none',
  },
  back: { textAlign: 'center', marginTop: '40px', color: '#666', fontSize: '14px', cursor: 'pointer' },
};
