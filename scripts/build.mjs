import { build } from 'esbuild';

await build({
  entryPoints: {
    index: 'index.ts',
    'policy-lab': 'policy-lab.ts',
    'lab-exports': 'src/lab-exports.ts',
  },
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  external: ['@earendil-works/pi-coding-agent'],
  legalComments: 'inline',
});
