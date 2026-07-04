import { useEffect, useRef, useState } from 'react';
import { Zap, Server, Clock, Cpu, Wifi } from 'lucide-react';
import './ServerWaking.css';

const POLL_INTERVAL = 3000;   // 3 s while sleeping (free tier friendly)
const READY_DELAY   = 2000;   // show green tick for 1.8 s before proceeding
let baseURL = import.meta.env.VITE_API_URL || '/api';
if (baseURL.endsWith('/')) baseURL = baseURL.slice(0, -1);
if (!baseURL.endsWith('/api') && baseURL !== '/api') baseURL += '/api';
const HEALTH_URL = baseURL + '/health';

// ── Floating particles (pure CSS, generated once) ────────
const PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  size:  4 + Math.random() * 10,
  left:  Math.random() * 100,
  delay: Math.random() * 8,
  dur:   6 + Math.random() * 10,
}));

export default function ServerWaking({ onReady }) {
  const [status, setStatus]   = useState('checking'); // checking | sleeping | waking | ready
  const [attempts, setAttempts] = useState(0);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    let pollTimer;

    async function ping() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(`${HEALTH_URL}?t=${Date.now()}`, { 
          method: 'GET', 
          cache: 'no-store',
          signal: controller.signal 
        });
        clearTimeout(timeoutId);
        if (!mountedRef.current) return;
        if (res.ok) {
          setStatus('ready');
          // Wait for animation then hand off
          setTimeout(() => { if (mountedRef.current) onReady?.(); }, READY_DELAY);
          return; // stop polling
        }
        throw new Error('non-ok');
      } catch {
        if (!mountedRef.current) return;
        setStatus(prev => prev === 'checking' ? 'sleeping' : 'sleeping');
        setAttempts(a => a + 1);
        pollTimer = setTimeout(ping, POLL_INTERVAL);
      }
    }

    ping();
    return () => {
      mountedRef.current = false;
      clearTimeout(pollTimer);
    };
  }, [onReady]);

  const isReady    = status === 'ready';
  const isSleeping = status === 'sleeping';
  const isChecking = status === 'checking';

  return (
    <div className="sw-root">
      {/* Particles */}
      <div className="sw-particles">
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className="sw-particle"
            style={{
              width:  p.size,
              height: p.size,
              left:   p.left + '%',
              bottom: '-20px',
              animationDuration: p.dur + 's',
              animationDelay:    p.delay + 's',
            }}
          />
        ))}
      </div>

      <div className="sw-card">
        {/* Logo */}
        <div className="sw-logo">
          <div className="sw-logo-icon">
            <Zap size={22} fill="white" color="white" />
          </div>
          <span className="sw-logo-text">SmartERP</span>
        </div>

        {/* Icon area */}
        {isReady ? (
          <div className="sw-success-wrap">
            {/* Ripple rings */}
            <div className="sw-success-ripple" />
            <div className="sw-success-ripple2" />
            {/* Drawn SVG: circle first, then tick */}
            <svg
              className="sw-drawn-svg"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Circle strokes itself */}
              <circle
                className="sw-drawn-circle"
                cx="50" cy="50" r="44"
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
              />
              {/* Tick traces head → tail */}
              <path
                className="sw-drawn-check"
                d="M 22 52 L 40 70 L 78 30"
                stroke="#10b981"
                strokeWidth="5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        ) : (
          <div className="sw-orbit-wrap">
            <div className="sw-ring-outer" />
            <div className="sw-ring" />
            <div className="sw-center-icon">
              <Server className="sw-server-icon" />
            </div>
          </div>
        )}

        {/* Title */}
        <h1 className="sw-title">
          {isChecking && 'Connecting to Server…'}
          {isSleeping && 'Server is Waking Up'}
          {isReady    && 'Server is Online!'}
        </h1>

        {/* Subtitle */}
        <p className="sw-subtitle">
          {isChecking && 'Checking if our backend is available. Just a moment…'}
          {isSleeping && (
            <>
              We&apos;re on a free-tier hosting plan that sleeps after inactivity.{' '}
              <strong style={{ color: '#93c5fd' }}>No action needed</strong> — we&apos;re
              waking it up automatically.{' '}
              This usually takes <strong style={{ color: '#c4b5fd' }}>30–60 seconds</strong>.
              <br /><br />
              We sincerely apologise for the inconvenience. ✨
            </>
          )}
          {isReady && (
            <span className="sw-subtitle-ready">
              Everything is up and running. Taking you in…
            </span>
          )}
        </p>

        {/* Dots / success indicator */}
        {!isReady && (
          <div className="sw-dots">
            <div className="sw-dot" />
            <div className="sw-dot" />
            <div className="sw-dot" />
          </div>
        )}

        {/* Progress bar */}
        <div className="sw-status-bar">
          {isReady
            ? <div className="sw-status-fill-full" />
            : <div className="sw-status-fill" />
          }
        </div>

        {/* Attempt counter */}
        {isSleeping && (
          <p className="sw-attempts">
            Ping attempt #{attempts} · checking every 3 s
          </p>
        )}

        {/* Info cards */}
        {isSleeping && (
          <div className="sw-notes">
            <div className="sw-note">
              <Clock size={15} color="#60a5fa" className="sw-note-icon" />
              Free-tier servers spin down after ~15 min of inactivity to save resources.
            </div>
            <div className="sw-note">
              <Cpu size={15} color="#a78bfa" className="sw-note-icon" />
              The server is booting its Node.js process. Your data is safe.
            </div>
            <div className="sw-note">
              <Wifi size={15} color="#34d399" className="sw-note-icon" />
              Once online, all features will be fully available at normal speed.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
