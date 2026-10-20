"""Tests for audit refinements & accessibility fixes:
- Focus trapping within modal dialogs and focus restoration to trigger
- Direct numeric entry on quantitative habit step-value
- Reward refund button restores spent wallet XP
- North Star intention autosave on blur
- Converted habit backwards compatibility
"""
import json, re
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

def get_state(page):
    raw = page.evaluate("localStorage.getItem('ninety-track-v1')")
    return json.loads(raw) if raw else {}

def get_wallet_xp(page):
    text = page.locator('.v4-numbers button').nth(3).locator('strong').inner_text()
    return int(re.sub(r'[^\d]', '', text))

def test_modal_focus_trap_and_restoration():
    print("--- Running test_modal_focus_trap_and_restoration ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1024, 'height': 800})
        boot_page(page)
        page.get_by_role('button', name='Explore privately').click()

        # Open Habit Modal via 'Add a habit' button or command
        page.locator('.v4-sidebar [data-nav="habits"]').click()
        add_btn = page.locator('[data-action="add-habit"]')
        add_btn.focus()
        add_btn.click()

        modal_panel = page.locator('.modal-panel')
        assert modal_panel.is_visible()

        # Focus should be inside modal
        focused_in_modal = page.evaluate("document.querySelector('.modal-panel').contains(document.activeElement)")
        assert focused_in_modal, "Focus was not moved into modal on open"

        # Tab key test: cycle through elements and wrap around
        # Find all focusable elements in modal
        focusables_count = page.evaluate("document.querySelectorAll('.modal-panel button:not([disabled]), .modal-panel input:not([type=hidden]):not([disabled]), .modal-panel select:not([disabled])').length")
        assert focusables_count > 3

        # Press Shift+Tab on first element -> should wrap to last element
        page.evaluate("document.querySelectorAll('.modal-panel button:not([disabled]), .modal-panel input:not([type=hidden]):not([disabled]), .modal-panel select:not([disabled])')[0].focus()")
        page.keyboard.press('Shift+Tab')
        last_is_focused = page.evaluate('''() => {
            const list = document.querySelectorAll('.modal-panel button:not([disabled]), .modal-panel input:not([type=hidden]):not([disabled]), .modal-panel select:not([disabled])');
            return document.activeElement === list[list.length - 1];
        }''')
        assert last_is_focused, "Shift+Tab did not wrap to last element"

        # Press Tab on last element -> should wrap to first element
        page.keyboard.press('Tab')
        first_is_focused = page.evaluate('''() => {
            const list = document.querySelectorAll('.modal-panel button:not([disabled]), .modal-panel input:not([type=hidden]):not([disabled]), .modal-panel select:not([disabled])');
            return document.activeElement === list[0];
        }''')
        assert first_is_focused, "Tab on last element did not wrap to first element"

        # Close modal with Escape -> focus returns to trigger
        page.keyboard.press('Escape')
        assert not modal_panel.is_visible()
        restored = page.evaluate("document.activeElement === document.querySelector('[data-action=\"add-habit\"]')")
        assert restored, "Focus was not restored to trigger button after modal close"

        browser.close()
    print("PASS: Modal focus trap and focus restoration passed.")

def test_quick_qty_direct_entry():
    print("--- Running test_quick_qty_direct_entry ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        boot_page(page)
        page.get_by_role('button', name='Explore privately').click()

        # 'hydration': min habit, target 3.5 L
        step_val = page.locator('[data-quick-qty="hydration"]')
        assert step_val.count() == 1, "Quick quantity element missing"

        # Clicking prompts user
        page.once('dialog', lambda d: d.accept('2.75'))
        step_val.click()

        # Verify value logged directly to 2.75 L
        state = get_state(page)
        log_date = list(state['logs'].keys())[0]
        assert state['logs'][log_date]['habits']['hydration']['value'] == 2.75
        assert state['logs'][log_date]['habits']['hydration']['logged'] == True

        browser.close()
    print("PASS: Quick quantity direct entry passed.")

def test_reward_refund():
    print("--- Running test_reward_refund ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        boot_page(page)
        page.get_by_role('button', name='Explore privately').click()

        # Complete enough habits to get >= 120 XP
        for h_id in ['clear-mind', 'added-sugar', 'junk-food', 'sleep', 'meditation', 'deep-work', 'movement']:
            page.locator(f'[data-toggle="{h_id}"]').first.click()

        wallet_before = get_wallet_xp(page)
        assert wallet_before >= 140, f"Expected >= 140 XP, got {wallet_before}"

        # Redeem 'pause' reward (120 XP)
        page.locator('.v4-sidebar [data-nav="rewards"]').click()
        page.on('dialog', lambda d: d.accept())
        page.locator('[data-redeem="pause"]').click()

        # On rewards page, wallet is displayed in .reward-wallet h2
        wallet_text = page.locator('.reward-wallet h2').inner_text()
        wallet_after_redeem = int(re.sub(r'[^\d]', '', wallet_text))
        assert wallet_after_redeem == wallet_before - 120, f"Wallet did not deduct 120 XP: {wallet_after_redeem}"

        # Check celebration history has refund button
        refund_btn = page.locator('[data-refund-redemption]').first
        assert refund_btn.is_visible()

        # Click refund
        refund_btn.click()

        # Wallet should be restored
        wallet_restored_text = page.locator('.reward-wallet h2').inner_text()
        wallet_restored = int(re.sub(r'[^\d]', '', wallet_restored_text))
        assert wallet_restored == wallet_before, f"Expected {wallet_before} restored XP, got {wallet_restored}"

        browser.close()
    print("PASS: Reward refund test passed.")

def test_northstar_autosave():
    print("--- Running test_northstar_autosave ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        boot_page(page)
        page.get_by_role('button', name='Explore privately').click()

        # Type in North Star input and blur (dispatch change) without submitting form
        ns_input = page.locator('#northstar')
        ns_input.fill('Protect energy and ship quality.')
        ns_input.dispatch_event('change')

        state = get_state(page)
        assert state['settings']['northStar'] == 'Protect energy and ship quality.', f"Autosave failed: {state['settings'].get('northStar')}"

        browser.close()
    print("PASS: North Star autosave passed.")

def test_legacy_conversion_preservation():
    print("--- Running test_legacy_conversion_preservation ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Create seed with a habit that has binary {done: true} in logs,
        # but habit kind is now 'min' with target 10
        seed_state = {
            "version": 4,
            "settings": {"name": "Test User", "startDate": "2026-10-01", "theme": "dark", "notifications": False, "morning": "08:00", "evening": "21:00", "northStar": "", "favoriteQuotes": [], "weeklyFocusHours": 25},
            "habits": [
                {"id": "converted-habit", "title": "Reading", "caption": "", "icon": "book", "color": "blue", "category": "Growth", "kind": "min", "target": 10, "unit": "pages", "step": 1, "days": [0,1,2,3,4,5,6], "startDate": "2026-10-01", "reminder": "", "points": 20}
            ],
            "projects": [],
            "logs": {
                "2026-10-05": {"habits": {"converted-habit": {"done": True}}, "projects": {}, "note": "", "mood": ""}
            },
            "reminded": {}, "redemptions": [], "customRewards": [], "focusSessions": [], "parkedThoughts": []
        }
        page = browser.new_page()
        boot_page(page, seed={"ninety-track-v1": json.dumps(seed_state), "ninety-v3-guest-approved": "yes"})

        # The historical entry on 2026-10-05 is 100% complete: 20 XP habit + 30 XP perfect-day bonus = 50 XP
        text = page.locator('.v4-numbers button').first.locator('strong').inner_text()
        earned = int(re.sub(r'[^\d]', '', text))
        assert earned == 50, f"Expected 50 XP (20 habit + 30 perfect day), got {earned}"

        browser.close()
    print("PASS: Legacy conversion preservation passed.")

if __name__ == '__main__':
    test_modal_focus_trap_and_restoration()
    test_quick_qty_direct_entry()
    test_reward_refund()
    test_northstar_autosave()
    test_legacy_conversion_preservation()
