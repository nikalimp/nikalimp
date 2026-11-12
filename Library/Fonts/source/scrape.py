import re, json, html, time, os, threading, queue, urllib.request
UA={'User-Agent':'Mozilla/5.0 (compatible; nikalimp-fonts/1.0)'}
def get(u):
    for a in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30) as r: return r.read().decode('utf8','replace')
        except Exception as e: err=e; time.sleep(3)
    raise err
T=lambda s: re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',s or ''))).strip()
def sect(h,title):
    m=re.search(r'class="font-card-title">'+title+r'</div>(.*?)</div></div>',h,re.S); return T(m.group(1)) if m else ''
out='fonts.jsonl'; done=set()
if os.path.exists(out): done={json.loads(l)['slug'] for l in open(out)}
urls=[u for u in re.findall(r'<loc>([^<]+/fonts/[^<]+)</loc>',open('sitemap.xml').read())]
Q=queue.Queue(); [Q.put(u) for u in urls if u.rstrip('/').split('/')[-1] not in done]
f=open(out,'a'); lock=threading.Lock()
def one(u):
    slug=u.rstrip('/').split('/')[-1]
    try: h=get(u)
    except Exception as e: print('ERR',slug,e,flush=True); return
    d={'slug':slug}
    m=re.search(r'<h1 class="fonts-headline">(.*?)</h1>',h,re.S); d['name']=T(m.group(1)) if m else slug
    m=re.search(r'href="([^"]+)" class="fonts-load-btn',h); d['zip']=html.unescape(m.group(1)) if m and m.group(1)!='#' else None
    faces=[]
    for blk in re.findall(r'@font-face\s*\{(.*?)\}',h,re.S):
        mu=re.search(r'src:\s*url\("([^"]+)"\)',blk)
        if not mu: continue
        mw=re.search(r'font-weight:\s*(\d+)',blk); ms=re.search(r'font-style:\s*(\w+)',blk)
        faces.append({'url':mu.group(1),'w':int(mw.group(1)) if mw else 400,'i':bool(ms and ms.group(1)=='italic')})
    d['faces']=faces
    m=re.search(r'class="font-grid-title">О шрифте</div>.*?<div class="font-richtext w-richtext">(.*?)</div>',h,re.S); d['about']=T(m.group(1)) if m else ''
    m=re.search(r'class="font-card-title">Автор</div>(.*?)</div></div></div>',h,re.S)
    d['authors']=[{'name':T(n),'url':html.unescape(l)} for l,n in re.findall(r'<a href="([^"]*)"[^>]*class="fonts-card-text">(.*?)</a>',m.group(1))] if m else []
    if m and not d['authors']:
        t=T(m.group(1)); d['authors']=[{'name':t,'url':''}] if t else []
    d['license']=sect(h,'Лицензионные условия'); d['allow']=sect(h,'Разрешения'); d['limit']=sect(h,'Ограничения')
    def lst(title):
        m=re.search(r'font-combination-title">'+title+r'</div>(.*?)(?:font-combination-title|</section>|$)',h,re.S)
        return re.findall(r'href="/fonts/([^"]+)"',m.group(1)) if m else []
    d['pairs']=lst('Рекомендуем для сочетания'); d['similar']=lst('Смотрите также')
    with lock: f.write(json.dumps(d,ensure_ascii=False)+'\n'); f.flush()
    time.sleep(0.3)
def w():
    while True:
        try: u=Q.get_nowait()
        except queue.Empty: return
        one(u)
ts=[threading.Thread(target=w) for _ in range(4)]; [t.start() for t in ts]; [t.join() for t in ts]
print('DONE',flush=True)
