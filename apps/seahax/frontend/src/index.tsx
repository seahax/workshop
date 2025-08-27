import './init/sentry.ts';
import './init/fonts.ts';

import { createRoot } from 'react-dom/client';

import App from './components/app.tsx';

createRoot(document.querySelector('#app')!).render(<App />);
