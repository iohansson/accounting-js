/* eslint no-var: 0 */
import { readFileSync } from 'fs';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';

var pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

export default {
  input: pkg['jsnext:main'],
  plugins: [
    commonjs({
      include: 'node_modules/**'
    }),
    babel({
      exclude: 'node_modules/**'
    })
  ]
};
