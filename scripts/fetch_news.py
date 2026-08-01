from __future__ import annotations
import hashlib, html, json, re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import quote
import feedparser

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "data" / "news.json"

FEEDS = [
    ("Google Haberler", "https://news.google.com/rss/search?q=" + quote('"Borsa İstanbul" OR BIST OR KAP when:2d') + "&hl=tr&gl=TR&ceid=TR:tr"),
    ("Sözcü Borsa", "https://www.sozcu.com.tr/feeds-rss-category-borsa"),
    ("Sözcü Finans", "https://www.sozcu.com.tr/feeds-rss-category-finans"),
]

POSITIVE = ("yüksel", "artış", "rekor", "kâr", "kar açıklad", "temettü", "ihale kaz", "anlaşma imz", "yatırım kararı", "geri alım")
NEGATIVE = ("düş", "kayıp", "zarar", "ceza", "soruşturma", "iflas", "temerrüt", "satış baskısı", "geriledi", "iptal")
TICKERS = ("THYAO","ASELS","TUPRS","EREGL","AKBNK","GARAN","YKBNK","ISCTR","KCHOL","SAHOL","SISE","BIMAS","FROTO","TOASO","PETKM")

def clean(text: str) -> str:
    text = html.unescape(text or "")
    text = re.sub(r"<[^>]+>", " ", text)
    return re.sub(r"\s+", " ", text).strip()

def classify(text: str):
    lower = text.lower()
    p = sum(k in lower for k in POSITIVE)
    n = sum(k in lower for k in NEGATIVE)
    if p > n: return "positive", "Olumlu"
    if n > p: return "negative", "Olumsuz"
    return "neutral", "Nötr"

def tags(text: str):
    upper = text.upper()
    found = [t for t in TICKERS if t in upper]
    if "BIST" in upper or "BORSA İSTANBUL" in upper: found.append("BIST")
    if "KAP" in upper: found.append("KAP")
    return list(dict.fromkeys(found))[:5]

items, seen = [], set()
for source, url in FEEDS:
    feed = feedparser.parse(url)
    for entry in feed.entries[:25]:
        title = clean(entry.get("title",""))
        link = entry.get("link","")
        key = hashlib.sha1(title.lower().encode("utf-8")).hexdigest()
        if not title or key in seen: continue
        seen.add(key)
        summary = clean(entry.get("summary",""))[:280]
        published = entry.get("published_parsed") or entry.get("updated_parsed")
        dt = datetime(*published[:6], tzinfo=timezone.utc) if published else datetime.now(timezone.utc)
        sentiment, label = classify(title + " " + summary)
        items.append({
            "id": key[:12], "title": title, "summary": summary, "link": link,
            "source": source, "published": dt.isoformat(), "sentiment": sentiment,
            "sentimentLabel": label, "tags": tags(title + " " + summary)
        })

items.sort(key=lambda x: x["published"], reverse=True)
payload = {"updatedAt": datetime.now(timezone.utc).isoformat(), "items": items[:60]}
OUTPUT.parent.mkdir(exist_ok=True)
OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"{len(payload['items'])} haber yazıldı: {OUTPUT}")
