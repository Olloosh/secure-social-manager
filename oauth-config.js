/* ─────────────────────────────────────────────────────────────
   OAuth credentials — FILL THESE IN.
   ─────────────────────────────────────────────────────────────
   1) TELEGRAM_BOT_USERNAME
      • Open Telegram → @BotFather → /newbot → copy the bot's
        username (NOT the token). Example: "MySSM_bot".
      • Then in @BotFather: /setdomain → choose your bot → enter
        the domain that will serve this site (e.g. "gramir.uz").
        Telegram Login Widget works ONLY on that exact domain;
        it does NOT work on file:// or on a domain that wasn't
        registered.
   2) FACEBOOK_APP_ID
      • developers.facebook.com → My Apps → Create App
        → "Business" → add the "Facebook Login" + "Instagram"
        products. Copy the App ID shown at the top.
      • Under Facebook Login → Settings, add your site URL to
        "Valid OAuth Redirect URIs" and add the domain under
        App Settings → Basic → App Domains.
      • Instagram account MUST be a Business/Creator account
        linked to a Facebook Page (Meta requirement).
   ───────────────────────────────────────────────────────────── */
window.OAUTH_CONFIG = {
  TELEGRAM_BOT_USERNAME: 'securesocialmanager_bot',
  FACEBOOK_APP_ID:       '1487980476353532',  // Social Manager app

  // Permissions we ask for. Leave as-is unless you know why
  // you are changing them. Full posting access is gated behind
  // Meta App Review; until your app is reviewed, only admins/
  // developers/testers of the app can grant these.
  // Demo-time defaults: only "public_profile" is granted out-of-the-box in
  // Development Mode. Anything beyond it (email, pages_*, instagram_*) needs
  // to be explicitly added in the Meta dashboard:
  //   Use cases → Customize → Permissions → Request.
  // Advanced permissions require App Review before non-admin users can grant
  // them. Kept scopes minimal so the OAuth dialog opens cleanly for admins.
  FACEBOOK_SCOPES:  'public_profile',
  INSTAGRAM_SCOPES: 'public_profile',
};
