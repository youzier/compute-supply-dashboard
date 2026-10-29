"""Refresh public data for static hosting; failed sources retain their dated snapshot."""
import concurrent.futures
import csv
import datetime as dt
import html
import io
import json
import pathlib
import re
import statistics
import urllib.request
from html.parser import HTMLParser

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "public" / "data"
DATA.mkdir(parents=True, exist_ok=True)
MODELS = ["A100 40GB", "A100 80GB", "H100", "H200", "B200", "B300", "MI300X", "MI350X", "MI355X"]
EPOCH = {
    "sales": "ai_chip_sales_timelines_by_chip.csv",
    "components": "ai_chip_components_quarterly_by_chip.csv",
    "supply": "ai_chip_components_supply_denominators.csv",
    "centers": "data_centers/data_centers.csv",
    "deployments": "data_centers/data_centers_chip_quantities.csv",
    "chipTypes": "ai_chip_sales_chip_types.csv",
}

def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "compute-supply-dashboard/1.0"})
    with urllib.request.urlopen(request, timeout=25) as response:
        return response.read().decode("utf-8-sig")

def get_json(url):
    return json.loads(fetch(url))

def save(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, separators=(",", ":")) + "\n")

def epoch():
    def one(item):
        key, path = item
        body = fetch("https://epoch.ai/data/" + path)
        parsed = list(csv.reader(io.StringIO(body)))
        if len(parsed) < 2 or len(parsed[0]) < 3 or "<html" in body[:300].lower():
            raise ValueError("Invalid Epoch CSV")
        return key, body
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        rows = list(pool.map(one, EPOCH.items()))
    folder = ROOT / "public" / "snapshots"
    for key, body in rows:
        (folder / (key + ".csv")).write_text(body)
    manifest_path = folder / "manifest.json"
    manifest = json.loads(manifest_path.read_text()) if manifest_path.exists() else {}
    manifest["retrieved_at"] = dt.datetime.now(dt.timezone.utc).isoformat()
    save(manifest_path, manifest)

def summarize(rows, gpu):
    offers = [r for r in rows if r.get("gpu_model") == gpu and r.get("pricing") == "on_demand"
              and r.get("currency") == "USD" and isinstance(r.get("price_per_gpu_hour_usd"), (int, float))
              and r["price_per_gpu_hour_usd"] > 0]
    if not offers:
        return None
    prices = [r["price_per_gpu_hour_usd"] for r in offers]
    available = [r["price_per_gpu_hour_usd"] for r in offers if r.get("availability") == "in_stock"]
    low = min(prices)
    return {"min": low, "median": statistics.median(prices),
            "inStockMin": min(available) if available else None,
            "minAvailability": "out_of_stock" if all(r.get("availability") == "out_of_stock"
                for r in offers if r["price_per_gpu_hour_usd"] == low) else "mixed",
            "count": len(offers), "providers": len({r["provider"] for r in offers if r.get("provider")})}

def gpu():
    base = "https://freellm.org"
    latest = get_json(base + "/latest/all.json")
    meta = get_json(base + "/latest/meta.json")
    if not isinstance(latest, list) or not latest or not meta.get("generated_at_utc"):
        raise ValueError("Invalid GPU catalog")
    generated = meta["generated_at_utc"]
    today = dt.date.fromisoformat(generated[:10])
    dates = [(today - dt.timedelta(days=i)).isoformat() for i in reversed(range(14))]
    def archive(date):
        try:
            rows = get_json(base + "/history/" + date + "/all.json")
            return date, rows if isinstance(rows, list) else []
        except Exception:
            return date, []
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        history = list(pool.map(archive, dates))
    feeds = {}
    for model in MODELS:
        points = []
        for date, rows in history:
            quote = summarize(rows, model)
            if quote:
                points.append({"date": date, "min": quote["min"], "median": quote["median"]})
        feeds[model] = {"gpu": model, "generatedAt": generated, "latest": summarize(latest, model), "points": points}
    save(DATA / "gpuprice.json", {"status": "snapshot", "generatedAt": generated, "feeds": feeds})

class TableParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.rows, self.cells, self.cell = [], [], None
    def handle_starttag(self, tag, attrs):
        if tag == "tr":
            self.cells = []
        elif tag in ("td", "th"):
            self.cell = []
    def handle_data(self, data):
        if self.cell is not None:
            self.cell.append(data)
    def handle_endtag(self, tag):
        if tag in ("td", "th") and self.cell is not None:
            self.cells.append(re.sub(r"\s+", " ", html.unescape(" ".join(self.cell))).strip())
            self.cell = None
        elif tag == "tr" and self.cells:
            self.rows.append(self.cells)
            self.cells = []

def tpu():
    body = fetch("https://cloud.google.com/tpu/pricing")
    if "per chip-hour" not in body:
        raise ValueError("TPU price unit not found")
    parser = TableParser()
    parser.feed(body)
    models = {"Ironwood": "TPU v7", "Trillium": "TPU v6e", "TPU v5p": "TPU v5p",
              "TPU v5e": "TPU v5e", "TPU v4 pod": "TPU v4"}
    def amount(value):
        match = re.search(r"\$([\d,.]+)", value)
        return float(match[1].replace(",", "")) if match else None
    rows, product = [], ""
    for original in parser.rows:
        cells = list(original)
        if len(cells) == 8:
            product = cells.pop(0)
        if len(cells) != 7 or product not in models:
            continue
        region, location, *prices = cells
        if not re.fullmatch(r"[a-z]+-[a-z]+\d", region):
            continue
        values = [amount(value) for value in prices]
        if any(values[i] is None for i in (0, 3, 4)):
            continue
        rows.append(dict(zip(["model", "product", "region", "location", "onDemand", "flex",
                              "calendar", "oneYear", "threeYear"],
                             [models[product], product, region, location, *values])))
    if len(rows) < 12 or len({r["model"] for r in rows}) < 5:
        raise ValueError("Incomplete or changed TPU pricing table")
    save(DATA / "tpuprice.json", {"status": "snapshot", "checkedAt": dt.datetime.now(dt.timezone.utc).isoformat(), "rows": rows})

if __name__ == "__main__":
    for name, update in (("Epoch", epoch), ("GPU prices", gpu), ("TPU prices", tpu)):
        try:
            update()
            print(name + ": refreshed")
        except Exception as error:
            print(name + ": retained previous snapshot (" + type(error).__name__ + ")")
    if not (DATA / "gpuprice.json").exists():
        save(DATA / "gpuprice.json", {"status": "unavailable", "generatedAt": None, "feeds": {}})
