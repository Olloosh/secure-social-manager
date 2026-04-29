const fs   = require('fs');
const path = require('path');
const { minify } = require('terser');

const dist = path.join(__dirname, 'dist');
fs.mkdirSync(dist, { recursive: true });

// Copy static files as-is
['index.html', 'index.css'].forEach(f =>
  fs.copyFileSync(path.join(__dirname, f), path.join(dist, f))
);

// Inject env vars (fallback to defaults so build works without env vars set)
const TG_BOT_USERNAME = process.env.TG_BOT_USERNAME || 'securesocialmanager_bot';
const TG_BOT_ID       = process.env.TG_BOT_ID       || '8506396231';
const FB_APP_ID       = process.env.FB_APP_ID        || '1487980476353532';

let oauthSrc = fs.readFileSync('oauth-config.js', 'utf8');
oauthSrc = oauthSrc
  .replace(/__TELEGRAM_BOT_USERNAME__/g, TG_BOT_USERNAME)
  .replace(/__TELEGRAM_BOT_ID__/g,       TG_BOT_ID)
  .replace(/__FACEBOOK_APP_ID__/g,        FB_APP_ID);

// Minify JS files
async function build() {
  const terserOpts = {
    compress: { passes: 2, drop_console: true, drop_debugger: true },
    mangle:   { toplevel: true },
    format:   { comments: false },
  };

  const [appResult, oauthResult] = await Promise.all([
    minify(fs.readFileSync('app.js', 'utf8'), terserOpts),
    minify(oauthSrc, terserOpts),
  ]);

  if (appResult.error)   throw appResult.error;
  if (oauthResult.error) throw oauthResult.error;

  fs.writeFileSync(path.join(dist, 'app.js'),          appResult.code);
  fs.writeFileSync(path.join(dist, 'oauth-config.js'), oauthResult.code);

  const appKb    = (appResult.code.length   / 1024).toFixed(1);
  const oauthKb  = (oauthResult.code.length / 1024).toFixed(1);
  console.log(`Build complete → dist/  |  app.js: ${appKb}KB  |  oauth-config.js: ${oauthKb}KB`);
}

build().catch(e => { console.error(e); process.exit(1); });
