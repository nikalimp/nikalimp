import re, json, time, html, sys, os, urllib.request
UA={'User-Agent':'Mozilla/5.0 (compatible; nikalimp-startups/1.0; +https://nikalimp.ru)'}
def get(u):
    for a in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30) as r: return r.read().decode('utf8','replace')
        except Exception as e:
            err=e; time.sleep(5)
    raise err
T=lambda s: re.sub(r'\s+',' ',html.unescape(re.sub(r'<br\s*/?>','\n',s) if s else '')).strip()
def strip(s): return T(re.sub(r'<[^>]+>',' ',s or ''))
out='data.jsonl'
done=set()
if os.path.exists(out):
    for l in open(out,encoding='utf8'): done.add(json.loads(l)['slug'])
YEAR=os.environ.get('YEAR','2026'); T0=time.time(); MAXSEC=float(os.environ.get('MAXSEC','160'))
if not os.path.exists('sitemap.xml'): open('sitemap.xml','w').write(get('https://productradar.ru/wp-sitemap-posts-product-1.xml'))
urls=[u for u,l in re.findall(r'<loc>(https://productradar.ru/product/[^<]+)</loc>(?:<lastmod>([^<]+)</lastmod>)?',open('sitemap.xml').read())[int(os.environ.get('FROM','1000')):] if l.startswith(YEAR)]
print(len(urls),'urls',len(done),'done',flush=True)
import threading, queue
f=open(out,'a',encoding='utf8'); lock=threading.Lock(); Q=queue.Queue()
for u in urls:
    if u.rstrip('/').split('/')[-1] not in done: Q.put(u)
def one(u):
    slug=u.rstrip('/').split('/')[-1]
    try: h=get(u)
    except Exception as e:
        print('ERR',slug,e,flush=True); return
    d={'slug':slug,'url':u}
    m=re.search(r'<script type="application/ld\+json">(\{[^<]*?"WebApplication".*?)</script>',h,re.S)
    if m:
        try:
            j=json.loads(m.group(1)); d.update(name=j.get('name'),tagline=j.get('description'),published=j.get('datePublished'),modified=j.get('dateModified'),logo=(j.get('image') or {}).get('url'),appcat=j.get('applicationCategory'))
        except Exception: pass
    m=re.search(r'class="product__title">(.*?)</h1>',h,re.S); d['name']=d.get('name') or strip(m.group(1) if m else '')
    m=re.search(r'class="product__description">(.*?)</p>',h,re.S); d['tagline']=d.get('tagline') or strip(m.group(1) if m else '')
    m=re.search(r'product__website-button" href="([^"]+)"',h); d['website']=html.unescape(m.group(1)) if m else None
    m=re.search(r'<ul class="product__categories categories">(.*?)</ul>',h,re.S)
    d['cats']=[(c,strip(n)) for c,n in re.findall(r'href="https://productradar.ru/category/([^"?]+?)/?(?:\?[^"]*)?">(.*?)</a>',m.group(1) if m else '')]
    m=re.search(r'class="product__pricing">(.*?)</span>',h,re.S); d['pricing']=strip(m.group(1)) if m else None
    m=re.search(r'Штаб-квартира: <a href="https://productradar.ru/city/([^/]+)/">(.*?)</a>',h); d['city']=strip(m.group(2)) if m else None
    m=re.search(r'Количество голосов: (\d+)',h); d['votes']=int(m.group(1)) if m else None
    m=re.search(r'Обсуждение \((\d+)\)',h); d['comments']=int(m.group(1)) if m else None
    d['statuses']=[strip(x) for x in re.findall(r'product-status-item__title">(.*?)</p>',h,re.S)]
    d['about']={strip(k).rstrip(':'):strip(v) for k,v in re.findall(r'<div class="product__about-item">\s*<h3>(.*?)</h3>\s*<p>(.*?)</p>',h,re.S)}
    if not (d.get('published') or '').startswith(YEAR): d={'slug':slug,'skip':True,'published':d.get('published')}
    with lock: f.write(json.dumps(d,ensure_ascii=False)+'\n'); f.flush()
    time.sleep(0.8)
def worker():
    while time.time()-T0<MAXSEC:
        try: u=Q.get_nowait()
        except queue.Empty: return
        one(u)
ts=[threading.Thread(target=worker) for _ in range(int(os.environ.get('W','3')))]
[t.start() for t in ts]; [t.join() for t in ts]
print('LEFT',Q.qsize(),flush=True)
print('DONE',flush=True)
