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
  TELEGRAM_BOT_USERNAME: '',                  // to be filled after @BotFather setup
  FACEBOOK_APP_ID:       '1487980476353532',  // Social Manager app

  // Permissions we ask for. Leave as-is unless you know why
  // you are changing them. Full posting access is gated behind
  // Meta App Review; until your app is reviewed, only admins/
  // developers/testers of the app can grant these.
  FACEBOOK_SCOPES:
    'public_profile,email,pages_show_list,pages_read_engagement,pages_manage_posts',
  INSTAGRAM_SCOPES:
    'public_profile,email,pages_show_list,instagram_basic,instagram_content_publish,pages_read_engagement',
};
