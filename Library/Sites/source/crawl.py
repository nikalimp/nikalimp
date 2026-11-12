import json,urllib.request,time,os
st=json.load(open("state.json")) if os.path.exists("state.json") else {"s":1,"items":{}}
s=st["s"];out=st["items"];n=0
while s:
    u=f"https://mot.tildacdn.com/api/ui/getsiteslist/?lang=ru&slice={s}"
    for t in range(4):
        try: d=json.load(urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"Mozilla/5.0"}),timeout=30));break
        except Exception: time.sleep(3)
    else: break
    for x in d["sites"]: out[str(x["uid"])]=x
    s=d.get("nextslice");n+=1
    if n%10==0 or not s:
        json.dump({"s":s,"items":out},open("state.tmp","w"),ensure_ascii=False);os.replace("state.tmp","state.json")
        print(s,len(out),flush=True)
    time.sleep(0.25)
print("done",len(out),flush=True)
