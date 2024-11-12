import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

const element = document.createElement('div');
const root = createRoot(element);

document.body.append(element);
root.render(
  <StrictMode>
    <div>Hello, world!</div>
  </StrictMode>,
);
