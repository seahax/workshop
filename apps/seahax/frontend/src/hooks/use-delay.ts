import { useEffect, useRef, useState } from 'react';

export function useDelay<T>(initialValue: T, currentValue: T, delay: number | ((value: T) => number)): T {
  const [value, setValue] = useState<T>(initialValue);
  const initialized = useRef(initialValue !== currentValue);
  const timeoutRef = useRef<number | undefined>(undefined);
  const delayRef = useRef(delay);

  useEffect(() => {
    delayRef.current = delay;
  }, [delay]);

  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      return;
    }

    const delay = typeof delayRef.current === 'number' ? delayRef.current : delayRef.current(currentValue);
    console.log(delay, currentValue);

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        setValue(currentValue);
      }, delay);
    }
    else {
      setValue(currentValue);
    }

    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, [currentValue]);

  return value;
}
