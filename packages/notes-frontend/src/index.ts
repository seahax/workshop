import './index.css';

import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './components/app.jsx';

const element = document.querySelector('#app')!;
const root = createRoot(element);
const children = createElement(App);

root.render(children);
