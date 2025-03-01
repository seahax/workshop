import chalk from 'chalk';

export const style = {
  h1: chalk.bold.underline,
  h2: chalk.bold,
  key: chalk.bold.inverse,
  cmd: (text: string): string => chalk.green(`"${text}"`),
};
