from playwright.sync_api import sync_playwright
from pathlib import Path
import time
ROOT=Path(__file__).resolve().parents[1]

def as_html(seed=None):
    content=(ROOT/'index.html').read_text()
    for css in ('styles.css','avenory-core.css','avenory-components.css','avenory-signature.css','avenory-v7.css'):
        content=content.replace(f'<link rel="stylesheet" href="{css}" />',f'<style>{(ROOT/css).read_text()}</style>')
    fake=f'''<script>Object.defineProperty(window,'localStorage',{{value:{{data:{seed or {}!r},getItem(k){{return this.data[k]??null}},setItem(k,v){{this.data[k]=String(v)}},removeItem(k){{delete this.data[k]}}}}}});window.NINETY_CLOUD={{url:'https://isnlcdjlvngjnfgojwil.supabase.co',anonKey:'sb_publishable_test_long_enough_for_demo'}};</script>'''
    content=content.replace('<script src="cloud-config.js" defer></script>',fake)
    content=content.replace('<script src="app.js" defer></script>','<script>'+(ROOT/'app.js').read_text().replace('</script>',r'<\/script>')+'</script>')
    return content
OUT=ROOT / 'preview';OUT.mkdir(exist_ok=True)

def smoke(browser,width):
    page=browser.new_page(viewport={'width':width,'height':900},device_scale_factor=1);page.set_default_timeout(4500);page.route('https://fonts.googleapis.com/**',lambda r:r.abort());page.route('https://fonts.gstatic.com/**',lambda r:r.abort())
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(as_html(),wait_until='domcontentloaded')
    page.locator('[data-action="guest-enter"]').last.click()
    page.wait_for_selector('.v4-command-hero')
    assert page.locator('.avenory-editorial').count()==1
    assert page.locator('.avenory-editorial blockquote').inner_text().strip()
    assert page.locator('.avenory-maker-token').count()==1
    if width==390:
        page.locator('.avenory-editorial [data-keep-thought]').click()
        page.locator('[data-nav="sanctuary"]:visible').first.click()
        assert page.locator('.avenory-kept-notes blockquote').count()==1, 'Saved thought should appear in private library'
        page.locator('[data-nav="overview"]:visible').first.click()
    assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth'),f'overflow homepage {width}'
    if width in (390,1440):page.screenshot(path=str(OUT/f'home-{width}.png'),full_page=True)
    page.locator('[data-nav="habits"]:visible').first.click()
    assert page.locator('.page-title').count()==1
    assert page.locator('.avenory-field-strip').count()==1
    assert not page.evaluate('document.documentElement.scrollWidth > window.innerWidth'),f'overflow habits {width}'
    page.locator('[data-nav="overview"]:visible').first.click()
    assert page.locator('.v4-command-hero').count()==1
    assert not errors,errors
    if width==390:
        page.locator('[data-mood="okay"]').first.click()
        page.locator('#day-note').fill('I did a difficult thing and I am proud of myself.')
        page.wait_for_timeout(850)
        assert 'Saved' in page.locator('#note-save-status').inner_text()
        restored=browser.new_page(viewport={'width':390,'height':900});restored.set_default_timeout(4500)
        restored.route('https://fonts.googleapis.com/**',lambda r:r.abort());restored.route('https://fonts.gstatic.com/**',lambda r:r.abort())
        restored.set_content(as_html(page.evaluate('localStorage.data')),wait_until='domcontentloaded')
        assert restored.locator('#day-note').input_value().startswith('I did a difficult thing')
        restored.screenshot(path=str(OUT/'checkin-390.png'),full_page=True)
        restored.locator('[data-nav="focus"]:visible').first.click()
        restored.locator('#v5-minutes').fill('37');restored.locator('#custom-timer-form button').click()
        assert restored.locator('#v5-minutes').input_value()=='37'
        restored.close()
    print('ok',width)
    page.close()

with sync_playwright() as p:
    b=p.chromium.launch(headless=True,args=['--no-sandbox'])
    for w in (320,360,390,430,768,1024,1440):smoke(b,w)
    # Session persistence with mocked Supabase and saved private snapshot; no live credentials.
    pg=b.new_page(viewport={'width':390,'height':820})
    pg.set_content(as_html())
    pg.evaluate('''() => {
       const state={version:4,settings:{name:'Test person',startDate:'2026-10-20',theme:'dark',notifications:false,morning:'08:00',evening:'21:00'},habits:[],projects:[],logs:{},reminded:{},redemptions:[],customRewards:[],focusSessions:[],parkedThoughts:[]};
       localStorage.setItem('ninety-v3-auth-session',JSON.stringify({access_token:'test',refresh_token:'test',expires_at:Date.now()/1000+2000,user:{id:'person-001',email:'test@example.com'}}));
       localStorage.setItem('ninety-v3-user-person-001',JSON.stringify(state));
     }''')
    cached=pg.evaluate('localStorage.data');pg.close()
    pg=b.new_page(viewport={'width':390,'height':820});pg.route('https://fonts.googleapis.com/**',lambda r:r.abort());pg.route('https://fonts.gstatic.com/**',lambda r:r.abort())
    pg.route('**/auth/v1/user',lambda route: route.abort('failed'))
    pg.set_content(as_html(cached),wait_until='domcontentloaded')
    assert pg.locator('.v4-command-hero').is_visible(), 'Return to homepage without showing login'
    assert pg.locator('h1').first.inner_text().find('Test person')>=0
    pg.wait_for_timeout(900)
    assert pg.locator('.v4-command-hero').is_visible(), 'Keep signed-in cached home on temporary connection failure'
    print('PASS cached account restore with simulated network failure')
    pg.close();b.close()
print('V7 BROWSER SMOKE TESTS PASSED')
