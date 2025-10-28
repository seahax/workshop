import type { JSX } from 'react';

export default function BadgeGo({ tagPrefix }: { tagPrefix: string }): JSX.Element {
  return (
    <img
      alt="Go Tag"
      src={`https://img.shields.io/github/v/tag/seahax/workshop?sort=semver&filter=${tagPrefix}/v*&style=for-the-badge&logo=go&labelColor=gray`}
    />
  );
}
