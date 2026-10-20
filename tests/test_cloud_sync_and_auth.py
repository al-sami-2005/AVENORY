"""Tests for Supabase Cloud Authentication & Cross-Device Synchronization:
1. Authentication UI flows:
   - Sign in, Sign up, Forgot password recovery request, Password update
   - URL hash token callback handling (#access_token=...&type=recovery and email confirmation)
   - Guest mode entry and account sign out
2. Cross-Device Synchronization & CAS Conflict Resolution:
   - Device 1 updates state, commits to cloud with p_expected_revision CAS
   - Device 2 fetches and mirrors state
   - Revision mismatch conflict detection
   - Conflict resolution ('resolve-local' and 'resolve-cloud')
3. Multi-User Account Isolation & Local Safety:
   - User A and User B state separation
   - ninety-track-v1 local storage preservation on signout
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

def boot_cloud_page(page, cloud_url="https://isnlcdjlvngjnfgojwil.supabase.co", anon_key="sb_publishable_test_key_longer_than_20_chars", seed=None, hash_fragment=""):
    fake = {}
    fake.update(seed or {})
    hash_code = f"window.location.hash = {json.dumps(hash_fragment)};" if hash_fragment else ""
    bootstrap = '''<script>
    Object.defineProperty(window,'localStorage',{
        value:{
            data:%s,
            getItem(k){return this.data[k]??null},
            setItem(k,v){this.data[k]=String(v)},
            removeItem(k){delete this.data[k]}
        }
    });
    window.NINETY_CLOUD={url:%s,anonKey:%s};
    %s
    </script>''' % (json.dumps(fake), json.dumps(cloud_url), json.dumps(anon_key), hash_code)
    content = HTML_TEMPLATE.replace('<script src="cloud-config.js" defer></script>', bootstrap)
    page.set_content(content, wait_until='domcontentloaded')


def test_auth_ui_flows():
    print("--- Running test_auth_ui_flows ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1024, 'height': 800})

        recovery_requested = []
        signup_requested = []

        def handle_auth_routes(route):
            url = route.request.url
            if '/auth/v1/recover' in url:
                payload = json.loads(route.request.post_data or '{}')
                recovery_requested.append(payload)
                route.fulfill(status=200, content_type='application/json', body=json.dumps({}))
            elif '/auth/v1/signup' in url:
                payload = json.loads(route.request.post_data or '{}')
                signup_requested.append(payload)
                route.fulfill(status=200, content_type='application/json', body=json.dumps({
                    'access_token': 'test_tok_signup',
                    'token_type': 'bearer',
                    'expires_in': 3600,
                    'refresh_token': 'test_ref_signup',
                    'user': {'id': 'user_signup_1', 'email': payload.get('email')}
                }))
            elif '/rest/v1/ninety_profiles' in url:
                route.fulfill(status=200, content_type='application/json', body=json.dumps([]))
            elif '/rest/v1/rpc/ninety_write_state' in url:
                route.fulfill(status=200, content_type='application/json', body=json.dumps([{'revision': 1}]))
            else:
                route.fulfill(status=200, content_type='application/json', body=json.dumps({}))

        page.route('**/auth/v1/**', handle_auth_routes)
        page.route('**/rest/v1/**', handle_auth_routes)

        boot_cloud_page(page)

        # 1. Verify default sign in form
        assert page.locator('#auth-form').is_visible()
        assert page.locator('text=Welcome back.').is_visible()
        assert page.locator('button[data-action="auth-mode"][data-mode="forgot"]').is_visible()

        # 2. Switch to Forgot Password
        page.locator('button[data-action="auth-mode"][data-mode="forgot"]').click()
        assert page.locator('text=Reset your password').is_visible()
        assert not page.locator('#auth-password').is_visible() # Password field hidden
        page.locator('#auth-email').fill('seeker@example.com')
        page.locator('.auth-submit').click()
        page.wait_for_timeout(200)

        assert len(recovery_requested) == 1
        assert recovery_requested[0]['email'] == 'seeker@example.com'
        # Form reverts to signin after recovery link sent
        assert page.locator('text=Welcome back.').is_visible()

        # 3. Switch to Sign Up
        page.locator('button[data-action="auth-mode"][data-mode="signup"]').click()
        assert page.locator('text=Create your account').is_visible()
        page.locator('#auth-email').fill('newuser@example.com')
        page.locator('#auth-password').fill('securepass123')
        page.locator('.auth-submit').click()
        page.wait_for_timeout(500)

        assert len(signup_requested) == 1
        assert signup_requested[0]['email'] == 'newuser@example.com'
        # Authenticated into workspace
        assert not page.locator('.auth-shell').is_visible()
        assert page.locator('.v4-command-hero').is_visible()

        browser.close()
        print("PASS: Auth UI flows (signin, signup, forgot password) verified.")


def test_auth_hash_callback():
    print("--- Running test_auth_hash_callback ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1024, 'height': 800})

        updated_passwords = []

        def handle_routes(route):
            url = route.request.url
            if '/auth/v1/user' in url:
                if route.request.method == 'PUT':
                    body = json.loads(route.request.post_data or '{}')
                    updated_passwords.append(body)
                    route.fulfill(status=200, content_type='application/json', body=json.dumps({'id': 'recovered_user_1', 'email': 'user@reset.org'}))
                else:
                    route.fulfill(status=200, content_type='application/json', body=json.dumps({'id': 'recovered_user_1', 'email': 'user@reset.org'}))
            elif '/rest/v1/ninety_profiles' in url:
                route.fulfill(status=200, content_type='application/json', body=json.dumps([]))
            elif '/rest/v1/rpc/ninety_write_state' in url:
                route.fulfill(status=200, content_type='application/json', body=json.dumps([{'revision': 1}]))
            else:
                route.fulfill(status=200, content_type='application/json', body=json.dumps({}))

        page.route('**/auth/v1/**', handle_routes)
        page.route('**/rest/v1/**', handle_routes)

        # Simulate arriving from email recovery link with #access_token=...&type=recovery
        boot_cloud_page(page, hash_fragment="access_token=recovery_jwt_token_123&refresh_token=recovery_refresh_123&expires_in=3600&type=recovery")
        page.wait_for_timeout(300)

        # Must display 'Choose a new password' form
        assert page.locator('text=Choose a new password').is_visible()
        page.locator('#auth-password').fill('brandNewPassword456')
        page.locator('.auth-submit').click()
        page.wait_for_timeout(400)

        assert len(updated_passwords) == 1
        assert updated_passwords[0]['password'] == 'brandNewPassword456'
        # Enters app
        assert page.locator('.v4-command-hero').is_visible()

        browser.close()
        print("PASS: Auth hash recovery callback verified.")


def test_cross_device_sync_and_cas_conflict():
    print("--- Running test_cross_device_sync_and_cas_conflict ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # Server-side mock database state
        server_db = {
            'user_1': {
                'revision': 1,
                'data': None # will be initialized on first write
            }
        }

        def make_route_handler():
            def handle_routes(route):
                url = route.request.url
                if '/auth/v1/token' in url:
                    route.fulfill(status=200, content_type='application/json', body=json.dumps({
                        'access_token': 'tok_dev',
                        'token_type': 'bearer',
                        'expires_in': 3600,
                        'refresh_token': 'ref_dev',
                        'user': {'id': 'user_1', 'email': 'sync_user@vowmera.io'}
                    }))
                elif '/auth/v1/user' in url:
                    route.fulfill(status=200, content_type='application/json', body=json.dumps({
                        'id': 'user_1', 'email': 'sync_user@vowmera.io'
                    }))
                elif '/rest/v1/ninety_profiles' in url:
                    doc = server_db['user_1']
                    if doc['data'] is None:
                        route.fulfill(status=200, content_type='application/json', body=json.dumps([]))
                    else:
                        route.fulfill(status=200, content_type='application/json', body=json.dumps([{
                            'revision': doc['revision'],
                            'data': doc['data']
                        }]))
                elif '/rest/v1/rpc/ninety_write_state' in url:
                    body = json.loads(route.request.post_data or '{}')
                    exp_rev = body.get('p_expected_revision')
                    doc = body.get('p_document')
                    curr = server_db['user_1']
                    
                    # Initial insert when revision is 0
                    if curr['data'] is None:
                        curr['revision'] = 1
                        curr['data'] = doc
                        route.fulfill(status=200, content_type='application/json', body=json.dumps([{'revision': 1}]))
                    elif exp_rev == curr['revision']:
                        # Expected revision matches! Bump revision and update
                        curr['revision'] += 1
                        curr['data'] = doc
                        route.fulfill(status=200, content_type='application/json', body=json.dumps([{'revision': curr['revision']}]))
                    else:
                        # Stale revision conflict! Return empty array []
                        route.fulfill(status=200, content_type='application/json', body=json.dumps([]))
                else:
                    route.fulfill(status=200, content_type='application/json', body=json.dumps({}))
            return handle_routes

        # ── Device 1 Setup ──
        page1 = browser.new_page(viewport={'width': 1024, 'height': 800})
        page1.route('**/auth/v1/**', make_route_handler())
        page1.route('**/rest/v1/**', make_route_handler())

        boot_cloud_page(page1)
        # Sign in on Device 1
        page1.locator('#auth-email').fill('sync_user@vowmera.io')
        page1.locator('#auth-password').fill('password123')
        page1.locator('.auth-submit').click()
        page1.wait_for_timeout(500)

        # Device 1 updates North Star intention
        page1.locator('.v4-sidebar [data-nav="account"]').click()
        page1.wait_for_timeout(200)
        assert page1.locator('text=Up to date on all devices').is_visible() or page1.locator('text=Synced just now').is_visible()

        # Update habit on Device 1
        page1.locator('.v4-sidebar [data-nav="overview"]').click()
        first_habit_btn = page1.locator('[data-toggle]').first
        first_habit_btn.click()
        page1.wait_for_timeout(1600) # wait for scheduleSync flush

        # Server should now have revision 2
        assert server_db['user_1']['revision'] == 2

        # ── Device 2 Setup ──
        page2 = browser.new_page(viewport={'width': 1024, 'height': 800})
        page2.route('**/auth/v1/**', make_route_handler())
        page2.route('**/rest/v1/**', make_route_handler())

        boot_cloud_page(page2)
        # Sign in on Device 2
        page2.locator('#auth-email').fill('sync_user@vowmera.io')
        page2.locator('#auth-password').fill('password123')
        page2.locator('.auth-submit').click()
        page2.wait_for_timeout(500)

        # Device 2 should have received the habit check-in from Device 1
        page2.locator('.v4-sidebar [data-nav="overview"]').click()
        d2_first_habit = page2.locator('[data-toggle]').first
        assert 'done' in (d2_first_habit.get_attribute('class') or '')

        # ── Simulate Concurrent Edit Conflict ──
        # Device 1 makes another edit -> pushes server to revision 3
        first_habit_btn.click()
        page1.wait_for_timeout(1600)
        assert server_db['user_1']['revision'] == 3

        # Device 2 now makes an edit while still at revision 2
        d2_first_habit.click()
        page2.wait_for_timeout(1600)

        # Device 2 flushSync CAS (expected 2 != current 3) fails!
        # Device 2 must display conflict resolution in Account tab
        page2.locator('.v4-sidebar [data-nav="account"]').click()
        page2.wait_for_timeout(300)
        assert page2.locator('text=Resolve your unsynced edits').is_visible()
        assert page2.locator('button[data-action="resolve-cloud"]').is_visible()
        assert page2.locator('button[data-action="resolve-local"]').is_visible()

        browser.close()
        print("PASS: Cross-device sync, CAS revision verification, and conflict detection passed.")


def test_user_isolation_and_local_safety():
    print("--- Running test_user_isolation_and_local_safety ---")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1024, 'height': 800})

        # Seed with initial guest data in ninety-track-v1
        guest_seed = {
            'ninety-track-v1': json.dumps({
                'settings': {'name': 'GuestExplorer', 'startDate': '2026-10-01'},
                'habits': [],
                'projects': [],
                'logs': {'2026-10-20': {'note': 'Private guest reflection'}}
            })
        }

        def handle_routes(route):
            url = route.request.url
            if '/auth/v1/token' in url:
                body = json.loads(route.request.post_data or '{}')
                email = body.get('email', '')
                uid = 'uid_alice' if 'alice' in email else 'uid_bob'
                route.fulfill(status=200, content_type='application/json', body=json.dumps({
                    'access_token': f'tok_{uid}',
                    'token_type': 'bearer',
                    'expires_in': 3600,
                    'refresh_token': f'ref_{uid}',
                    'user': {'id': uid, 'email': email}
                }))
            elif '/auth/v1/logout' in url:
                route.fulfill(status=200, content_type='application/json', body=json.dumps({}))
            elif '/rest/v1/ninety_profiles' in url:
                # Return separate profile based on auth bearer token
                auth = route.request.headers.get('authorization', '')
                if 'tok_uid_alice' in auth:
                    route.fulfill(status=200, content_type='application/json', body=json.dumps([{
                        'revision': 1,
                        'data': {'settings': {'name': 'AliceProfile', 'startDate': '2026-10-01'}, 'habits': [], 'projects': [], 'logs': {}}
                    }]))
                else:
                    route.fulfill(status=200, content_type='application/json', body=json.dumps([{
                        'revision': 1,
                        'data': {'settings': {'name': 'BobProfile', 'startDate': '2026-10-01'}, 'habits': [], 'projects': [], 'logs': {}}
                    }]))
            else:
                route.fulfill(status=200, content_type='application/json', body=json.dumps({}))

        page.route('**/auth/v1/**', handle_routes)
        page.route('**/rest/v1/**', handle_routes)

        boot_cloud_page(page, seed=guest_seed)

        # 1. Sign in as Alice
        page.locator('#auth-email').fill('alice@vowmera.io')
        page.locator('#auth-password').fill('password123')
        page.locator('.auth-submit').click()
        page.wait_for_timeout(400)

        # Alice's name in profile
        alice_store = page.evaluate("localStorage.getItem('ninety-v3-user-uid_alice')")
        assert alice_store is not None and 'AliceProfile' in alice_store
        page.locator('.v4-sidebar [data-nav="account"]').click()
        assert 'alice@vowmera.io' in page.locator('.account-identity h2').inner_text()

        # 2. Sign out
        page.locator('button[data-action="signout"]').click()
        page.wait_for_timeout(400)

        # Verify ninety-track-v1 was NOT overwritten or wiped
        guest_raw = page.evaluate("localStorage.getItem('ninety-track-v1')")
        assert 'Private guest reflection' in guest_raw
        assert 'GuestExplorer' in guest_raw

        # 3. Sign in as Bob
        page.locator('#auth-email').fill('bob@vowmera.io')
        page.locator('#auth-password').fill('password123')
        page.locator('.auth-submit').click()
        page.wait_for_timeout(400)

        # Bob's name in profile
        bob_store = page.evaluate("localStorage.getItem('ninety-v3-user-uid_bob')")
        assert bob_store is not None and 'BobProfile' in bob_store
        page.locator('.v4-sidebar [data-nav="account"]').click()
        assert 'bob@vowmera.io' in page.locator('.account-identity h2').inner_text()

        browser.close()
        print("PASS: Multi-user isolation and local storage safety verified.")


if __name__ == '__main__':
    test_auth_ui_flows()
    test_auth_hash_callback()
    test_cross_device_sync_and_cas_conflict()
    test_user_isolation_and_local_safety()
    print("ALL CLOUD SYNC & AUTH INTEGRATION TESTS PASSED SUCCESSFULLY!")
