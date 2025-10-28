import type { JSX } from 'react';

export default function BadgeNpm({ packageName }: { packageName: string }): JSX.Element {
  return (
    <img
      alt="NPM Version"
      src={`https://img.shields.io/npm/v/${packageName}?style=for-the-badge&logo=npm&label=version&labelColor=gray&color=%23bc3433`}
    />
  );
}
