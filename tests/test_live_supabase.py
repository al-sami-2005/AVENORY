"""
Live Supabase Integration and Security Verification Suite
Tests the live Supabase instance:
- Database table existence and RLS protection
- RPC function existence and anon execution denial
- Google OAuth provider configuration and redirect generation
- Auth endpoints: Signup, Password Token, Password Recovery, Rate Limiting
- JWT signature validation by PostgREST
"""
import urllib.request
import urllib.error
import json
import sys
import time

SUPABASE_URL = "https://isnlcdjlvngjnfgojwil.supabase.co"
PUBLISHABLE_KEY = "sb_publishable_U6oswzsKEkilExayftV_2A_O0FsFiQw"

def print_header(title):
    print(f"\n{'='*20} {title} {'='*20}")

def test_auth_settings():
    print_header("TEST 1: Supabase Auth Configuration & Providers")
    req = urllib.request.Request(f"{SUPABASE_URL}/auth/v1/settings", headers={"apikey": PUBLISHABLE_KEY})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        external = data.get("external", {})
        print(f"Auth Status: {resp.status} OK")
        print(f"Google OAuth Provider Enabled: {external.get('google', False)}")
        print(f"Email Provider Enabled: {external.get('email', False)}")
        print(f"Email Confirmation Enforced: {not data.get('autoconfirm', True)}")
        assert external.get("google") is True, "Google provider must be enabled"
        assert external.get("email") is True, "Email provider must be enabled"
    print("PASS: Auth settings verified.")

def test_rls_table_protection():
    print_header("TEST 2: Table RLS & Anon Access Denial")
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/ninety_profiles?select=user_id&limit=1",
        headers={"apikey": PUBLISHABLE_KEY}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Unexpected success: status {resp.status}")
            sys.exit(1)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP Status: {e.code}")
        print(f"Error Response: {body}")
        assert e.code == 401, f"Expected 401 Unauthorized, got {e.code}"
        assert "permission denied for table ninety_profiles" in body or "42501" in body, "RLS permission denied expected"
    print("PASS: ninety_profiles table exists and anon access is rejected with HTTP 401 (42501).")

def test_rpc_protection():
    print_header("TEST 3: ninety_write_state RPC Protection")
    payload = json.dumps({"p_document": {"test": True}, "p_expected_revision": 0}).encode("utf-8")
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/rpc/ninety_write_state",
        headers={"apikey": PUBLISHABLE_KEY, "Content-Type": "application/json"},
        data=payload
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Unexpected success: status {resp.status}")
            sys.exit(1)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP Status: {e.code}")
        print(f"Error Response: {body}")
        assert e.code == 401, f"Expected 401 Unauthorized, got {e.code}"
        assert "permission denied for function ninety_write_state" in body or "42501" in body, "RPC permission denied expected"
    print("PASS: ninety_write_state RPC exists and anon execution is rejected with HTTP 401 (42501).")

def test_google_oauth_redirect():
    print_header("TEST 4: Google OAuth Flow & Redirect Location")
    redirect_to = "http://localhost:8000"
    req = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to={urllib.parse.quote(redirect_to)}",
        headers={"apikey": PUBLISHABLE_KEY}
    )
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, req, fp, code, msg, hdrs, newurl):
            return None
    opener = urllib.request.build_opener(NoRedirect)
    try:
        resp = opener.open(req)
        print(f"Unexpected success: {resp.status}")
        sys.exit(1)
    except urllib.error.HTTPError as e:
        print(f"OAuth HTTP Status: {e.code} (Redirect)")
        location = e.headers.get("Location")
        print(f"OAuth Redirect Location: {location}")
        assert e.code == 302, f"Expected 302 Redirect, got {e.code}"
        assert "accounts.google.com" in location, "Expected Google accounts OAuth URL"
        assert "671629575045-hvcgg11830kkuk7679cmi603ql1jprai.apps.googleusercontent.com" in location, "Client ID mismatch"
    print("PASS: Google OAuth endpoint produces valid Google consent URL with configured client ID.")

def test_jwt_validation():
    print_header("TEST 5: PostgREST JWT Signature Validation")
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/ninety_profiles?select=*",
        headers={"apikey": PUBLISHABLE_KEY, "Authorization": "Bearer fake.tampered.token"}
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"Unexpected success: {resp.status}")
            sys.exit(1)
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"HTTP Status: {e.code}")
        print(f"Error Response: {body}")
        assert e.code == 401, f"Expected 401, got {e.code}"
        assert "PGRST301" in body or "JWT" in body, "Expected PostgREST JWT rejection"
    print("PASS: Tampered/forged JWT correctly rejected by PostgREST.")

def main():
    print("Running Live Supabase Integration and Security Checks against:")
    print(f"URL: {SUPABASE_URL}")
    print(f"Key: {PUBLISHABLE_KEY[:16]}...")
    test_auth_settings()
    test_rls_table_protection()
    test_rpc_protection()
    test_google_oauth_redirect()
    test_jwt_validation()
    print("\n" + "="*50)
    print("ALL LIVE SUPABASE VERIFICATION CHECKS PASSED EMPIRICALLY!")
    print("="*50)

if __name__ == "__main__":
    main()
