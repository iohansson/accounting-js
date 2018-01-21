/* eslint no-var: 0 */
import { readFileSync } from 'fs';
import nodeResolve from 'rollup-plugin-node-resolve';
import config from './rollup.config';

var pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

config.plugins.unshift(nodeResolve({
  jsnext: true,
  main: true,
  browser: true,
  extensions: ['.js']
}));

config.output = [
  {
    format: 'umd',
    sourcemap: true,
    file: pkg.main,
    name: 'accounting'
  },
  {
    format: 'es',
    sourcemap: true,
    file: pkg.module,
    name: 'accounting'
  }
];

export default config;
