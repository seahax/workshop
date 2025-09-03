export function rgbToCss(r: number, g: number, b: number, a = 1): string {
  return `rgb(${r},${g},${b},${a})`;
}

export function hslToRgb(h: number, s: number, l: number): [r: number, g: number, b: number] {
  s = toMagnitude(s, 100);
  l = toMagnitude(l, 100);

  const a = s * Math.min(l, 1 - l);
  const hueToChannel = (channel: number): number => {
    const k = ((channel * 4) + h / 30) % 12;
    return Math.round((l - (a * Math.max(Math.min(k - 3, 9 - k, 1), -1))) * 255);
  };

  return [hueToChannel(0), hueToChannel(2), hueToChannel(1)];
}

function toMagnitude(value: number, range: number): number {
  value = (value / range) % range;
  return value >= 0 ? value : value + 1;
}
