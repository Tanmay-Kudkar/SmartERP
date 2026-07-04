import { useEffect, useRef, useState } from 'react';
import './GlobalLoader.css';

// Event-based: client.js fires these events on every request
export const LOADER_START = 'gl:start';
export const LOADER_DONE  = 'gl:done';

let activeCount = 0;
export function notifyStart() {
  activeCount++;
  window.dispatchEvent(new Event(LOADER_START));
}
export function notifyDone() {
  activeCount = Math.max(0, activeCount - 1);
  if (activeCount === 0) window.dispatchEvent(new Event(LOADER_DONE));
}

export default function GlobalLoader() {
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const doneTimer = useRef(null);

  useEffect(() => {
    function onStart() {
      clearTimeout(doneTimer.current);
      setDone(false);
      setLoading(true);
    }
    function onDone() {
      setDone(true);
      setLoading(false);
      doneTimer.current = setTimeout(() => setDone(false), 700);
    }
    window.addEventListener(LOADER_START, onStart);
    window.addEventListener(LOADER_DONE,  onDone);
    return () => {
      window.removeEventListener(LOADER_START, onStart);
      window.removeEventListener(LOADER_DONE,  onDone);
      clearTimeout(doneTimer.current);
    };
  }, []);

  if (!loading && !done) return null;

  return (
    <>
      <div className={'gl-bar' + (done ? ' gl-bar--done' : ' gl-bar--active')} />
      {loading && (
        <div className="gl-badge">
          <div className="gl-spinner" />
          <span>Loading…</span>
        </div>
      )}
    </>
  );
}
