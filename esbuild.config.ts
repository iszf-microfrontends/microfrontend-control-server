import { rm } from 'fs/promises';
import * as path from 'path';

import dotenv from 'dotenv';
import esbuild from 'esbuild';

const envFile = dotenv.config().parsed;

const resolveRoot = (...segments: string[]): string => path.resolve(__dirname, ...segments);

const clean: esbuild.Plugin = {
  name: 'Clean',
  setup: (build) => {
    build.onStart(async () => {
      const outdir = build.initialOptions.outdir;
      if (outdir) {
        await rm(outdir, { recursive: true });
      }
    });
  },
};

// eslint-disable-next-line @typescript-eslint/no-floating-promises
esbuild
  .build({
    platform: 'node',
    entryPoints: [resolveRoot('src/index.ts')],
    outdir: resolveRoot('dist'),
    bundle: true,
    minify: true,
    tsconfig: resolveRoot('tsconfig.json'),
    plugins: [clean],
    define: {
      'process.env': JSON.stringify(envFile),
    },
    alias: {
      '~': resolveRoot('src'),
    },
  })
  .then((r) => {
    console.log('Build succeeded.');
  })
  .catch((e) => {
    console.log('Error building:', e.message);
    process.exit(1);
  });
