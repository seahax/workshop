export interface Project {
  type: 'npm' | 'go';
  name: string;
  shortName: string;
  description: string;
  homepage: string;
}

export default __PROJECTS__;

declare const __PROJECTS__: readonly Project[];
