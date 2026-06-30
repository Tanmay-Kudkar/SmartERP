import { useEffect } from 'react';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function isVisible(el) {
  if (!el) return false;
  const style = window.getComputedStyle(el);
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    el.offsetParent !== null
  );
}

function getCenter(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

/**
 * Walk up the DOM and return the closest scrollable ancestor (or document.body).
 */
function getScrollContainer(el) {
  let node = el.parentElement;
  while (node && node !== document.body) {
    const style = window.getComputedStyle(node);
    if (/auto|scroll/.test(style.overflow + style.overflowY + style.overflowX)) {
      return node;
    }
    node = node.parentElement;
  }
  return document.body;
}

/**
 * Score how good a candidate is for a given arrow direction.
 * Lower score = better candidate.
 *
 * Key idea:
 *   - The PRIMARY axis distance is used directly.
 *   - The SECONDARY axis drift is penalised very heavily (×10).
 *   - A candidate that is in the WRONG primary direction gets Infinity.
 *   - Candidates that share the same scroll container get a bonus (×0.5).
 */
function scoreCandidate(fromRect, toRect, direction, shareContainer) {
  const from = getCenter(fromRect);
  const to = getCenter(toRect);
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  let primaryDist, secondaryDrift;
  let validDirection = false;

  if (direction === 'ArrowDown') {
    if (dy < 5) return Infinity;            // must be below
    validDirection = true;
    primaryDist = dy;
    secondaryDrift = Math.abs(dx);
  } else if (direction === 'ArrowUp') {
    if (dy > -5) return Infinity;           // must be above
    validDirection = true;
    primaryDist = -dy;
    secondaryDrift = Math.abs(dx);
  } else if (direction === 'ArrowRight') {
    if (dx < 5) return Infinity;            // must be to the right
    validDirection = true;
    primaryDist = dx;
    secondaryDrift = Math.abs(dy);
  } else if (direction === 'ArrowLeft') {
    if (dx > -5) return Infinity;           // must be to the left
    validDirection = true;
    primaryDist = -dx;
    secondaryDrift = Math.abs(dy);
  }

  if (!validDirection) return Infinity;

  // Heavy drift penalty — prevents jumping across columns or sidebar
  const score = primaryDist + secondaryDrift * 10;

  // Add massive penalty for jumping across containers (e.g., from main content to sidebar)
  return shareContainer ? score : score + 100000;
}

export function useSpatialNavigation() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      const { key } = e;
      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) return;

      const activeEl = document.activeElement;

      // Nothing focused — focus first visible element
      if (!activeEl || activeEl === document.body) {
        const first = Array.from(document.querySelectorAll(FOCUSABLE_SELECTOR)).find(isVisible);
        if (first) { e.preventDefault(); first.focus(); }
        return;
      }

      // Inside an input/textarea:
      const isTextInput = activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA';
      if (isTextInput) {
        // Left/Right always move text cursor natively
        if (key === 'ArrowLeft' || key === 'ArrowRight') return;
        // Up/Down act natively ONLY for number inputs or inputs with datalist dropdowns
        if (activeEl.type === 'number' || activeEl.hasAttribute('list')) {
          if (key === 'ArrowUp' || key === 'ArrowDown') return;
        }
        // Otherwise, Up/Down will break out of the input and spatial-navigate!
      }

      // Inside a <select>: let native arrow behaviour work (change value)
      if (activeEl.tagName === 'SELECT') return;

      const activeRect = activeEl.getBoundingClientRect();
      const activeContainer = getScrollContainer(activeEl);

      const openModal = document.querySelector('[data-palette-open="true"]') ||
                        document.querySelector('[data-alert-modal="true"]') ||
                        document.querySelector('[data-fy-modal="true"]') ||
                        document.querySelector('[data-calculator-open="true"]') ||
                        document.querySelector('.modal-overlay');

      const searchScope = openModal || document;

      const candidates = Array.from(searchScope.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter(el => el !== activeEl && !el.disabled && isVisible(el));

      let bestCandidate = null;
      let bestScore = Infinity;

      candidates.forEach(el => {
        const rect = el.getBoundingClientRect();
        const sameContainer = getScrollContainer(el) === activeContainer;
        const score = scoreCandidate(activeRect, rect, key, sameContainer);
        if (score < bestScore) {
          bestScore = score;
          bestCandidate = el;
        }
      });

      if (bestCandidate) {
        e.preventDefault();
        if (activeEl && activeEl !== document.body) activeEl.blur();
        bestCandidate.focus();
        bestCandidate.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
