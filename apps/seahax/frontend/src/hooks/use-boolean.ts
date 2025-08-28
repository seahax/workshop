import { useCallback, useState } from 'react';

interface BooleanHook {
  value: boolean;
  setTrue: () => void;
  setFalse: () => void;
  toggle: () => void;
}

export default function useBoolean(initializer: boolean | (() => boolean) = false): BooleanHook {
  const [value, setValue] = useState<boolean>(initializer);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((prev) => !prev), []);

  return { value, setTrue, setFalse, toggle };
}
