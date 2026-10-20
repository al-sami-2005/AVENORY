from pathlib import Path
from playwright.sync_api import sync_playwright
import re,shutil
BASE=Path(__file__).resolve().parents[1]
html=(BASE/'index.html').read_text()
for fname in ['styles.css','vowmera.css','edition-five.css']:
 css=(BASE/fname).read_text(); css=re.sub(r'@import url\([^\n]+;\s*','',css)
 html=html.replace(f'<link rel="stylesheet" href="{fname}" />',f'<style>{css}</style>')
html=html.replace('<script src="cloud-config.js" defer></script>', '''<script>Object.defineProperty(window,'localStorage',{value:{data:{},getItem(k){return this.data[k]??null},setItem(k,v){this.data[k]=String(v)},removeItem(k){delete this.data[k]}}});window.NINETY_CLOUD={url:'',anonKey:''};</script>''')
html=html.replace('<script src="app.js" defer></script>','<script>'+(BASE/'app.js').read_text().replace('</script>','<\\/script>')+'</script>')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'],headless=True)
 for width in [320,360,390,430,768,1024,1440]:
  page=browser.new_page(viewport={'width':width,'height':860});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='domcontentloaded',timeout=30000)
  page.get_by_role('button',name='Explore privately').click()
  assert page.locator('.v5-next').count()==1
  assert page.locator('.v5-pulse-map .v5-map-cell').count()==30
  assert page.locator('.v5-quote-switch').count()==1
  quote=page.locator('.v5-quote-switch blockquote').inner_text()
  page.locator('[data-action="next-quote"]').click()
  assert page.locator('.v5-quote-switch blockquote').inner_text()!=quote
  # Validate one-tap + reversible XP.
  xp=page.locator('.v4-numbers strong').first.inner_text()
  page.locator('[data-toggle="clear-mind"]').first.click()
  assert xp!=page.locator('.v4-numbers strong').first.inner_text()
  page.locator('[data-toggle="clear-mind"]').first.click()
  assert xp==page.locator('.v4-numbers strong').first.inner_text()
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'overview overflow {width}'
  if width in [390,1440]:page.screenshot(path=str(BASE/'tests'/'screenshots'/f'home-{width}.png'),full_page=False)
  selector=('.mobile-nav ' if width<=790 else '.v4-sidebar ')
  page.locator(selector+'[data-nav="habits"]').click()
  assert page.locator('.v5-habit-lens').count()==1
  page.locator('#lens-habit').select_option('sleep')
  assert page.locator('#lens-habit').input_value()=='sleep'
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'habit overflow {width}'
  page.locator(selector+'[data-nav="focus"]').click()
  assert page.locator('#custom-timer-form').count()==1
  page.locator('#v5-minutes').fill('37')
  page.locator('#custom-timer-form button').click()
  assert page.locator('#timer-counter').inner_text()=='37:00',page.locator('#timer-counter').inner_text()
  assert page.locator('#v5-minutes').input_value()=='37'
  # Prompt in browser, template persist on refresh local client rerender.
  page.once('dialog',lambda d:d.accept('Writing'))
  page.locator('[data-action="save-focus-preset"]').click()
  assert page.locator('[data-preset-use="0"]').count()==1
  page.locator('[data-timer-length="15"]').click()
  page.locator('[data-preset-use="0"]').click()
  assert page.locator('#timer-counter').inner_text()=='37:00'
  page.locator('[data-action="timer-toggle"]').click()
  assert page.locator('[data-action="timer-toggle"]').inner_text().strip().lower().startswith('pause')
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),f'focus overflow {width}'
  if width in [390,1440]:page.screenshot(path=str(BASE/'tests'/'screenshots'/f'focus-{width}.png'),full_page=False)
  # Simulated passage of time test on paused timer for partial minutes. allow >1m via internal storage fixture and reload separate test.
  assert not errors,(width,errors)
  print('PASS',width,'quote, XP, map, lens, custom timer, presets, start, no overflow')
  page.close()
 browser.close()
