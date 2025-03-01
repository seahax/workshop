import type { Action } from './store/action.ts';

export function getVerb(looseAction: string): Action['type'] | undefined {
  switch (looseAction.toLocaleLowerCase()) {
    case 'select':
    case 'choose':
    case 'focus': { return 'select'; }
    case 'open': { return 'open'; }
    case 'close': { return 'close'; }
    case 'use':
    case 'activate': { return 'use'; }
    case 'take':
    case 'grab':
    case 'pick':
    case 'pickup': { return 'take'; }
    case 'go':
    case 'move':
    case 'walk':
    case 'climb': { return 'go'; }
    case 'look': { return 'look'; }
    case 'inspect':
    case 'describe': { return 'inspect'; }
    case 'cast': { return 'cast'; }
    default: { return undefined; }
  }
}
