import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
    input: 'src/index.ts',
    output: [
        {
            file: 'dist/icw.esm.js',
            format: 'esm',
            sourcemap: true
        },
        {
            file: 'dist/icw.umd.min.js',
            format: 'umd',
            name: 'ProtechtICW',
            plugins: [terser()]
        }
    ],
    plugins: [
        typescript(),
        resolve({ extensions: ['.js', '.ts'] }),
        commonjs()
    ]
};