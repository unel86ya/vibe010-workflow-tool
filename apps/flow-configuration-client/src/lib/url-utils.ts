export function joinUrl(base: string, ...paths: string[]): string {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanPaths = paths
    .filter(Boolean)
    .map(path => path.replace(/^\/+|\/+$/g, ''));
  if (!cleanPaths.length) return cleanBase;
  return `${cleanBase}/${cleanPaths.join('/')}`;
}
