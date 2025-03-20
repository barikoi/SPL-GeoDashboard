#!/bin/sh

echo "Check that we have NEXT_PUBLIC_API_URL vars"

test -n "$NEXT_PUBLIC_BASE_URL"

test -n "$NEXT_PUBLIC_BARIKOI_API_KEY"

find /app/.next \( -type d -name .git -prune \) -o -type f -print0 | xargs -0 sed -i "s#NEXT_PUBLIC_BASE_URL#$NEXT_PUBLIC_BASE_URL#g"

find /app/.next \( -type d -name .git -prune \) -o -type f -print0 | xargs -0 sed -i "s#NEXT_PUBLIC_BARIKOI_API_KEY#$NEXT_PUBLIC_BARIKOI_API_KEY#g"

echo "Starting Nextjs"
exec "$@"