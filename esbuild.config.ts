import { rm } from 'fs/promises';
import * as path from 'path';

import dotenv from 'dotenv';
import esbuild from 'esbuild';

const envConfig = dotenv.config().parsed;

const resolveRoot = (...segments: string[]): string => path.resolve(__dirname, ...segments);

const clean: esbuild.Plugin = {
  name: 'Clean',
  setup: (build) => {
    build.onStart(async () => {
      try {
        const outdir = build.initialOptions.outdir;
        if (outdir) {
          await rm(outdir, { recursive: true });
        }
      } catch (error) {
        if ((error as { code: string }).code !== 'ENOENT') {
          throw error;
        }
      }
    });
  },
};

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
      'process.env': JSON.stringify(envConfig),
    },
    alias: {
      '~': resolveRoot('src'),
    },
  })
  .then(() => {
    console.log('Build succeeded');
  })
  .catch((error) => {
    console.log(error);
    process.exit(1);
  });
