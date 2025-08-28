import { useCallback, useEffect, useRef } from 'react';

export default function useWindowResize(callback: () => void): void {
  const callbackRef = useRef(callback);
  const onResize = useCallback(() => {
    callbackRef.current();
  }, []);

  callbackRef.current = callback;

  useEffect(() => {
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [onResize]);
}
