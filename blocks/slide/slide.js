const SECTION_CONFIG = [
  { gradient: 'radial-gradient(ellipse 70% 55% at 50% 100%, rgb(0 125 165 / 14%) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 15% 15%, rgb(126 59 242 / 6%) 0%, transparent 65%)', layout: 'hero-list' },
  { gradient: 'radial-gradient(ellipse 65% 55% at 75% 55%, rgb(20 115 230 / 12%) 0%, transparent 65%), radial-gradient(ellipse 40% 35% at 10% 80%, rgb(126 59 242 / 6%) 0%, transparent 60%)', layout: 'list' },
  { gradient: 'radial-gradient(ellipse 65% 55% at 25% 45%, rgb(126 59 242 / 10%) 0%, transparent 65%), radial-gradient(ellipse 40% 30% at 85% 20%, rgb(0 125 165 / 5%) 0%, transparent 60%)', layout: 'hero-list' },
  { gradient: 'radial-gradient(ellipse 65% 55% at 65% 35%, rgb(0 125 165 / 12%) 0%, transparent 65%), radial-gradient(ellipse 40% 35% at 15% 75%, rgb(0 125 165 / 8%) 0%, transparent 60%)', layout: 'hero-list' },
  { gradient: 'radial-gradient(ellipse 65% 55% at 50% 60%, rgb(20 115 230 / 10%) 0%, transparent 65%), radial-gradient(ellipse 35% 30% at 85% 85%, rgb(0 125 165 / 6%) 0%, transparent 60%)', layout: 'list' },
];

const INVISIBLE_RE = /[\u00a0\s]/g;

/** Entire trimmed text of a paragraph must match (case-insensitive). */
const LAYOUT_PARAGRAPH_RE = /^layout:\s*(quote|scripture|list|hero-list|title)\s*$/i;

const LAYOUTS_WITH_BR_SPLIT = new Set(['list', 'hero-list', 'scripture']);

/** Paragraphs worth keeping / animating (non-whitespace text or embedded media). */
const EMBEDDED_MEDIA_SEL = 'img, picture, video, iframe, object, svg, audio';

function isVisibleParagraph(p) {
  if (p.textContent.replace(INVISIBLE_RE, '').length > 0) return true;
  return p.querySelector(EMBEDDED_MEDIA_SEL) != null;
}

/**
 * Optional per-slide layout: first matching paragraph whose entire text is `layout: <name>`.
 * Removes that paragraph from the DOM so it is not visible on the deck.
 * @param {Element} row
 * @returns {string|null}
 */
function extractAndStripLayoutParagraph(row) {
  const paras = [...row.querySelectorAll('p')];
  const p = paras.find((el) => {
    const t = el.textContent.replace(INVISIBLE_RE, ' ').replace(/\s+/g, ' ').trim();
    return LAYOUT_PARAGRAPH_RE.test(t);
  });
  if (!p) return null;
  const t = p.textContent.replace(INVISIBLE_RE, ' ').replace(/\s+/g, ' ').trim();
  const m = t.match(LAYOUT_PARAGRAPH_RE);
  p.remove();
  return m ? m[1].toLowerCase() : null;
}

/**
 * Enables --deck-ui-scale via URL or block variant class `large` (see README).
 * EDS keeps the first block class as `slide` for loading; `large` must be an extra class.
 */
function applyDeckLargeMode(block) {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('deck') === 'large'
    || params.get('large') === '1'
    || params.get('large') === 'true';
  const fromBlock = block.classList.contains('large');
  if (fromUrl || fromBlock) {
    document.documentElement.classList.add('slide-deck-large');
  }
}

function configureSection(row, i) {
  row.classList.add('slide-section');
  if (i > 0) row.dataset.index = String(i).padStart(2, '0');
  const explicit = SECTION_CONFIG[i];
  const cycled = SECTION_CONFIG[i % SECTION_CONFIG.length] || {};
  if (explicit?.gradient) {
    row.style.setProperty('--section-bg', explicit.gradient);
  } else if (cycled.gradient) {
    row.style.setProperty('--section-bg', cycled.gradient);
  }
  if (explicit?.layout) row.dataset.layout = explicit.layout;
  return explicit || {};
}

function splitBrParagraphs(row) {
  [...row.querySelectorAll('p')].forEach((p) => {
    if (!p.querySelector('br')) return;
    const hadVisible = isVisibleParagraph(p);
    const lines = [[]];
    [...p.childNodes].forEach((node) => {
      if (node.nodeType === 1 && node.tagName === 'BR') {
        lines.push([]);
      } else {
        lines[lines.length - 1].push(node);
      }
    });
    const frag = document.createDocumentFragment();
    lines.forEach((nodes) => {
      const newP = document.createElement('p');
      nodes.forEach((n) => newP.appendChild(n));
      if (isVisibleParagraph(newP)) frag.appendChild(newP);
    });
    if (frag.childNodes.length === 0) {
      if (hadVisible) return;
      p.remove();
      return;
    }
    p.replaceWith(frag);
  });
}

function markParagraphDelays(row) {
  const paras = [...row.querySelectorAll('p')].filter(isVisibleParagraph);
  const noHeadline = !row.querySelector('h1, h2');
  if (noHeadline) row.classList.add('slide-no-headline');
  const base = noHeadline ? 0.05 : 0.14;
  const step = noHeadline ? 0.035 : 0.065;
  paras.forEach((p, j) => {
    p.style.setProperty('--p-delay', `${(base + j * step).toFixed(3)}s`);
  });
}

/** IO does not always fire on first paint; unstick slides that are already on screen. */
function revealSectionsAlreadyOnScreen(sections) {
  const vh = window.innerHeight || document.documentElement.clientHeight || 1;
  sections.forEach((el) => {
    if (el.classList.contains('is-visible')) return;
    const r = el.getBoundingClientRect();
    const h = Math.max(1, r.height);
    const overlap = Math.min(r.bottom, vh) - Math.max(r.top, 0);
    const ratio = overlap / h;
    if (ratio >= 0.18 || (r.top < vh * 0.72 && r.bottom > vh * 0.2)) {
      el.classList.add('is-visible');
    }
  });
}

function wireScrollReveal(sections) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    },
    { threshold: [0, 0.15, 0.35] },
  );
  sections.forEach((s) => observer.observe(s));
}

function wireNavigation(sections) {
  if (!sections.length) return;

  function indexOfMostVisibleSlide() {
    const vh = window.innerHeight || document.documentElement.clientHeight || 1;
    let bestIdx = 0;
    let bestVisible = -1;
    sections.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const overlap = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      if (overlap > bestVisible) {
        bestVisible = overlap;
        bestIdx = i;
      }
    });
    return bestIdx;
  }

  function arrowShouldControlDeck(e) {
    const t = e.target;
    if (!(t instanceof Element)) return true;
    if (t.closest('input, textarea, select, [contenteditable="true"]')) return false;
    return true;
  }

  document.addEventListener('keydown', (e) => {
    const keys = ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'];
    if (!keys.includes(e.key)) return;
    if (!arrowShouldControlDeck(e)) return;
    if (!document.body.contains(sections[0])) return;

    e.preventDefault();

    let current = indexOfMostVisibleSlide();
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      current = Math.min(current + 1, sections.length - 1);
    } else {
      current = Math.max(current - 1, 0);
    }
    sections[current].scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

export default function decorate(block) {
  applyDeckLargeMode(block);

  const sections = [...block.children];

  sections.forEach((row, i) => {
    const layoutHint = extractAndStripLayoutParagraph(row);
    configureSection(row, i);
    if (layoutHint) row.dataset.layout = layoutHint;

    const layout = row.dataset.layout || '';
    if (LAYOUTS_WITH_BR_SPLIT.has(layout)) {
      splitBrParagraphs(row);
    }

    markParagraphDelays(row);
  });

  wireScrollReveal(sections);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => revealSectionsAlreadyOnScreen(sections));
  });
  wireNavigation(sections);
}
