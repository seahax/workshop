import { useEffect } from 'react';

export default function useWindowResize(callback: () => void): void {
  useEffect(() => {
    window.addEventListener('resize', callback);
    return () => window.removeEventListener('resize', callback);
  }, [callback]);
}
