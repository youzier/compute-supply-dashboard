"use client";

import { useEffect, useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ExternalLink } from "lucide-react";
import { tpuPrices, tpuPriceSource, verifiedAt, type TpuPrice } from "./tpuPricing";

type Quote = { min: number; median: number; inStockMin: number | null; minAvailability: string; count: number; providers: number };
type Point = { date: string; min: number; median: number };
type Feed = { gpu: string; generatedAt: string | null; latest: Quote | null; points: Point[] };
const match: Record<string, { series: string[]; scope: string }> = {
  A100: { series: ["A100 40GB", "A100 80GB"], scope: "报价按 40GB／80GB 分列；交付数据的 A100 未细分全部形态。" },
  "H100/H200": { series: ["H100", "H200"], scope: "交付量合并 H100/H200；两种 GPU 的报价单独统计。" },
  B200: { series: ["B200"], scope: "报价对应目录中的 B200；交付估算口径包含少量 B100，且不同云实例配置未拆分。" },
  B300: { series: ["B300"], scope: "仅对应云目录中明确标记为 B300 的报价。" },
  MI300X: { series: ["MI300X"], scope: "仅对应云目录中明确标记为 MI300X 的报价。" },
  MI350X: { series: ["MI350X"], scope: "仅对应云目录中明确标记为 MI350X 的报价。" },
  MI355X: { series: ["MI355X"], scope: "仅对应云目录中明确标记为 MI355X 的报价。" },
};
const catalog = "https://gpuprice.becloudready.com/gpu";
const money = (v: number) => "$" + v.toFixed(2);
type RawOffer = { gpu_model?: string; provider?: string; price_per_gpu_hour_usd?: number; availability?: string; pricing?: string; currency?: string };
function summarize(rows: RawOffer[], gpu: string): Quote | null {
  const offers = rows.filter(r => r.gpu_model === gpu && r.pricing === "on_demand" && r.currency === "USD" &&
    typeof r.price_per_gpu_hour_usd === "number" && Number.isFinite(r.price_per_gpu_hour_usd) && r.price_per_gpu_hour_usd > 0);
  if (!offers.length) return null;
  const prices = offers.map(r => r.price_per_gpu_hour_usd as number).sort((a, b) => a - b);
  const mid = Math.floor(prices.length / 2);
  const available = offers.filter(r => r.availability === "in_stock").map(r => r.price_per_gpu_hour_usd as number);
  return { min: prices[0], median: prices.length % 2 ? prices[mid] : (prices[mid - 1] + prices[mid]) / 2,
    inStockMin: available.length ? Math.min(...available) : null,
    minAvailability: offers.filter(r => r.price_per_gpu_hour_usd === prices[0]).every(r => r.availability === "out_of_stock") ? "out_of_stock" : "mixed",
    count: offers.length, providers: new Set(offers.map(r => r.provider).filter(Boolean)).size };
}
async function directFeeds(models: string[]): Promise<Record<string, Feed>> {
  const base = "https://freellm.org";
  const [latestResponse, metaResponse] = await Promise.all([fetch(base + "/latest/all.json", {signal:AbortSignal.timeout(12000)}), fetch(base + "/latest/meta.json", {signal:AbortSignal.timeout(12000)})]);
  if (!latestResponse.ok || !metaResponse.ok) throw new Error("Catalog unavailable");
  const rows: RawOffer[] = await latestResponse.json(), meta = await metaResponse.json();
  if (!Array.isArray(rows)) throw new Error("Invalid catalog");
  const generatedAt = typeof meta.generated_at_utc === "string" ? meta.generated_at_utc : null;
  const today = generatedAt ? new Date(generatedAt) : new Date();
  const dates = Array.from({ length: 14 }, (_, i) =>
    new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 13 + i)).toISOString().slice(0, 10));
  const archive = await Promise.allSettled(dates.map(async date => {
    const response = await fetch(base + "/history/" + date + "/all.json", {signal:AbortSignal.timeout(12000)});
    if (!response.ok) throw new Error("Missing archive");
    return await response.json() as RawOffer[];
  }));
  return Object.fromEntries(models.map(gpu => [gpu, { gpu, generatedAt, latest: summarize(rows, gpu),
    points: archive.flatMap((r, i) => {
      if (r.status !== "fulfilled" || !Array.isArray(r.value)) return [];
      const q = summarize(r.value, gpu);
      return q ? [{ date: dates[i], min: q.min, median: q.median }] : [];
    }) }]));
}

export default function RentalPanel({ model, quarter }: { model: string; quarter: string }) {
  const isTpu = model.startsWith("TPU "), isTrainium = model.startsWith("Trainium");
  const selected = match[model];
  const [status, setStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [feeds, setFeeds] = useState<Record<string, Feed>>({});
  const [tpuRows, setTpuRows] = useState<TpuPrice[]>(tpuPrices);
  const [tpuState, setTpuState] = useState<"live" | "snapshot">("snapshot");
  const [tpuChecked, setTpuChecked] = useState(verifiedAt);
  const [region, setRegion] = useState("");
  const [purchase, setPurchase] = useState<"onDemand" | "flex" | "calendar" | "oneYear" | "threeYear">("onDemand");
  useEffect(() => {
    if (!isTpu) return;
    let active = true;
    fetch("data/tpuprice.json", { cache: "no-store" }).then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { if (active && Array.isArray(data.rows)) {
        setTpuRows(data.rows); setTpuState(data.status === "live" ? "live" : "snapshot");
        setTpuChecked(data.checkedAt || verifiedAt);
      } }).catch(() => { /* the local dated snapshot remains visible */ });
    return () => { active = false; };
  }, [isTpu]);
  useEffect(() => {
    if (isTpu || isTrainium || !selected) return;
    let active = true;
    setStatus("loading"); setFeeds({});
    fetch("data/gpuprice.json", { cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error("Catalog unavailable");
      const data = await response.json();
      if (data.status === "unavailable") throw new Error("Catalog unavailable");
      return Object.fromEntries(selected.series.map(gpu => [gpu, data.feeds[gpu] || {gpu, generatedAt:data.generatedAt, latest:null, points:[]}]));
    }).then(data => { if (active) { setFeeds(data); setStatus("ready"); } })
      .catch(() => { if (active) setStatus("unavailable"); }).finally(() => directFeeds(selected.series).then(data => { if (active) { setFeeds(data); setStatus("ready"); } }).catch(() => {}));
    return () => { active = false; };
  }, [model, isTpu, isTrainium]);
  const series = selected?.series || [];
  const chart = useMemo(() => {
    const rows = new Map<string, Record<string, number | string>>();
    for (const gpu of series) for (const p of feeds[gpu]?.points || []) {
      const row = rows.get(p.date) || { date: p.date };
      row[gpu] = p.median;
      rows.set(p.date, row);
    }
    return [...rows.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [feeds, model]);
  const tpuOptions = tpuRows.filter(r => r.model === model);
  const selectedRegion = tpuOptions.find(r => r.region === region) || tpuOptions[0];
  const rate = selectedRegion?.[purchase];
  const priceText = (value: number | null | undefined) => value == null ? "—" : "$" + value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");

  if (isTpu) return <section className="card rental-panel" aria-label="TPU 云端价格">
    <div className="heading"><div><span className="over">01 / CLOUD PRICE</span><h2>TPU 云端价格</h2></div><span className="subtle">区域与采购方式不同 · 不随 {quarter} 季度筛选</span></div>
    <p className="rental-lead">Google Cloud 公布的美元／TPU 芯片·小时价格；按地区及购买方式选择。它是云服务标价，不是 TPU 硬件采购价或实际成交价。</p>
    {selectedRegion ? <><div className="tpu-controls"><label>地区<select value={selectedRegion.region} onChange={e => setRegion(e.target.value)}>{tpuOptions.map(r => <option value={r.region} key={r.region}>{r.region} · {r.location}</option>)}</select></label><label>购买方式<select value={purchase} onChange={e => setPurchase(e.target.value as typeof purchase)}><option value="onDemand">按需</option><option value="flex">DWS Flex-start</option><option value="calendar">DWS Calendar</option><option value="oneYear">1 年承诺</option><option value="threeYear">3 年承诺</option></select></label></div>
      <div className="tpu-price"><div><small>{model} · {selectedRegion.product} · {selectedRegion.region}</small><strong>{priceText(rate)}<em> / 芯片·小时</em></strong><span>{rate == null ? "该地区未列出此购买方式的价格" : purchase === "onDemand" ? "公开按需标价" : "对应购买方式的公开标价"}</span></div><div><small>同地区按需价</small><b>{priceText(selectedRegion.onDemand)}</b><span>不同购买方式不可直接视为市场折价</span></div></div>
      <div className="tpu-region-list"><b>各地区按需价</b><div>{tpuOptions.map(r => <span key={r.region}>{r.region} <strong>{priceText(r.onDemand)}</strong></span>)}</div></div>
    </> : <div className="rental-empty"><b>{model} 未列于公开定价表</b><p>没有与该型号可直接匹配的 Google Cloud SKU；不以相邻代际或内部使用价格代替。</p></div>}
    <div className="rental-foot"><a href={tpuPriceSource} target="_blank" rel="noreferrer">Google Cloud TPU 定价原表 ↗</a><span>{tpuState === "live" ? "在线读取" : "核对快照"} · {tpuChecked.slice(0, 10)} · 无历史价格序列</span></div>
  </section>;
  if (isTrainium) return <section className="card rental-panel" aria-label="AWS Trainium 实例价格">
    <div className="heading"><div><span className="over">01 / CLOUD PRICE</span><h2>AWS Trainium 实例价格</h2></div><span className="subtle">地区与实例规格不同 · 不随 {quarter} 季度筛选</span></div>
    <div className="rental-empty"><b>{model} 暂无同口径单颗租价序列</b><p>AWS 按 Trn 实例或 UltraServer 整机和地区标价；实例费用还包含主机、内存、网络等资源，不能直接视为单颗 Trainium 的成交价或采购价。</p><a href={model === "Trainium1" ? "https://aws.amazon.com/ec2/instance-types/trn1/" : model === "Trainium2" ? "https://aws.amazon.com/ec2/instance-types/trn2/" : "https://aws.amazon.com/ec2/instance-types/trn3/"} target="_blank" rel="noreferrer">查看对应 AWS 实例与定价入口 <ExternalLink size={13}/></a></div>
    <div className="rental-foot"><span>没有可直接与 GPU 每颗小时目录价比较的单颗序列；供应商收益仍需份额、合同价和毛利数据。</span></div>
  </section>;
  return <section className="card rental-panel" aria-label="GPU 租赁价格">
    <div className="heading"><div><span className="over">01 / RENTAL PRICE</span><h2>GPU 租赁价格</h2></div><span className="subtle">独立日度报价 · 不随 {quarter} 季度筛选</span></div>
    <p className="rental-lead">云厂商公开目录中的按需挂牌价，单位为美元／GPU·小时。最低价可能缺货；中位数按目录条目计算，均非实际成交价或 GPU 采购价。</p>
    {!selected ? <div className="rental-empty"><b>{model} 暂无精确型号的公开报价</b><p>数据源没有与该型号直接匹配的条目，不使用相近型号代替。</p><a href={catalog} target="_blank" rel="noreferrer">查看原站 GPU 目录 <ExternalLink size={13}/></a></div> : <>
      <p className="rental-scope">型号映射：{selected.scope}</p>
      {status === "ready" ? <>
        <div className="rental-quotes">{series.map(gpu => { const data = feeds[gpu], quote = data?.latest; return <a key={gpu} href={catalog} target="_blank" rel="noreferrer"><small>{gpu} · 按需挂牌价</small>{quote ? <><strong>{money(quote.median)}<em> / GPU·小时 · 中位数</em></strong><span>最低 {money(quote.min)}{quote.minAvailability === "out_of_stock" ? "（缺货）" : ""} · {quote.count} 条 / {quote.providers} 家</span><span>最低明确可用 {quote.inStockMin === null ? "未标明" : money(quote.inStockMin)}</span></> : <><strong>暂无报价</strong><span>当前目录没有精确匹配条目</span></>}<span>{data?.generatedAt ? "更新 " + data.generatedAt.slice(0, 10) : "更新时间未知"} · 查看原站 <ExternalLink size={12}/></span></a>; })}</div>
        {chart.length > 1 && <div className="rental-chart"><div className="rental-chart-title">近 14 天目录中位数 · $/GPU·小时（样本组成可能变化）</div><ResponsiveContainer width="100%" height="100%"><LineChart data={chart} margin={{ top: 10, right: 12, bottom: 0, left: -21 }}><CartesianGrid vertical={false} stroke="#E6EAF1" strokeDasharray="3 4"/><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#8C97A7" }} minTickGap={18}/><YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#8C97A7" }} tickFormatter={v => "$" + v}/><Tooltip formatter={(v:any, name:any) => [money(Number(v)), name]}/>{series.map((gpu, i) => <Line key={gpu} dataKey={gpu} name={gpu} type="monotone" connectNulls stroke={i ? "#41B3A4" : "#476FFF"} strokeWidth={2.4} dot={false}/>)}</LineChart></ResponsiveContainer></div>}
      </> : <div className="rental-empty"><b>{status === "loading" ? "读取公开报价与历史记录…" : "租价源暂不可用"}</b><p>{status === "loading" ? "正在按型号汇总公开目录。" : "当前无法读取报价；可到原站核对最新目录。"}</p><a href={catalog} target="_blank" rel="noreferrer">查看原站 GPU 目录 <ExternalLink size={13}/></a></div>}
    </>}
    <div className="rental-foot"><a href={catalog} target="_blank" rel="noreferrer">租价数据：beCloudReady GPU Price ↗</a><span>公开按需挂牌 · 每晚更新 · 非成交价、合同价或供应商收入</span></div>
  </section>;
}
