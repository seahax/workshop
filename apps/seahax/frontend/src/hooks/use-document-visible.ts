import { useEffect, useState } from 'react';

export function useDocumentVisible(): boolean {
  const [isDocumentVisible, setDocumentVisible] = useState(!window.document.hidden);

  useEffect(() => {
    const change = (): void => setDocumentVisible(!window.document.hidden);
    window.document.addEventListener('visibilitychange', change);
    return () => window.document.removeEventListener('visibilitychange', change);
  });

  return isDocumentVisible;
}
