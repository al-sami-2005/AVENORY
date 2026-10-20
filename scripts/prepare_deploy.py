#!/usr/bin/env python3
"""Build and bundle the clean, production-only distribution for Cloudflare Pages.
Excludes all internal documentation, test suites, SQL migration scripts, and virtualenv files.
"""
import shutil, zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / 'dist'

PUBLIC_FILES = [
    'index.html',
    'app.js',
    'cloud-config.js',
    'styles.css',
    'vowmera.css',
    'edition-five.css',
    'manifest.webmanifest',
    'sw.js',
]

def bundle():
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True, exist_ok=True)

    print("Copying public assets to dist/...")
    for f in PUBLIC_FILES:
        src = ROOT / f
        dst = DIST / f
        shutil.copy2(src, dst)
        print(f"  + {f} ({src.stat().st_size} bytes)")

    # Assets folder
    assets_src = ROOT / 'assets'
    assets_dst = DIST / 'assets'
    shutil.copytree(assets_src, assets_dst)
    print(f"  + assets/ ({len(list(assets_dst.iterdir()))} items)")

    # Create Cloudflare Pages Direct Upload ZIP
    for zip_name in ('avenory-cloudflare-pages.zip', 'vowmera-v5-cloudflare-pages.zip'):
        zip_path = ROOT / zip_name
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as z:
            for file in DIST.rglob('*'):
                arcname = file.relative_to(DIST)
                z.write(file, arcname)
        print(f"\nCreated clean deployment zip: {zip_path.name} ({zip_path.stat().st_size} bytes)")
    print("Files included:")
    with zipfile.ZipFile(ROOT / 'avenory-cloudflare-pages.zip', 'r') as z:
        for info in z.infolist():
            print(f"  - {info.filename}")

if __name__ == '__main__':
    bundle()
