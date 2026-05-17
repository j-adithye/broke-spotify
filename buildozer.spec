[app]

# ── Identity ──
title        = Swave
package.name = swave
package.domain = org.swave

# ── Source ──
source.dir  = .
source.include_exts = py,png,jpg,jpeg,gif,kv,atlas,html,css,js,db,json,ttf,otf

# Include all your app folders
source.include_patterns = \
    templates/*.html,\
    static/*.css,\
    static/*.js

# ── Version ──
version = 1.0

# ── Dependencies ──
# All pure-Python — no native compilation issues
requirements = \
    python3,\
    kivy,\
    flask,\
    flask-sqlalchemy,\
    sqlalchemy,\
    requests,\
    ytmusicapi,\
    yt-dlp,\
    pytubefix,\
    urllib3,\
    certifi,\
    charset-normalizer,\
    click,\
    werkzeug,\
    jinja2,\
    markupsafe,\
    itsdangerous,\
    blinker

# ── Android settings ──
android.permissions  = INTERNET, ACCESS_NETWORK_STATE
android.api          = 33
android.minapi       = 21
android.ndk          = 25b
android.arch         = arm64-v8a

# Enable AndroidX (required for modern Android)
android.enable_androidx = True

# ── Orientation ──
orientation = portrait

# ── Fullscreen ──
fullscreen = 0

# ── Icon / Presplash (optional — add your own) ──
# icon.filename     = %(source.dir)s/static/icon.png
# presplash.filename = %(source.dir)s/static/splash.png

# ── Build ──
[buildozer]
log_level = 2
warn_on_root = 1
