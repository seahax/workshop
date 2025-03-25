import { authClient } from './clients.ts';

document.querySelector('#app')!.textContent = 'Hello, Seahax!';

const response = await authClient.login({ body: { email: 'admin@example.com', password: 'password123' } });
void response;
