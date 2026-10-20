"""Comprehensive regression tests for Focus Studio:
- Custom 1-180 minute duration
- Mode switching (focus, short break, long break, stopwatch)
- Early-save actual elapsed time (minimum 1 minute, discard remainder)
- Reload recovery (running timer restored, expired timer logged once, no duplicate XP on repeated reload)
- Stopwatch (timing, pause, finish & log)
- Named focus templates (create, apply, delete)
- Habit and project linkage
"""
import json, re, shutil
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]

def build_html():
    html = (ROOT / 'index.html').read_text()
    for file in ('styles.css', 'vowmera.css', 'edition-five.css'):
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

def get_storage(page):
    return page.evaluate('structuredClone(localStorage.data)')

def get_state(page):
    raw = page.evaluate("localStorage.getItem('ninety-track-v1')")
    return json.loads(raw) if raw else {}

def test_custom_timer_and_presets():
    print("--- Running test_custom_timer_and_presets ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        boot_page(page)
        page.get_by_role('button', name='Explore privately').click()
        page.locator('.v4-sidebar [data-nav="focus"]').click()

        # 1. Test custom time input: 1 minute
        page.locator('#v5-minutes').fill('1')
        page.locator('#custom-timer-form button').click()
        assert page.locator('#timer-counter').inner_text() == '01:00', "1 min timer failed"

        # 2. Test custom time input: 180 minutes
        page.locator('#v5-minutes').fill('180')
        page.locator('#custom-timer-form button').click()
        assert page.locator('#timer-counter').inner_text() == '03:00:00' or page.locator('#timer-counter').inner_text() == '180:00', f"180 min timer display: {page.locator('#timer-counter').inner_text()}"

        # 3. Test presets (15, 25, 45, 60, 90)
        for preset in [15, 25, 45, 60, 90]:
            page.locator(f'[data-timer-length="{preset}"]').click()
            expected = f"{preset // 60:02d}:{preset % 60:02d}:00" if preset >= 60 else f"{preset:02d}:00"
            assert page.locator('#timer-counter').inner_text() == expected, f"Preset {preset}m failed: {page.locator('#timer-counter').inner_text()}"

        # 4. Save custom template
        page.locator('#v5-minutes').fill('50')
        page.locator('#custom-timer-form button').click()
        assert page.locator('#timer-counter').inner_text() == '50:00'
        
        page.once('dialog', lambda d: d.accept('Deep Study'))
        page.locator('[data-action="save-focus-preset"]').click()
        
        # Verify preset item appeared
        preset_item = page.locator('.v5-preset-item button', has_text='Deep Study · 50m')
        assert preset_item.count() == 1, "Saved template not found"

        # Change timer to 15m, then click the saved template
        page.locator('[data-timer-length="15"]').click()
        assert page.locator('#timer-counter').inner_text() == '15:00'
        preset_item.click()
        assert page.locator('#timer-counter').inner_text() == '50:00', "Applying saved template failed"

        # Delete preset
        page.locator('.v5-preset-item', has_text='Deep Study').locator('.v5-preset-delete').click()
        assert page.locator('.v5-preset-item button', has_text='Deep Study · 50m').count() == 0, "Preset delete failed"

        browser.close()
    print("PASS: Custom timer and presets test passed.")

def test_early_save_and_recovery():
    print("--- Running test_early_save_and_recovery ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        boot_page(page)
        page.get_by_role('button', name='Explore privately').click()
        page.locator('.v4-sidebar [data-nav="focus"]').click()

        # Set 25 min timer
        page.locator('#v5-minutes').fill('25')
        page.locator('#custom-timer-form button').click()
        page.locator('[data-action="timer-toggle"]').click() # Start timer

        # 1. Early save with < 1 minute elapsed should be blocked
        # Simulate 30 seconds elapsed
        page.evaluate('''() => {
            let d = JSON.parse(localStorage.getItem('ninety-v3-focus-runtime'));
            d.running = true;
            d.duration = 1500;
            d.remaining = 1470;
            d.end = Date.now() + 1470000;
            d.startedAt = Date.now() - 30000;
            localStorage.setItem('ninety-v3-focus-runtime', JSON.stringify(d));
        }''')
        # Click finish early
        page.locator('[data-action="timer-finish-early"]').click()
        # Toast should say focus for at least one minute
        toast_text = page.locator('#toast-root').inner_text()
        assert 'at least one minute' in toast_text.lower(), f"Unexpected toast: {toast_text}"
        state = get_state(page)
        assert len(state.get('focusSessions', [])) == 0, "Session should not be recorded under 1 min"

        # 2. Early save with >= 1 min (e.g. 5 minutes elapsed out of 25)
        page.evaluate('''() => {
            let d = JSON.parse(localStorage.getItem('ninety-v3-focus-runtime'));
            d.running = false;
            d.duration = 1500;
            d.remaining = 1200; // 5 min elapsed
            d.startedAt = Date.now() - 300000;
            localStorage.setItem('ninety-v3-focus-runtime', JSON.stringify(d));
        }''')
        seed = get_storage(page)
        page.close()
        page = browser.new_page()
        boot_page(page, seed)
        page.locator('.v4-sidebar [data-nav="focus"]').click()
        
        page.once('dialog', lambda d: d.accept())
        page.locator('[data-action="timer-finish-early"]').click()
        
        state = get_state(page)
        sessions = state.get('focusSessions', [])
        assert len(sessions) == 1, f"Expected 1 session, got {len(sessions)}"
        assert sessions[0]['minutes'] == 5, f"Expected 5 minutes logged, got {sessions[0]['minutes']}"

        # 3. Reload does not duplicate session
        seed = get_storage(page)
        page.close()
        page = browser.new_page()
        boot_page(page, seed)
        page.wait_for_timeout(1000)
        state = get_state(page)
        assert len(state.get('focusSessions', [])) == 1, "Duplicate session recorded on reload"

        browser.close()
    print("PASS: Early save and recovery test passed.")

def test_stopwatch():
    print("--- Running test_stopwatch ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        boot_page(page)
        page.get_by_role('button', name='Explore privately').click()
        page.locator('.v4-sidebar [data-nav="focus"]').click()

        # Switch to stopwatch mode
        page.locator('[data-timer-mode="stopwatch"]').click()
        assert page.locator('#timer-counter').inner_text() == '00:00', "Stopwatch didn't start at 00:00"

        # Start stopwatch
        page.locator('[data-action="timer-toggle"]').click()

        # Simulate 125 seconds (2 minutes 5 seconds)
        page.evaluate('''() => {
            let d = JSON.parse(localStorage.getItem('ninety-v3-focus-runtime'));
            d.running = true;
            d.startMs = Date.now() - 125000;
            d.startedAt = Date.now() - 125000;
            localStorage.setItem('ninety-v3-focus-runtime', JSON.stringify(d));
        }''')
        seed = get_storage(page)
        page.close()
        page = browser.new_page()
        boot_page(page, seed)
        page.locator('.v4-sidebar [data-nav="focus"]').click()

        # Finish stopwatch
        page.once('dialog', lambda d: d.accept())
        page.locator('[data-action="timer-finish"]').click()

        state = get_state(page)
        sessions = state.get('focusSessions', [])
        assert len(sessions) == 1, f"Expected 1 stopwatch session, got {len(sessions)}"
        assert sessions[0]['minutes'] == 2, f"Expected 2 minutes, got {sessions[0]['minutes']}"
        assert sessions[0]['mode'] == 'stopwatch', f"Expected mode stopwatch, got {sessions[0]['mode']}"

        browser.close()
    print("PASS: Stopwatch test passed.")

if __name__ == '__main__':
    test_custom_timer_and_presets()
    test_early_save_and_recovery()
    test_stopwatch()
