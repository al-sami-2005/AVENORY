"""Local-only deterministic recovery test. Simulates reopening in fresh browser documents."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import json,shutil,re
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text()
for file in ('styles.css','avenory-core.css','avenory-components.css'):
 css=re.sub(r'@import url\([^\n]+;\s*','',(ROOT/file).read_text())
 html=html.replace(f'<link rel="stylesheet" href="{file}" />',f'<style>{css}</style>')
html=html.replace('<script src="app.js" defer></script>', '<script>'+(ROOT/'app.js').read_text().replace('</script>','<\\/script>')+'</script>')
def boot(page,seed=None):
 fake={}
 fake.update(seed or {})
 bootstrap='''<script>Object.defineProperty(window,'localStorage',{value:{data:%s,getItem(k){return this.data[k]??null},setItem(k,v){this.data[k]=String(v)},removeItem(k){delete this.data[k]}}});window.NINETY_CLOUD={url:'',anonKey:''};</script>'''%json.dumps(fake)
 page.set_content(html.replace('<script src="cloud-config.js" defer></script>',bootstrap),wait_until='domcontentloaded')
def getseed(page):return page.evaluate('structuredClone(localStorage.data)')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 page=browser.new_page()
 boot(page)
 page.get_by_role('button',name='Explore privately').click()
 page.locator('.v4-sidebar [data-nav="focus"]').click()
 page.locator('#v5-minutes').fill('2');page.locator('#custom-timer-form button').click()
 page.locator('[data-action="timer-toggle"]').click()
 page.evaluate('''() => {let d=JSON.parse(localStorage.getItem('ninety-v3-focus-runtime'));d.running=false;d.remaining=60;d.duration=120;d.startedAt=Date.now()-60000;localStorage.setItem('ninety-v3-focus-runtime',JSON.stringify(d))}''')
 seed=getseed(page);page.close()
 page=browser.new_page();boot(page,seed)
 page.locator('.v4-sidebar [data-nav="focus"]').click()
 assert page.locator('#timer-counter').inner_text()=='01:00'
 page.once('dialog',lambda d:d.accept())
 page.locator('[data-action="timer-finish-early"]').click()
 states=page.evaluate("JSON.parse(localStorage.getItem('ninety-track-v1'))")
 assert len(states['focusSessions'])==1 and states['focusSessions'][0]['minutes']==1
 seed=getseed(page);page.close()
 page=browser.new_page();boot(page,seed)
 assert len(page.evaluate("JSON.parse(localStorage.getItem('ninety-track-v1')).focusSessions"))==1
 page.locator('.v4-sidebar [data-nav="focus"]').click()
 page.locator('#v5-minutes').fill('2');page.locator('#custom-timer-form button').click()
 page.locator('[data-action="timer-toggle"]').click()
 page.evaluate('''() => {let d=JSON.parse(localStorage.getItem('ninety-v3-focus-runtime'));d.running=true;d.remaining=0;d.duration=120;d.end=Date.now()-1000;d.startedAt=Date.now()-121000;localStorage.setItem('ninety-v3-focus-runtime',JSON.stringify(d))}''')
 seed=getseed(page);page.close()
 page=browser.new_page();boot(page,seed)
 page.wait_for_timeout(1100)
 state=page.evaluate("JSON.parse(localStorage.getItem('ninety-track-v1'))")
 assert len(state['focusSessions'])==2 and state['focusSessions'][1]['minutes']==2,state['focusSessions']
 seed=getseed(page);page.close()
 page=browser.new_page();boot(page,seed)
 page.wait_for_timeout(500)
 state=page.evaluate("JSON.parse(localStorage.getItem('ninety-track-v1'))")
 assert len(state['focusSessions'])==2,'duplicate awarded after 2nd reopen'
 print('PASS timer early save, persisted time, no duplicate on repeated reopens')
 browser.close()
