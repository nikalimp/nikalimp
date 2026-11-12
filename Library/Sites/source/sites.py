import json,re,os,time,urllib.request,ssl,html
from concurrent.futures import ThreadPoolExecutor,as_completed
items=list(json.load(open('state.json'))['items'].values())
done=set()
if os.path.exists('sites.jsonl'):
    for l in open('sites.jsonl'):
        try: done.add(json.loads(l)['uid'])
        except: pass
todo=[x for x in items if x['uid'] not in done]
ctx=ssl.create_default_context();ctx.check_hostname=False;ctx.verify_mode=ssl.CERT_NONE
def meta(h,name):
    m=re.search(r'<meta[^>]+(?:name|property)=["\']'+name+r'["\'][^>]*content=["\']([^"\']*)',h,re.I) or re.search(r'<meta[^>]+content=["\']([^"\']*)["\'][^>]*(?:name|property)=["\']'+name+r'["\']',h,re.I)
    return html.unescape(m.group(1)).strip() if m else ''
def get(x):
    r={'uid':x['uid']}
    try:
        req=urllib.request.Request(x['url'],headers={'User-Agent':'Mozilla/5.0 (Macintosh) NikAlimpGallery/1.0'})
        with urllib.request.urlopen(req,timeout=12,context=ctx) as f:
            r['code']=f.status;r['final']=f.geturl();h=f.read(1500000).decode('utf-8','ignore')
    except urllib.error.HTTPError as e: r['code']=e.code;return r
    except Exception as e: r['err']=type(e).__name__;return r
    t=re.search(r'<title[^>]*>(.*?)</title>',h,re.S|re.I)
    r['title']=html.unescape(t.group(1)).strip()[:300] if t else ''
    r['desc']=meta(h,'description')[:500];r['ogdesc']=meta(h,'og:description')[:500]
    r['tilda']=('tildacdn' in h) or ('tilda' in h.lower() and 't-rec' in h)
    r['recs']=len(re.findall(r'class="r t-rec',h))
    r['types']=sorted(set(re.findall(r'data-record-type="(\d+)"',h)))
    r['zero']=h.count('data-record-type="396"')
    r['h1']=[re.sub(r'<[^>]+>',' ',html.unescape(z)).strip()[:200] for z in re.findall(r'<h1[^>]*>(.*?)</h1>',h,re.S|re.I)][:2]
    r['feat']=[k for k,p in {'store':'tilda-catalog|t-store|tcart','form':'t-form','popup':'t-popup','anim':'tilda-animation','sbs':'animation-sbs','video':'t-video|youtube.com/embed|vimeo','slider':'t-slds','cart':'tcart','members':'tilda-members','quiz':'t-quiz|tilda-quiz','map':'t-map|api-maps.yandex','blog':'t-feed|tilda-feed'}.items() if re.search(p,h)]
    r['nav']=len(set(re.findall(r'href="(/[a-z0-9_-]+/?)"',h)))
    return r
start=time.time()
with open('sites.jsonl','a') as out, ThreadPoolExecutor(24) as ex:
    futs=[ex.submit(get,x) for x in todo]
    for f in as_completed(futs):
        out.write(json.dumps(f.result(),ensure_ascii=False)+'\n');out.flush()
        if time.time()-start>160: os._exit(0)
