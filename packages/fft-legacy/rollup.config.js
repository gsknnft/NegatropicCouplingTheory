import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
  input: 'src/index.ts',
  output: [
    { file: 'dist/esm/index.js', format: 'esm', sourcemap: true },
    { file: 'dist/cjs/index.cjs', format: 'cjs', sourcemap: true }
  ],
  plugins: [
    nodeResolve(),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json',
      outDir: 'dist', // Ensures output goes to dist
      compilerOptions: {
        declaration: false,
        declarationMap: false
      }
      // declarationDir removed for compatibility
    })
  ],
  external: [], // add external dependencies here
};
