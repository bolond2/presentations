function readNames(block) {
  return [...block.children]
    .map((row) => row.textContent.trim())
    .filter((t) => t.length > 0);
}

/**
 * Waits until slide sections exist (slide block may load after this block in the same section).
 * @returns {Promise<Element[]>}
 */
function getSlideSectionsWhenReady() {
  const found = () => [...document.querySelectorAll('.slide-section')];
  const initial = found();
  if (initial.length) return Promise.resolve(initial);

  return new Promise((resolve) => {
    let settled = false;
    let timeoutId;
    let observer;
    const finish = () => {
      if (settled) return;
      settled = true;
      observer?.disconnect();
      window.clearTimeout(timeoutId);
      resolve(found());
    };
    observer = new MutationObserver(() => {
      if (found().length) finish();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    timeoutId = window.setTimeout(finish, 30000);
  });
}

function buildItem(section, index, total, name) {
  const item = document.createElement('button');
  item.className = 'progress-nav-item';
  item.setAttribute('aria-label', `Go to slide ${index + 1}: ${name}`);
  const pos = total > 1 ? (index / (total - 1)) * 80 + 10 : 50;
  item.style.top = `${pos}%`;

  const label = document.createElement('span');
  label.className = 'progress-nav-label';
  const num = document.createElement('span');
  num.className = 'progress-nav-num';
  num.textContent = String(index + 1).padStart(2, '0');
  label.appendChild(num);
  label.appendChild(document.createTextNode(name));

  const dot = document.createElement('span');
  dot.className = 'progress-nav-dot';

  item.appendChild(label);
  item.appendChild(dot);
  item.addEventListener('click', () => {
    section.scrollIntoView({ behavior: 'smooth' });
  });
  return item;
}

function buildNav(sections, names) {
  const nav = document.createElement('nav');
  nav.className = 'progress-nav';
  nav.setAttribute('aria-label', 'Slide navigation');

  const spine = document.createElement('span');
  spine.className = 'progress-nav-spine';
  nav.appendChild(spine);

  const total = sections.length;
  const items = sections.map((section, i) => {
    const name = names[i] || `Slide ${i + 1}`;
    const item = buildItem(section, i, total, name);
    nav.appendChild(item);
    return item;
  });

  return { nav, items };
}

function wireActiveTracking(sections, items) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const idx = sections.indexOf(entry.target);
        if (entry.isIntersecting) {
          items[idx]?.classList.add('active');
        } else {
          items[idx]?.classList.remove('active');
        }
      });
    },
    { threshold: 0.5 },
  );
  sections.forEach((s) => observer.observe(s));
}

export default async function decorate(block) {
  const names = readNames(block);
  block.remove();

  const sections = await getSlideSectionsWhenReady();
  if (!sections.length) return;

  const { nav, items } = buildNav(sections, names);
  document.body.appendChild(nav);

  wireActiveTracking(sections, items);
}
