import re, json, time, threading, queue, urllib.request, os
UA={'User-Agent':'Mozilla/5.0 (compatible; nikalimp-fonts/1.0)'}
def get(u):
    for a in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=30) as r: return r.read().decode('utf8','replace')
        except Exception as e: err=e; time.sleep(3)
    raise err
slugs=[json.loads(l)['slug'] for l in open('fonts.jsonl')]
M={}; tags={}; lock=threading.Lock(); Q=queue.Queue()
# главная и её страницы + все страницы шрифтов: карточки «Смотрите также» дают svg и тег
for u in ['https://www.fonts.uprock.ru/']+[f'https://www.fonts.uprock.ru/fonts/{s}' for s in slugs]: Q.put(u)
def w():
    while True:
        try: u=Q.get_nowait()
        except queue.Empty: return
        try: h=get(u)
        except Exception as e: print('ERR',u,e,flush=True); continue
        for slug,svg,tag in re.findall(r'href="/fonts/([^"]+)" class="font-page-card[^"]*"><h[23] class="fonts-title">.*?</h[23]><img src="([^"]+)".*?class="fonts-tag">([^<]*)<',h,re.S):
            with lock: M.setdefault(slug,svg); tags.setdefault(slug,tag)
        time.sleep(0.2)
ts=[threading.Thread(target=w) for _ in range(5)]; [t.start() for t in ts]; [t.join() for t in ts]
json.dump({'svg':M,'tag':tags},open('svgmap.json','w'),ensure_ascii=False)
print(len(M), len(slugs), sum(1 for s in slugs if s in M))
