const Funnel = require("broccoli-funnel");
const Merge = require("broccoli-merge-trees");
const EsLint = require("broccoli-lint-eslint");
const SassLint = require("broccoli-sass-lint");
const CompileSass = require("broccoli-sass-source-maps");
const Rollup = require("broccoli-rollup");
const LiveReload = require('broccoli-livereload');
const CleanCss = require('broccoli-clean-css');
const log = require('broccoli-stew').log;
const replace = require('rollup-plugin-replace');
const AssetRev = require('broccoli-asset-rev');
const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify');
const env = require('broccoli-env').getEnv() || 'development';
const isProduction = env === 'production';

// Status
console.log('Environment: ' + env);

const appRoot = "app";

// Copy HTML file from app root to destination
const html = new Funnel(appRoot, {
  files: ["index.html"],
  annotation: "Index file",
});

// Lint js files
let js = new EsLint(appRoot, {
  persist: true
});

// Compile JS through rollup
const rollupPlugins = [
  nodeResolve({
    jsnext: true,
    browser: true,
  }),
  commonjs({
    include: 'node_modules/**',
  }),
  babel({
    "presets": ["babel-preset-react"],
    exclude: 'node_modules/**',
  }),
  replace({
    'process.env.NODE_ENV': JSON.stringify( env )
  })
];

// Uglify the output for production
if (isProduction) {
  rollupPlugins.push(uglify());
}

js = new Rollup(js, {
  inputFiles: ['**/*.js'],
  rollup: {
    input: 'app.js',
    output: {
      file: 'assets/app.js',
      format: 'es',
      sourcemap: !isProduction,
    },
    plugins: rollupPlugins,
  }
});

// Lint css files
let css = new SassLint(appRoot + '/styles', {
  disableTestGenerator: true,
});

// Copy CSS file into assets
css = new CompileSass(
  [css],
  "app.scss",
  "assets/app.css",
  {
    sourceMap: !isProduction,
    sourceMapContents: true,
    annotation: "Sass files"
  }
);

// Compress our CSS
if (isProduction) {
  css = new CleanCss(css);
}

// Copy public files into destination
const publicFiles = new Funnel("public", {
  annotation: "Public files",
});

// Remove the existing module.exports and replace with:
let tree = new Merge([html, js, css, publicFiles], {annotation: "Final output"});

// Include asset hashes
if (isProduction) {
  tree = new AssetRev(tree);
} else {
  tree = new LiveReload(tree, {
    target: 'index.html',
  });
}

// Log the output tree
tree = log(tree, {
  output: 'tree',
});

module.exports = tree;
