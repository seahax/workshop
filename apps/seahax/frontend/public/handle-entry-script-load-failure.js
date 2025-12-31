// @ts-nocheck
(() => {
  const ENTRY_SRC_ON_ERROR = 'entrySrcOnError';

  // The entry script is expected to be the first external module script after
  // the title.
  window.document.querySelector(
    'head > title ~ script[type="module"][src]',
  ).addEventListener('error', (event) => {
    // The entry script failed to load. This can happen if the tab is
    // revived/restored or when navigating to the page through history. In
    // these cases, the HTML can be loaded from cache and contain references to
    // scripts which no longer exist after a new deployment.

    if (window.sessionStorage.getItem(ENTRY_SRC_ON_ERROR) === event.target.src) {
      // Don't get into a reload loop if the entry script is genuinely missing.
      return;
    }

    window.sessionStorage.setItem(ENTRY_SRC_ON_ERROR, event.target.src);
    window.location.reload();
  });
})();
