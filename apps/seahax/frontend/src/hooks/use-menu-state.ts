import useBoolean from './use-boolean.ts';
import useWindowResize from './use-window-resize.ts';

interface MenuState {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
}

export function useMenuState(): MenuState {
  const { value: isOpen, setTrue: open, setFalse: close, toggle } = useBoolean();
  useWindowResize(close);
  return { isOpen, open, close, toggle };
}
