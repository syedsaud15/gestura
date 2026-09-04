process.env.NODE_ENV = 'production';
const { createBuilder } = await import('vite');
const { runPrerender } = await import('vinext/internal/build/run-prerender');
const { emitPrerenderPathManifest } = await import('vinext/internal/build/prerender-paths');
const { loadNextConfig, resolveNextConfig } = await import('vinext/internal/config/next-config');
// Native config loading avoids shell-based Windows network-drive discovery
// during config bundling. The app still uses the standard Vinext build pipeline.
const builder = await createBuilder({ configLoader: 'native' });
await builder.buildApp();
const root = process.cwd();
const nextConfig = await resolveNextConfig(await loadNextConfig(root, 'phase-production-build'), root);
const result = await runPrerender({ root, nextConfig, concurrency: 1 });
if (!result || result.routes.some(route => route.status === 'error') || !result.routes.some(route => route.route === '/' && route.status === 'rendered')) throw new Error('Static home page generation failed.');
await emitPrerenderPathManifest({ root, nextConfig });
console.log('Reality Composer production build complete.');
