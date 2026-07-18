import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export default function PremiumWelcome() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/');
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>⭐</div>
        <h1 style={styles.title}>You're Premium!</h1>
        <p style={styles.subtitle}>
          Welcome to CollegeReadyJobs Pro. All premium features are now unlocked.
        </p>

        <div style={styles.features}>
          <div style={styles.feature}>✅ Unlimited ATS Resume Scans</div>
          <div style={styles.feature}>✅ AI Job Matching</div>
          <div style={styles.feature}>✅ Interview Simulator</div>
          <div style={styles.feature}>✅ Save Jobs to Tracker</div>
        </div>

        <button style={styles.button} onClick={() => router.push('/')}>
          Go to Dashboard
        </button>

        <p style={styles.countdown}>
          Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0a',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    background: 'linear-gradient(135deg, #1a1505, #161616)',
    border: '2px solid #d4af37',
    borderRadius: '20px',
    padding: '48px 40px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    color: '#fff',
  },
  icon: { fontSize: '56px', marginBottom: '16px' },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    marginBottom: '12px',
    background: 'linear-gradient(135deg, #d4af37, #f4d160)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    fontSize: '16px',
    color: '#a0a0a0',
    marginBottom: '32px',
    lineHeight: '1.5',
  },
  features: {
    background: '#0f0f0f',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '32px',
    textAlign: 'left',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  feature: { fontSize: '15px', color: '#e0e0e0' },
  button: {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #d4af37, #f4d160)',
    color: '#000',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    marginBottom: '16px',
  },
  countdown: { fontSize: '13px', color: '#555' },
};
