export type HorizontalDirection = typeof HORIZONTAL_DIRECTIONS[number];
export type VerticalDirection = typeof VERTICAL_DIRECTIONS[number];
export type Direction = typeof DIRECTIONS[number];

export const HORIZONTAL_DIRECTIONS = [
  'North',
  'North East',
  'East',
  'South East',
  'South',
  'South West',
  'West',
  'North West',
] as const;

export const VERTICAL_DIRECTIONS = [
  'up',
  'down',
] as const;

export const DIRECTIONS = [...HORIZONTAL_DIRECTIONS, ...VERTICAL_DIRECTIONS] as const;

export function getDirection(directionString: string): Direction | undefined {
  switch (directionString.toLocaleLowerCase()) {
    case 'n':
    case 'north': { return 'North'; }
    case 'ne':
    case 'north east': { return 'North East'; }
    case 'e':
    case 'east': { return 'East'; }
    case 'se':
    case 'south east': { return 'South East'; }
    case 's':
    case 'south': { return 'South'; }
    case 'sw':
    case 'south west': { return 'South West'; }
    case 'w':
    case 'west': { return 'West'; }
    case 'nw':
    case 'north west': { return 'North West'; }
    default: { return undefined; }
  }
}
