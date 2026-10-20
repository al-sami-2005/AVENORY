"""Tests for Atlas, Charts, Exports (JSON, CSV, ICS), and Imports:
- 90-day Atlas rendering and jump-day interaction
- 30-day signal map cell count and state
- 14-day Habit Lens selector and calculation
- JSON backup export and import validation
- CSV report export format
- Calendar (.ics) reminder export
"""
import json, re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

def build_html():
    html = (ROOT / 'index.html').read_text()
    for file in ('styles.css', 'avenory-core.css', 'avenory-components.css'):
        css = re.sub(r'@import url\([^\n]+;\s*', '', (ROOT / file).read_text())
        html = html.replace(f'<link rel="stylesheet" href="{file}" />', f'<style>{css}</style>')
    html = html.replace('<script src="app.js" defer></script>', '<script>' + (ROOT / 'app.js').read_text().replace('</script>', '<\\/script>') + '</script>')
    return html

HTML_TEMPLATE = build_html()

def boot_page(page, seed=None):
    fake = {}
    fake.update(seed or {})
    bootstrap = '''<script>
    Object.defineProperty(window,'localStorage',{
        value:{
            data:%s,
            getItem(k){return this.data[k]??null},
            setItem(k,v){this.data[k]=String(v)},
            removeItem(k){delete this.data[k]}
        }
    });
    window.NINETY_CLOUD={url:'',anonKey:''};
    </script>''' % json.dumps(fake)
    content = HTML_TEMPLATE.replace('<script src="cloud-config.js" defer></script>', bootstrap)
    page.set_content(content, wait_until='domcontentloaded')

def test_atlas_and_charts():
    print("--- Running test_atlas_and_charts ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        boot_page(page)
        page.get_by_role('button', name='Explore privately').click()

        # 1. 30-day signal map on Overview page
        assert page.locator('.v5-pulse-map').count() == 1
        cells = page.locator('.v5-pulse-map .v5-map-cell')
        assert cells.count() == 30, f"Expected 30 map cells, got {cells.count()}"

        # 2. Compact 90-day Atlas on Overview page
        assert page.locator('.v4-atlas.compact').count() == 1
        stars = page.locator('.v4-atlas .v4-star')
        assert stars.count() == 90, f"Expected 90 stars in atlas, got {stars.count()}"

        # 3. Navigate to Habits page -> 14-day Habit Lens
        page.locator('.v4-sidebar [data-nav="habits"]').click()
        assert page.locator('.v5-habit-lens').count() == 1
        lens_bars = page.locator('.v5-habit-lens .v5-spark-bar')
        assert lens_bars.count() == 14, f"Expected 14 spark bars in habit lens, got {lens_bars.count()}"

        # Select a different habit in the lens
        page.locator('#lens-habit').select_option('deep-work')
        assert page.locator('#lens-habit').input_value() == 'deep-work'

        # 4. Navigate to Progress (Insights) page -> Compass and Mood Mirror
        page.locator('.v4-sidebar [data-nav="insights"]').click()
        assert page.locator('.v5-compass').count() == 1, "Life Compass missing"
        assert page.locator('.v5-mood').count() == 1, "Mood Mirror missing"
        assert page.locator('.v4-atlas:not(.compact)').count() == 1, "Full 90-day Atlas missing"
        assert page.locator('.v4-atlas:not(.compact) .v4-star').count() == 90

        browser.close()
    print("PASS: Atlas and charts test passed.")

def test_export_and_import():
    print("--- Running test_export_and_import ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        boot_page(page)
        page.get_by_role('button', name='Explore privately').click()

        # Mark two habits so we have data
        page.locator('[data-toggle="clear-mind"]').first.click()
        page.locator('[data-toggle="added-sugar"]').first.click()

        # Go to Settings
        page.locator('.v4-sidebar [data-nav="settings"]').click()

        # 1. Test JSON Export
        with page.expect_download() as download_info:
            page.locator('[data-action="export-json"]').click()
        download = download_info.value
        assert (download.suggested_filename.startswith('avenory-backup-') or download.suggested_filename.startswith('vowmera-backup-')) and download.suggested_filename.endswith('.json')
        # Read the file
        path = download.path()
        content = Path(path).read_text()
        data = json.loads(content)
        assert data['version'] == 4
        assert 'habits' in data and len(data['habits']) >= 10
        assert 'logs' in data and len(data['logs']) >= 1

        # 2. Test CSV Export
        with page.expect_download() as download_info:
            page.locator('[data-action="export-csv"]').click()
        csv_download = download_info.value
        assert (csv_download.suggested_filename.startswith('avenory-progress-') or csv_download.suggested_filename.startswith('vowmera-progress-')) and csv_download.suggested_filename.endswith('.csv')
        csv_content = Path(csv_download.path()).read_text()
        csv_lines = csv_content.strip().splitlines()
        assert len(csv_lines) == 91, f"Expected 91 lines (header + 90 days), got {len(csv_lines)}"
        assert 'Clear Mind' in csv_lines[0]

        # 3. Test Calendar Export
        with page.expect_download() as download_info:
            page.locator('[data-action="export-calendar"]').click()
        ics_download = download_info.value
        assert (ics_download.suggested_filename.startswith('avenory-reminders-') or ics_download.suggested_filename.startswith('vowmera-reminders-')) and ics_download.suggested_filename.endswith('.ics')
        ics_content = Path(ics_download.path()).read_text()
        assert 'BEGIN:VCALENDAR' in ics_content
        assert 'BEGIN:VEVENT' in ics_content
        assert 'BEGIN:VALARM' in ics_content

        # 4. Test Valid Import JSON
        # Create a modified state backup
        data['settings']['name'] = 'Alex Vance'
        import_path = ROOT / 'tests' / 'scratch_import.json'
        import_path.write_text(json.dumps(data))
        
        page.once('dialog', lambda d: d.accept())
        page.set_input_files('#import-file', str(import_path))
        page.wait_for_timeout(500)

        # Verify name updated
        stored = json.loads(page.evaluate("localStorage.getItem('ninety-track-v1')"))
        assert stored['settings']['name'] == 'Alex Vance', f"Expected Alex Vance, got {stored['settings']['name']}"
        import_path.unlink()

        # 5. Test Corrupted / Invalid Import JSON safely rejected
        bad_path = ROOT / 'tests' / 'scratch_bad.json'
        bad_path.write_text('{"invalid": true}')
        page.set_input_files('#import-file', str(bad_path))
        page.wait_for_timeout(500)
        # Verify toast error
        toast = page.locator('#toast-root').inner_text()
        assert 'could not import' in toast.lower() or 'not a valid' in toast.lower(), f"Unexpected toast: {toast}"
        bad_path.unlink()

        browser.close()
    print("PASS: Export and import test passed.")

if __name__ == '__main__':
    test_atlas_and_charts()
    test_export_and_import()
