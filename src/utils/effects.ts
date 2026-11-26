// Site-wide visual effects: preloader, image fade-in, scroll reveal and scroll progress.
// Everything is plain DOM so components stay unchanged; styles live in index.css.

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Images fade in once loaded; until then they show a shimmer (see img:not(.is-loaded) in index.css)
export function initImageFx() {
  const mark = (e: Event) => {
    if (e.target instanceof HTMLImageElement) e.target.classList.add('is-loaded');
  };
  document.addEventListener('load', mark, true);
  document.addEventListener('error', mark, true);
}

const loadImage = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    img.onload = img.onerror = () => resolve();
    img.src = src;
  });

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// Holds the preloader until fonts and the page's hero photo are ready (at least a short beat, at most a few seconds)
export async function waitForCriticalAssets(images: string[]) {
  const assets = Promise.all([document.fonts?.ready, ...images.map(loadImage)]);
  await Promise.all([wait(reducedMotion() ? 0 : 900), Promise.race([assets, wait(3000)])]);
}

export function hidePreloader() {
  const el = document.getElementById('preloader');
  document.documentElement.classList.add('is-ready');
  if (!el) return;
  el.classList.add('is-done');
  setTimeout(() => el.remove(), 900);
}

// Fades and lifts sections and grid items in as they scroll into view. Returns a cleanup function.
export function setupReveal(root: HTMLElement) {
  if (reducedMotion() || !('IntersectionObserver' in window)) return () => {};

  const targets: HTMLElement[] = [];
  root.querySelectorAll<HTMLElement>('section').forEach((section, i) => {
    // The first section is the page hero: it has its own entrance animation
    if (i > 0) targets.push(section);
    section.querySelectorAll<HTMLElement>('.grid').forEach((grid) => {
      const items = Array.from(grid.children) as HTMLElement[];
      if (items.length < 2 || items.length > 12) return;
      items.forEach((item, idx) => {
        item.style.setProperty('--reveal-delay', `${Math.min(idx, 6) * 90}ms`);
        targets.push(item);
      });
    });
  });

  const done = (e: AnimationEvent) => {
    const el = e.currentTarget as HTMLElement;
    if (e.target !== el) return;
    // Drop the classes once finished so the element's own hover transforms work again
    el.classList.remove('reveal', 'is-visible');
    el.style.removeProperty('--reveal-delay');
    el.removeEventListener('animationend', done);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );

  targets.forEach((el) => {
    el.classList.add('reveal');
    el.addEventListener('animationend', done);
    observer.observe(el);
  });

  return () => {
    observer.disconnect();
    targets.forEach((el) => {
      el.classList.remove('reveal', 'is-visible');
      el.removeEventListener('animationend', done);
    });
  };
}

// Thin bar at the top of the window showing how far down the page you are
export function initScrollProgress() {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let frame = 0;
  const update = () => {
    frame = 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  update();
}
