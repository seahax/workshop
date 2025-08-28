import './init/sentry.ts';
import './init/fonts.ts';

import { createRoot } from 'react-dom/client';

import AppRoot from './components/app-root.tsx';

createRoot(document.querySelector('#app')!).render(<AppRoot />);
