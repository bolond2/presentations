const SECTION_CONFIG = [
  { gradient: 'radial-gradient(ellipse 70% 55% at 50% 100%, rgb(250 15 0 / 14%) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 15% 15%, rgb(126 59 242 / 6%) 0%, transparent 65%)', layout: 'hero-list' },
  { gradient: 'radial-gradient(ellipse 65% 55% at 75% 55%, rgb(20 115 230 / 12%) 0%, transparent 65%), radial-gradient(ellipse 40% 35% at 10% 80%, rgb(126 59 242 / 6%) 0%, transparent 60%)', layout: 'list' },
  { gradient: 'radial-gradient(ellipse 65% 55% at 25% 45%, rgb(126 59 242 / 10%) 0%, transparent 65%), radial-gradient(ellipse 40% 30% at 85% 20%, rgb(250 15 0 / 5%) 0%, transparent 60%)', layout: 'hero-list' },
  { gradient: 'radial-gradient(ellipse 65% 55% at 65% 35%, rgb(242 92 5 / 12%) 0%, transparent 65%), radial-gradient(ellipse 40% 35% at 15% 75%, rgb(250 15 0 / 8%) 0%, transparent 60%)', layout: 'hero-list' },
  { gradient: 'radial-gradient(ellipse 65% 55% at 50% 60%, rgb(20 115 230 / 10%) 0%, transparent 65%), radial-gradient(ellipse 35% 30% at 85% 85%, rgb(250 15 0 / 6%) 0%, transparent 60%)', layout: 'list' },
];

const INVISIBLE_RE = /[\u00a0\s]/g;

function isVisibleParagraph(p) {
  return p.textContent.replace(INVISIBLE_RE, '').length > 0;
}

function configureSection(row, i) {
  row.classList.add('slide-section');
  if (i > 0) row.dataset.index = String(i).padStart(2, '0');
  const config = SECTION_CONFIG[i] || {};
  if (config.gradient) row.style.setProperty('--section-bg', config.gradient);
  if (config.layout) row.dataset.layout = config.layout;
  return config;
}

function splitBrParagraphs(row) {
  [...row.querySelectorAll('p')].forEach((p) => {
    if (!p.querySelector('br')) return;
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
    p.replaceWith(frag);
  });
}

function markParagraphDelays(row) {
  const paras = [...row.querySelectorAll('p')].filter(isVisibleParagraph);
  paras.forEach((p, j) => {
    p.style.setProperty('--p-delay', `${0.2 + j * 0.08}s`);
  });
  const lastPara = paras[paras.length - 1];
  if (lastPara) lastPara.classList.add('slide-last-p');
}

function staggerHeadline(h) {
  const text = h.textContent;
  h.textContent = '';
  let charIndex = 0;
  text.split(/(\s+)/).forEach((chunk) => {
    if (/^\s+$/.test(chunk)) {
      h.appendChild(document.createTextNode(' '));
      return;
    }
    const word = document.createElement('span');
    word.className = 'slide-word';
    [...chunk].forEach((ch) => {
      const c = document.createElement('span');
      c.className = 'slide-char';
      c.textContent = ch;
      c.style.setProperty('--char-i', charIndex);
      charIndex += 1;
      word.appendChild(c);
    });
    h.appendChild(word);
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
    { threshold: 0.5 },
  );
  sections.forEach((s) => observer.observe(s));
}

function wireNavigation(sections) {
  const state = { current: 0 };

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      state.current = Math.min(state.current + 1, sections.length - 1);
      sections[state.current].scrollIntoView({ behavior: 'smooth' });
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      state.current = Math.max(state.current - 1, 0);
      sections[state.current].scrollIntoView({ behavior: 'smooth' });
    }
  });

  const syncObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) state.current = sections.indexOf(entry.target);
      });
    },
    { threshold: 0.6 },
  );
  sections.forEach((s) => syncObserver.observe(s));
}

export default function decorate(block) {
  const sections = [...block.children];

  sections.forEach((row, i) => {
    const config = configureSection(row, i);

    if (config.layout === 'list' || config.layout === 'hero-list') {
      splitBrParagraphs(row);
    }

    markParagraphDelays(row);
    row.querySelectorAll('h1, h2').forEach(staggerHeadline);
  });

  wireScrollReveal(sections);
  wireNavigation(sections);
}
