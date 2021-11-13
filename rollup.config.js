import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'dist/cjs/index.js',
  output: [
    {
      name: 'ClassTransformer',
      format: 'umd',
      file: 'dist/bundles/class-transformer.umd.js',
      sourcemap: true,
    },
    {
      name: 'ClassTransformer',
      format: 'umd',
      file: 'dist/bundles/class-transformer.umd.min.js',
      sourcemap: true,
      plugins: [terser()],
    },
  ],
  plugins: [commonjs(), nodeResolve()],
};
