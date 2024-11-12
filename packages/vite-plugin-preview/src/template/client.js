// XXX: The following line must stay exactly as-is so that the real base can be
// injected at runtime.
const base = '/';
const pingUrl = location.protocol + '//' + location.host + base;
const socketUrl = (location.protocol === 'https:' ? 'wss:' : 'ws:') + '//' + location.host + base;

function connect() {
  console.log('[vite] connecting...');

  const socket = new WebSocket(socketUrl);

  socket.addEventListener('open', () => {
    console.log('[vite] connected.');
  });

  socket.addEventListener('message', (event) => {
    try {
      const message = JSON.parse(event.data);

      if (message?.type === 'page-reload') {
        location.reload();
      }
    }
    catch {
      // ignored
    }
  });

  socket.addEventListener('close', (event) => {
    if (!event.wasClean) {
      // Only print this message when the server is down, not when a page
      // navigation occurs. Server down should be a non-clean close, and page
      // navigation should be clean cose.
      console.log('[vite] server connection lost. polling for restart...');
    }

    void reconnect();
  });
}

/**
 * Make repeating ping requests to the preview server to check if it is up,
 * with a delay between requests.
 */
async function reconnect() {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // Fetch should reject a networking error if the server is down.
      response = await fetch(pingUrl, {
        mode: 'no-cors',
        headers: {
          // Custom headers won't be included in a request with no-cors so
          // (ab)use one of the safe-listed headers to identify the ping request.
          Accept: 'text/x-vite-ping',
        },
      });

      if (response.ok) {
        location.reload();
        return;
      }
    }
    catch {
      // ping failed
    }
  }
}

connect();
