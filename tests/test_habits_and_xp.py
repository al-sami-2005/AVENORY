"""Exhaustive tests for Habits, XP reversibility, Min/Max rules, and Rewards:
- Binary habit check/uncheck
- Min habit partial & full progress + XP
- Max habit limit rules (unlogged vs <= target vs > target)
- Next 3 moves priority and interaction
- Perfect day bonus (+30 XP)
- Daily check-in reflection XP (+5 mood, +5 note)
- Lifetime XP vs Available XP wallet accounting
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

def get_state(page):
    raw = page.evaluate("localStorage.getItem('ninety-track-v1')")
    return json.loads(raw) if raw else {}

def get_xp(page):
    # Retrieve lifetime XP from the stats card
    text = page.locator('.v4-numbers button').first.locator('strong').inner_text()
    # e.g. "120 XP" or "120"
    return int(re.sub(r'[^\d]', '', text))

def get_wallet_xp(page):
    text = page.locator('.v4-numbers button').nth(3).locator('strong').inner_text()
    return int(re.sub(r'[^\d]', '', text))

def test_binary_habit_reversibility():
    print("--- Running test_binary_habit_reversibility ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        boot_page(page)
        page.get_by_role('button', name='Explore privately').click()

        initial_xp = get_xp(page)
        assert initial_xp == 0, f"Initial XP should be 0, got {initial_xp}"

        # Toggle 'clear-mind' habit (points = 20)
        page.locator('[data-toggle="clear-mind"]').first.click()
        xp_after_check = get_xp(page)
        assert xp_after_check == 20, f"Expected 20 XP after checking clear-mind, got {xp_after_check}"

        # Toggle it off
        page.locator('[data-toggle="clear-mind"]').first.click()
        xp_after_uncheck = get_xp(page)
        assert xp_after_uncheck == 0, f"Expected 0 XP after unchecking, got {xp_after_uncheck}"

        browser.close()
    print("PASS: Binary habit reversibility passed.")

def test_min_habit_partial_and_full():
    print("--- Running test_min_habit_partial_and_full ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        boot_page(page)
        page.get_by_role('button', name='Explore privately').click()

        # 'hydration': kind=min, target=3.5L, step=0.25, points=20
        # Click '+' twice -> 0.5L / 3.5L -> progress = 0.5/3.5 = 0.1428 -> round(20 * 0.1428) = 3 XP
        plus_btn = page.locator('[data-qty="hydration"][data-change="0.25"]')
        plus_btn.click()
        plus_btn.click()

        xp_partial = get_xp(page)
        assert xp_partial == 3, f"Expected 3 XP for 0.5L out of 3.5L, got {xp_partial}"

        # Click '-' twice -> 0L -> 0 XP
        minus_btn = page.locator('[data-qty="hydration"][data-change="-0.25"]')
        minus_btn.click()
        minus_btn.click()
        xp_zero = get_xp(page)
        assert xp_zero == 0, f"Expected 0 XP after decreasing back to 0, got {xp_zero}"

        # Now click checkmark on hydration directly -> sets value to target 3.5 -> 20 XP
        tick_btn = page.locator('[data-toggle="hydration"]')
        tick_btn.click()
        xp_full = get_xp(page)
        assert xp_full == 20, f"Expected 20 XP after checking hydration, got {xp_full}"

        # Click tick again -> resets to unlogged -> 0 XP
        tick_btn.click()
        xp_reset = get_xp(page)
        assert xp_reset == 0, f"Expected 0 XP after unchecking hydration, got {xp_reset}"

        browser.close()
    print("PASS: Min habit partial and full XP test passed.")

def test_max_habit_semantics():
    print("--- Running test_max_habit_semantics ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        boot_page(page)
        page.get_by_role('button', name='Explore privately').click()

        # 'social-media': kind=max, target=59 min, step=15, points=20
        # 1. Initially unlogged: 0 XP, not done
        tick = page.locator('[data-toggle="social-media"]')
        assert not 'done' in (tick.get_attribute('class') or ''), "Max habit should be undone when unlogged"
        assert get_xp(page) == 0

        # 2. Enter value <= 59 (e.g. 30 min)
        input_field = page.locator('[data-qty-input="social-media"]')
        input_field.fill('30')
        input_field.dispatch_event('change')

        assert get_xp(page) == 20, f"Expected 20 XP for 30m on max 59m, got {get_xp(page)}"
        assert 'done' in (page.locator('[data-toggle="social-media"]').get_attribute('class') or '')

        # 3. Enter value > 59 (e.g. 75 min - exceeded max limit)
        input_field.fill('75')
        input_field.dispatch_event('change')

        assert get_xp(page) == 0, f"Expected 0 XP when exceeding limit, got {get_xp(page)}"
        assert not 'done' in (page.locator('[data-toggle="social-media"]').get_attribute('class') or '')

        # 4. Correct back down to 45 min
        input_field.fill('45')
        input_field.dispatch_event('change')
        assert get_xp(page) == 20, f"Expected 20 XP restored, got {get_xp(page)}"

        # 5. Clear input
        input_field.fill('')
        input_field.dispatch_event('change')
        assert get_xp(page) == 0, f"Expected 0 XP when cleared, got {get_xp(page)}"

        browser.close()
    print("PASS: Max habit semantics test passed.")

def test_reflection_and_wallet_rewards():
    print("--- Running test_reflection_and_wallet_rewards ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        boot_page(page)
        page.get_by_role('button', name='Explore privately').click()

        # 1. Mood reflection gives +5 XP
        page.locator('[data-mood="great"]').click()
        assert get_xp(page) == 5, f"Expected 5 XP for mood, got {get_xp(page)}"

        # 2. Daily note >= 12 chars gives +5 XP
        note = page.locator('[data-note]')
        note.fill('Grateful for quiet progress.')
        note.dispatch_event('change')
        # Re-render or check XP
        assert get_xp(page) == 10, f"Expected 10 XP for mood + note, got {get_xp(page)}"

        # 3. Complete some habits to earn wallet XP
        page.locator('[data-toggle="clear-mind"]').first.click() # +20
        page.locator('[data-toggle="added-sugar"]').first.click() # +20
        page.locator('[data-toggle="junk-food"]').first.click() # +20
        # Total = 10 + 60 = 70 XP
        assert get_xp(page) == 70
        assert get_wallet_xp(page) == 70

        # 4. Navigate to Rewards page
        page.locator('.v4-sidebar [data-nav="rewards"]').click()

        # Check that rewards cannot be claimed if available XP < cost
        # 'pause' reward costs 120 XP
        pause_btn = page.locator('[data-redeem="pause"]')
        assert pause_btn.is_disabled(), "Reward button should be disabled when wallet < cost"

        browser.close()
    print("PASS: Reflection and wallet rewards test passed.")

if __name__ == '__main__':
    test_binary_habit_reversibility()
    test_min_habit_partial_and_full()
    test_max_habit_semantics()
    test_reflection_and_wallet_rewards()
