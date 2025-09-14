export function getDefaultTagSuffix(): string {
  return new Date().toISOString().replaceAll(/[-:]|\.\d{3}(?=Z$)/gu, '');
}
