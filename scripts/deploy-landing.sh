#!/bin/bash
# Deploy the landing page (index.html) and the public privacy policy (privacy.md) to the VPS.
# The VPS serves ~/workspace/shopeestatx/public through nginx behind Cloudflare Tunnel (shopeestatx.ninhhaidang.com).
set -euo pipefail
cd "$(dirname "$0")/.."

HOST="${DEPLOY_HOST:-ninhhaidang@100.103.170.97}"
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

mkdir -p "$OUT/store-assets/screenshots" "$OUT/src/icons"
cp index.html "$OUT/"
cp -R site "$OUT/"
cp store-assets/screenshots/*.png "$OUT/store-assets/screenshots/"
cp src/icons/icon48.png src/icons/icon128.png "$OUT/src/icons/"

# privacy.md rendered by GitHub's Markdown API (the repo already lives there).
body="$(gh api markdown -f mode=gfm -F text=@privacy.md)"
cat > "$OUT/privacy.html" <<EOF
<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Chính sách bảo mật – ShopeeStatX</title>
  <link rel="icon" href="src/icons/icon48.png">
  <style>
    @font-face { font-family: "Be Vietnam Pro"; font-weight: 400; src: url(site/fonts/be-vietnam-pro-vietnamese-400-normal.woff2) format("woff2"); unicode-range: U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB; }
    @font-face { font-family: "Be Vietnam Pro"; font-weight: 400; src: url(site/fonts/be-vietnam-pro-latin-400-normal.woff2) format("woff2"); }
    @font-face { font-family: "Be Vietnam Pro"; font-weight: 800; src: url(site/fonts/be-vietnam-pro-vietnamese-800-normal.woff2) format("woff2"); unicode-range: U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB; }
    @font-face { font-family: "Be Vietnam Pro"; font-weight: 800; src: url(site/fonts/be-vietnam-pro-latin-800-normal.woff2) format("woff2"); }
    body { margin: 0; background: #f3f3f1; color: #1d1a19; font: 400 17px/1.65 "Be Vietnam Pro", system-ui, sans-serif; }
    main { width: min(760px, 100% - 32px); margin: 0 auto; padding: 32px 0 64px; }
    .home { display: inline-flex; align-items: center; gap: 10px; font-weight: 800; color: #c2371b; text-decoration: none; margin-bottom: 32px; }
    .home img { width: 28px; height: 28px; border-radius: 7px; }
    h1 { font-size: clamp(32px, 5vw, 44px); line-height: 1.1; letter-spacing: -.03em; margin: 0 0 8px; }
    h2 { font-size: 22px; margin: 40px 0 10px; }
    p, li { color: #3f3a38; }
    a { color: #c2371b; }
    code { font-size: .9em; background: #fff; padding: 1px 5px; border-radius: 4px; }
    table { border-collapse: collapse; width: 100%; font-size: 15px; display: block; overflow-x: auto; }
    th, td { text-align: left; vertical-align: top; padding: 10px 12px; border-top: 1px solid #e1dfdc; }
    .anchor { display: none; }
    hr { border: 0; border-top: 1px solid #e1dfdc; margin: 40px 0 16px; }
  </style>
</head>
<body>
  <main>
    <a class="home" href="./"><img src="src/icons/icon128.png" alt="">ShopeeStatX</a>
$body
  </main>
</body>
</html>
EOF

chmod -R a+rX "$OUT"  # mktemp makes the dir 0700; nginx in the container reads as another user
rsync -az --delete "$OUT/" "$HOST:~/workspace/shopeestatx/public/"
echo "Deployed to $HOST:~/workspace/shopeestatx/public"
