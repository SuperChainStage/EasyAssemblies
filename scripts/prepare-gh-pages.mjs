import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';

const outputDir = resolve(process.cwd(), process.argv[2] ?? 'docs');
const indexHtmlPath = join(outputDir, 'index.html');
const nestedRoutesPath = join(outputDir, 'nestedRoutes.json');

function toPathSegments(routePath) {
  if (!routePath || routePath === '/') {
    return [];
  }

  return routePath.split('/').filter(Boolean);
}

function isStaticRoute(segments) {
  return segments.every(
    segment =>
      !segment.includes(':') &&
      !segment.includes('*') &&
      !segment.includes('?'),
  );
}

function getChildBaseSegments(parentSegments, routePath) {
  const nextSegments = toPathSegments(routePath);

  if (routePath?.startsWith('/')) {
    return nextSegments;
  }

  return [...parentSegments, ...nextSegments];
}

function collectStaticPageRoutes(
  routeNode,
  parentSegments = [],
  routes = new Set(),
) {
  const routePath = typeof routeNode.path === 'string' ? routeNode.path : '';
  const childBaseSegments = getChildBaseSegments(parentSegments, routePath);
  const pageSegments = routeNode.index ? parentSegments : childBaseSegments;

  if (routeNode.routeType === 'page' && isStaticRoute(pageSegments)) {
    routes.add(pageSegments.length === 0 ? '/' : `/${pageSegments.join('/')}`);
  }

  for (const childRoute of routeNode.children ?? []) {
    collectStaticPageRoutes(childRoute, childBaseSegments, routes);
  }

  return routes;
}

async function writeRouteShell(outputPath, html) {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html);
}

async function main() {
  const [indexHtml, nestedRoutesJson] = await Promise.all([
    readFile(indexHtmlPath, 'utf8'),
    readFile(nestedRoutesPath, 'utf8'),
  ]);

  const nestedRoutes = JSON.parse(nestedRoutesJson);
  const staticRoutes = new Set(['/']);

  for (const entryRoutes of Object.values(nestedRoutes)) {
    for (const routeNode of entryRoutes) {
      collectStaticPageRoutes(routeNode, [], staticRoutes);
    }
  }

  const shellRoutes = [...staticRoutes]
    .filter(route => route !== '/')
    .sort((left, right) => left.localeCompare(right));

  await Promise.all([
    writeFile(join(outputDir, '404.html'), indexHtml),
    writeFile(join(outputDir, '.nojekyll'), ''),
  ]);

  for (const route of shellRoutes) {
    const shellPath = join(outputDir, route.slice(1), 'index.html');
    await writeRouteShell(shellPath, indexHtml);
  }

  console.log(`Prepared GitHub Pages shells in ${outputDir}`);
  console.log('  Added: 404.html, .nojekyll');

  if (shellRoutes.length === 0) {
    console.log('  No additional static route shells were needed.');
    return;
  }

  console.log(`  Added route shells for: ${shellRoutes.join(', ')}`);
}

main().catch(error => {
  console.error('Failed to prepare GitHub Pages output.');
  console.error(error);
  process.exit(1);
});
