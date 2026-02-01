process.env.NODE_ENV = 'development';
process.env.BABEL_ENV = 'development';
const wp = require('react-scripts/config/webpack.config');
const cfg = wp('development');
const s = JSON.stringify(cfg.module.rules);
const idx = s.indexOf('postcss-loader');
console.log('postcss-loader in rules:', idx !== -1);
if (idx !== -1) {
  console.log(s.substring(Math.max(0, idx - 300), idx + 300));
}
