import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { IMAGES } from './data/surfData';
import { hidePreloader, initImageFx, initScrollProgress, waitForCriticalAssets } from './utils/effects';

initImageFx();

// The photo at the top of the page being opened, so it is ready when the preloader lifts
const HERO_FOR_PATH: Record<string, string> = {
  rates: IMAGES.ratesHero,
  activities: IMAGES.activitiesHero,
  camp: IMAGES.campHero,
  blog: IMAGES.blogHero,
  contact: IMAGES.contactHero,
};
const firstSegment = window.location.pathname.slice(import.meta.env.BASE_URL.length).split('/')[0];
const heroImage = firstSegment ? HERO_FOR_PATH[firstSegment] : IMAGES.homeHero;

waitForCriticalAssets(heroImage ? [heroImage] : []).then(() => {
  createRoot(document.getElementById('root')!).render(<App />);
  requestAnimationFrame(() => {
    hidePreloader();
    initScrollProgress();
  });
});
