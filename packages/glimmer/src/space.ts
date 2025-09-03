import type { Particle } from './particle.ts';

/**
 * Unbounded sparse 2D matrix, implemented as a tree, used to do spacial
 * point lookups.
 */
export interface Space<TParticle extends Particle> {
  add(particle: TParticle): void;
  delete(particle: TParticle): void;
  find(x: number, y: number, range: number): SpaceFindResult<TParticle>[];
}

export interface SpaceOptions {
  readonly divisionSize: number;
  readonly xMin: number;
  readonly xMax: number;
  readonly yMin: number;
  readonly yMax: number;
}

export interface SpaceFindResult<TParticle extends Particle> {
  readonly particle: TParticle;
  readonly distance: number;
}

interface XNode<X extends number, TParticle extends Particle> {
  readonly xKey: X;
  readonly yNodes: {
    [Y in number]: YNode<X, Y, TParticle>;
  };
  count: number;
}

interface YNode<X extends number, Y extends number, TParticle extends Particle> {
  readonly xNode: XNode<X, TParticle>;
  readonly xKey: X;
  readonly yKey: Y;
  readonly particles: Set<TParticle>;
}

export function createSpace<TParticle extends Particle>({
  divisionSize, xMin, xMax, yMin, yMax,
}: SpaceOptions): Space<TParticle> {
  const xNodes: { [P in number]: XNode<P, TParticle> } = Object.create(null);
  const yNodes = new Map<TParticle, YNode<number, number, TParticle>>();

  return {
    add(particle) {
      if (particle.position.x < xMin) return;
      if (particle.position.x > xMax) return;
      if (particle.position.y < yMin) return;
      if (particle.position.y > yMax) return;

      const xKey = Math.floor(particle.position.x / divisionSize);
      const yKey = Math.floor(particle.position.y / divisionSize);
      let yNode = yNodes.get(particle);

      if (yNode) {
        if (yNode.xKey === xKey && yNode.yKey === yKey) {
          return;
        }

        treeRemove(yNode, particle);
      }

      const xNode = (xNodes[xKey] ??= { xKey, yNodes: Object.create(null), count: 0 });

      yNode = xNode.yNodes[yKey];

      if (!yNode) {
        yNode = xNode.yNodes[yKey] = { xNode, xKey, yKey, particles: new Set() };
        xNode.count += 1;
      }

      yNode.particles.add(particle);
      yNodes.set(particle, yNode);
    },

    delete(particle) {
      const yNode = yNodes.get(particle);

      if (yNode) {
        yNodes.delete(particle);
        treeRemove(yNode, particle);
      }
    },

    find(x, y, range) {
      const found: SpaceFindResult<TParticle>[] = [];
      const keyRadius = Math.ceil(range / divisionSize);
      const keyRadiusRange = Math.hypot(keyRadius, keyRadius);
      const xKeyCenter = Math.floor(x / divisionSize);
      const yKeyCenter = Math.floor(y / divisionSize);
      const xKeyMin = xKeyCenter - keyRadius;
      const xKeyMax = xKeyCenter + keyRadius;
      const yKeyMin = yKeyCenter - keyRadius;
      const yKeyMax = yKeyCenter + keyRadius;

      for (let xKey = xKeyMin; xKey <= xKeyMax; ++xKey) {
        const xNode = xNodes[xKey];

        if (!xNode) continue;

        for (let yKey = yKeyMin; yKey <= yKeyMax; ++yKey) {
          if (Math.hypot(xKeyCenter - xKey, yKeyCenter - yKey) > keyRadiusRange) continue;

          const yNode = xNode.yNodes[yKey];

          if (!yNode) continue;

          yNode.particles.forEach((particle) => {
            const distance = Math.hypot(x - particle.position.x, y - particle.position.y);

            if (distance <= range) {
              found.push({ particle, distance });
            }
          });
        }
      }

      return found;
    },
  };

  function treeRemove(yNode: YNode<number, number, TParticle>, particle: TParticle): void {
    yNode.particles.delete(particle);

    if (yNode.particles.size === 0) {
      const xNode = yNode.xNode;

      delete xNode.yNodes[yNode.yKey];
      xNode.count -= 1;

      if (xNode.count <= 0) {
        delete xNodes[xNode.xKey];
      }
    }
  }
}
