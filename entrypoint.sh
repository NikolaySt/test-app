#!/bin/sh
set -e

# ─────────────────────────────────────────────────────────────────────────────
# Runtime environment variable injection
#
# At build time, Vite bakes VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY into
# the JS bundle as literal strings (e.g. "YOUR_SUPABASE_URL").
#
# At container startup, this script replaces those placeholder strings with
# the real values provided via environment variables, allowing a single image
# to be deployed to multiple environments (staging, production, etc.)
# ─────────────────────────────────────────────────────────────────────────────

HTML_DIR="/usr/share/nginx/html"

echo "🔧 Injecting runtime environment variables..."

# Replace placeholder Supabase URL
if [ -n "$SUPABASE_URL" ]; then
  find "$HTML_DIR" -type f \( -name "*.js" -o -name "*.html" \) \
    -exec sed -i "s|YOUR_SUPABASE_URL|${SUPABASE_URL}|g" {} +
  echo "  ✓ SUPABASE_URL injected"
else
  echo "  ⚠ SUPABASE_URL not set — using build-time value"
fi

# Replace placeholder Supabase Anon Key
if [ -n "$SUPABASE_ANON_KEY" ]; then
  find "$HTML_DIR" -type f \( -name "*.js" -o -name "*.html" \) \
    -exec sed -i "s|YOUR_SUPABASE_ANON_KEY|${SUPABASE_ANON_KEY}|g" {} +
  echo "  ✓ SUPABASE_ANON_KEY injected"
else
  echo "  ⚠ SUPABASE_ANON_KEY not set — using build-time value"
fi

echo "🚀 Starting services..."

# Start nginx + Express via supervisord
exec /usr/bin/supervisord -c /etc/supervisord.conf