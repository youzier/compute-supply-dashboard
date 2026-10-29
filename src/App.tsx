"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BarChart3, Check, ChevronDown, CircleAlert, Clock3, Database, ExternalLink, Layers3, RefreshCw, Search, Server, X } from "lucide-react";
import { Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { defaultGpuProfile, gpuProfiles } from "./gpuProfiles";
import RentalPanel from "./RentalPanel";
import SupplierProfile from "./SupplierProfile";
import ComponentPressureInfo from "./ComponentPressureInfo";

type Row = Record<string, string>;
type Key = "sales" | "components" | "supply" | "centers" | "deployments" | "chipTypes";
const keys: Key[] = ["sales", "components", "supply", "centers", "deployments", "chipTypes"];
const paths: Record<Key, string> = {
  sales: "ai_chip_sales_timelines_by_chip.csv", components: "ai_chip_components_quarterly_by_chip.csv",
  supply: "ai_chip_components_supply_denominators.csv", centers: "data_centers/data_centers.csv",
  deployments: "data_centers/data_centers_chip_quantities.csv",
  chipTypes: "ai_chip_sales_chip_types.csv",
};
const labels: Record<Key, string> = { sales: "算力型号交付", components: "型号部件消耗", supply: "全球部件供给", centers: "数据中心项目", deployments: "站点型号部署", chipTypes: "算力型号元数据" };
const providers: Record<Key, string> = { sales: "Epoch AI", components: "Epoch AI", supply: "Epoch AI", centers: "Epoch AI", deployments: "Epoch AI", chipTypes: "Epoch AI" };
function csv(text: string): Row[] {
  const lines: string[][] = []; let field = "", row: string[] = [], quoted = false;
  for (let i = 0, s = text.replace(/^\uFEFF/, ""); i < s.length; i++) {
    const c = s[i];
    if (quoted) { if (c === '"' && s[i+1] === '"') { field += '"'; i++; } else if (c === '"') quoted = false; else field += c; }
    else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ""; }
    else if (c === '\n') { row.push(field.replace(/\r$/, "")); if (row.some(Boolean)) lines.push(row); row=[]; field=""; }
    else field += c;
  }
  row.push(field.replace(/\r$/, "")); if (row.some(Boolean)) lines.push(row);
  const heads = lines.shift() || [];
  return lines.map(r => Object.fromEntries(heads.map((h,i)=>[h,r[i]||""])));
}
const num = (x?: string) => Number(x || 0) || 0;
const norm = (x?: string) => (x||"").trim().toLowerCase();
const qtr = (date: string) => `${date.slice(0,4)} Q${Math.floor((Number(date.slice(5,7))-1)/3)+1}`;
const cq = (text: string) => { const match = /^Q([1-4]) (20\d\d)$/.exec(text); return match ? `${match[2]} Q${match[1]}` : text; };
const endDate = (q: string) => { const [y,n]=q.split(" Q"); return `${y}-${String(Number(n)*3).padStart(2,"0")}-31`; };
const fmt = (x: number) => !Number.isFinite(x) ? "—" : Math.abs(x)>=1e6 ? `${(x/1e6).toFixed(2)}m` : Math.abs(x)>=1000 ? `${(x/1000).toFixed(1)}k` : Math.round(x).toLocaleString("en-US");
const dollars = (x: number) => x ? `$${x>=1e9 ? `${(x/1e9).toFixed(2)}b` : x>=1e6 ? `${(x/1e6).toFixed(1)}m` : fmt(x)}` : "—";
const grp = (x?:string) => /nvidia/i.test(x||"")?"NVIDIA":/amd/i.test(x||"")?"AMD":/google/i.test(x||"")?"Google TPU":/amazon/i.test(x||"")?"AWS Trainium":"其他";
function Badge({children,tone="blue"}:{children:React.ReactNode;tone?:string}){return <span className={`badge ${tone}`}>{children}</span>}
function Card({children,className=""}:{children:React.ReactNode;className?:string}){return <section className={`card ${className}`}>{children}</section>}
function Heading({over,title,side}:{over:string;title:string;side?:React.ReactNode}){return <div className="heading"><div><span className="over">{over}</span><h2>{title}</h2></div>{side}</div>}
function Tip({active,payload,label}:any){return active&&payload?.length?<div className="tip"><b>{label}</b>{payload.map((p:any,i:number)=><div key={i}><i style={{background:p.color}}/>{p.name}: <strong>{fmt(p.value)}</strong></div>)}</div>:null}

export default function Home(){
  const [raw,setRaw]=useState<Partial<Record<Key,Row[]>>>({});
  const [state,setState]=useState<Partial<Record<Key,"live"|"snapshot"|"missing">>>({});
  const [loading,setLoading]=useState(true),[refreshing,setRefreshing]=useState(false);
  const [model,setModel]=useState("B200"),[period,setPeriod]=useState("2025 Q4");
  const [query,setQuery]=useState(""),[all,setAll]=useState(false),[loadedAt,setLoadedAt]=useState("");
  const [snapshotAt,setSnapshotAt]=useState("");
  async function load(fresh=false){
    if(fresh)setRefreshing(true);else setLoading(true);
    const out=await Promise.all(keys.map(async key=>{
      try{const r=await fetch(`https://epoch.ai/data/${paths[key]}`,{cache:"no-store"});if(!r.ok)throw 0;return {key,rows:csv(await r.text()),status:"live" as const}}
      catch{try{const r=await fetch(`snapshots/${key}.csv`,{cache:"no-store"});if(!r.ok)throw 0;return {key,rows:csv(await r.text()),status:"snapshot" as const}}catch{return {key,rows:[],status:"missing" as const}}}
    }));
    setRaw(Object.fromEntries(out.map(r=>[r.key,r.rows])));setState(Object.fromEntries(out.map(r=>[r.key,r.status])));
    if(out.some(r=>r.status==="snapshot")){
      try{const meta=await (await fetch("snapshots/manifest.json",{cache:"no-store"})).json();setSnapshotAt(new Date(meta.retrieved_at).toLocaleDateString("zh-CN",{timeZone:"Asia/Shanghai",year:"numeric",month:"2-digit",day:"2-digit"}));}catch{setSnapshotAt("日期未知");}
    } else setSnapshotAt("");
    setLoadedAt(new Date().toLocaleString("zh-CN",{timeZone:"Asia/Shanghai",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit"}));setLoading(false);setRefreshing(false);
  }
  useEffect(()=>{load()},[]);
  const sales=raw.sales||[],parts=raw.components||[],supply=raw.supply||[],centers=raw.centers||[],deploy=raw.deployments||[];
  const chipTypes=raw.chipTypes||[];
  const gpuModels=useMemo(()=>[...new Set(sales.filter(r=>/^(nvidia|amd)$/i.test(r["Chip manufacturer"])).map(r=>r["Chip type"]).filter(Boolean))].sort((a,b)=>a==="B200"?-1:b==="B200"?1:a.localeCompare(b)),[sales]);
  const tpuModels=useMemo(()=>[...new Set(sales.filter(r=>/^google$/i.test(r["Chip manufacturer"])&&/^TPU /i.test(r["Chip type"])).map(r=>r["Chip type"]))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),[sales]);
  const trainiumModels=useMemo(()=>[...new Set(sales.filter(r=>/^amazon$/i.test(r["Chip manufacturer"])&&/^Trainium\d+$/i.test(r["Chip type"])).map(r=>r["Chip type"]))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true})),[sales]);
  const models=[...gpuModels,...tpuModels,...trainiumModels];
  const periods=useMemo(()=>[...new Set(sales.map(r=>qtr(r["Start date"])).filter(q=>/^20\d\d Q[1-4]$/.test(q)))].sort().reverse(),[sales]);
  const m=models.includes(model)?model:models[0]||model,q=periods.includes(period)?period:periods[0]||period;
  const metadataFor=(name:string)=>chipTypes.filter(r=>(name==="H100/H200"?["H100","H200"].includes(r.Name):r.Name.replace(/^Instinct /,"")===name));
  const memoryFor=(name:string)=>[...new Set(metadataFor(name).map(r=>num(r.Memory)/1e9).filter(Boolean))].map(x=>`${x.toFixed(0)} GB`).join(" / ")||"—";
  const h100eFor=(name:string)=>{const x=metadataFor(name)[0]?.H100e;return x?`${Number(x).toFixed(2)}×`:"—"};
  const profile=gpuProfiles[m]||defaultGpuProfile;
  const one=sales.filter(r=>norm(r["Chip type"])===norm(m)&&qtr(r["Start date"])===q);
  const designer=grp(one[0]?.["Chip manufacturer"]||sales.find(r=>norm(r["Chip type"])===norm(m))?.["Chip manufacturer"]);
  const part=parts.filter(r=>norm(r["Chip type"])===norm(m)&&grp(r.Designer)===designer&&cq(r.Quarter)===q);
  const sup=supply.find(r=>cq(r.Quarter)===q);
  const count=one.reduce((a,r)=>a+num(r["Number of Units"]),0),compute=one.reduce((a,r)=>a+num(r["Compute estimate in H100e (median)"]),0);
  const chipPrice=count?one.reduce((a,r)=>a+num(r["Cost Estimate (USD)"]),0)/count:0;
  const usage={logic:part.reduce((a,r)=>a+num(r["Logic wafers (median)"]),0),cowos:part.reduce((a,r)=>a+num(r["CoWoS wafers (median)"]),0),hbm:part.reduce((a,r)=>a+num(r["HBM cost (USD) (median)"]),0)};
  const share={logic:sup?100*usage.logic/num(sup["Logic supply (median)"]):0,cowos:sup?100*usage.cowos/num(sup["CoWoS supply (median)"]):0,hbm:sup?100*usage.hbm/num(sup["HBM supply (USD) (median)"]):0};
  const supplyQuarters=new Set(supply.map(r=>cq(r.Quarter)));
  const partsLatest=[...new Set(parts.filter(r=>norm(r["Chip type"])===norm(m)&&grp(r.Designer)===designer&&supplyQuarters.has(cq(r.Quarter))).map(r=>cq(r.Quarter)))].sort().at(-1)||"—";
  const trace=useMemo(()=>[...new Set(sales.map(r=>qtr(r["Start date"])))].sort().filter(x=>x>="2024 Q1").map(x=>({name:x.replace("20","’"),model:sales.filter(r=>qtr(r["Start date"])===x&&norm(r["Chip type"])===norm(m)).reduce((a,r)=>a+num(r["Compute estimate in H100e (median)"]),0),gpu:sales.filter(r=>qtr(r["Start date"])===x&&/^(nvidia|amd)$/i.test(r["Chip manufacturer"])).reduce((a,r)=>a+num(r["Compute estimate in H100e (median)"]),0),rivals:sales.filter(r=>qtr(r["Start date"])===x&&/^(google|amazon)$/i.test(r["Chip manufacturer"])).reduce((a,r)=>a+num(r["Compute estimate in H100e (median)"]),0)})),[sales,m]);
  const partTrace=useMemo(()=>[...new Set(parts.map(r=>cq(r.Quarter)))].sort().map(x=>{const rs=parts.filter(r=>cq(r.Quarter)===x&&norm(r["Chip type"])===norm(m)&&grp(r.Designer)===designer),s=supply.find(r=>cq(r.Quarter)===x);return {name:x.replace("20","’"),cowos:s&&rs.length?100*rs.reduce((a,r)=>a+num(r["CoWoS wafers (median)"]),0)/num(s["CoWoS supply (median)"]):null,hbm:s&&rs.length?100*rs.reduce((a,r)=>a+num(r["HBM cost (USD) (median)"]),0)/num(s["HBM supply (USD) (median)"]):null}}),[parts,supply,m,designer]);
  // Dated site/model rows are stock observations. Keep the latest per site, never sum dates.
  const sites=useMemo(()=>{
    const wanted=m.split("/").map(norm), latest=new Map<string,Row>();
    for(const r of deploy){if(!wanted.includes(norm(r["Chip type"]))||r.Date>endDate(q)||!r["Data center"]||!Number.isFinite(Number(r["Number of Units"])))continue;
      const id=`${r["Data center"]}|${r["Chip type"]}`,old=latest.get(id);if(!old||r.Date>old.Date)latest.set(id,r);
    }
    const joined=new Map<string,{name:string;count:number;date:string;owner:string;country:string}>();
    for(const r of latest.values()){const name=r["Data center"],parent=centers.find(c=>c.Name===name),old=joined.get(name);if(old){old.count+=num(r["Number of Units"]);if(r.Date>old.date)old.date=r.Date}
      else joined.set(name,{name,count:num(r["Number of Units"]),date:r.Date,owner:parent?.Owner||"未注明",country:parent?.Country||"—"});
    }
    return [...joined.values()].sort((a,b)=>b.count-a.count);
  },[deploy,centers,m,q]);
  const known=sites.reduce((a,r)=>a+r.count,0),gpuShown=gpuModels.filter(x=>norm(x).includes(norm(query))).slice(0,all||query?undefined:8),tpuShown=tpuModels.filter(x=>norm(x).includes(norm(query))),trainiumShown=trainiumModels.filter(x=>norm(x).includes(norm(query)));
  const isTpu=m.startsWith("TPU ");
  const isTrainium=m.startsWith("Trainium");
  const isCustom=isTpu||isTrainium;
  const sourceProviders=[...new Set(keys.map(k=>providers[k]))];
  return <main className="shell"><aside className="sidebar"><div className="brand"><div className="brand-icon"><Layers3 size={19}/></div><div><strong>ATLAS <em>/ COMPUTE</em></strong><small>算力供应链研究台</small></div></div><div className="side-caption">研究工作台</div><div className="nav active"><BarChart3 size={17}/> 算力链路 <span>01</span></div><div className="nav"><Server size={17}/> 算力型号 <span>{models.length||"—"}</span></div><div className="nav"><Database size={17}/> 数据血缘</div><div className="divider"/><div className="side-caption">按型号研究</div><label className="search"><Search size={14}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索 GPU / TPU / Trainium"/>{query&&<button onClick={()=>setQuery("")}><X size={13}/></button>}</label><div className="model-list">{gpuShown.length>0&&<><div className="model-group">GPU <span>{gpuModels.length}</span></div>{gpuShown.map(x=><button key={x} className={`model ${m===x?"chosen":""}`} onClick={()=>setModel(x)}><i/>{x}<ArrowRight size={13}/></button>)}{gpuModels.length>8&&!query&&<button className="all" onClick={()=>setAll(!all)}>{all?"收起 GPU":"查看全部 GPU"}</button>}</>}{(tpuShown.length>0||trainiumShown.length>0)&&<><div className="model-group tpu-group">TPU / Trainium <span>{tpuModels.length+trainiumModels.length}</span></div>{tpuShown.map(x=><button key={x} className={`model ${m===x?"chosen":""}`} onClick={()=>setModel(x)}><i/>{x}<ArrowRight size={13}/></button>)}{trainiumShown.map(x=><button key={x} className={`model ${m===x?"chosen":""}`} onClick={()=>setModel(x)}><i/>{x}<ArrowRight size={13}/></button>)}</>}{!gpuShown.length&&!tpuShown.length&&!trainiumShown.length&&<div className="model-no-result">没有匹配型号</div>}</div><div className="side-bottom"><span>数据口径</span><b>来源与方法可追溯</b><small>公开数据 · 原始字段关联<br/>估算具有不确定性</small></div></aside>
  <div className="main"><header className="top"><span>研究台　/　算力供应链　/　<b>{m}</b></span><div><span className="live"><i/>{loading?"连接中":keys.every(k=>state[k]==="snapshot")?"数据快照模式":`${keys.filter(k=>state[k]==="live").length}/${keys.length} 条在线源`}</span><button className="refresh" onClick={()=>load(true)} disabled={refreshing||loading}><RefreshCw size={15} className={refreshing?"spin":""}/>{refreshing?"更新中":"刷新数据"}</button></div></header><div className="content"><div className="hero"><div><span className="over blue-text">SUPPLY CHAIN INTELLIGENCE / ACCELERATOR DATA</span><h1>算力供应链</h1><p>沿着规格、部件、部署逐层追踪。每个数字都有口径，每条关联都有边界。</p></div><label className="period"><span>分析季度</span><select value={q} onChange={e=>setPeriod(e.target.value)}>{periods.map(x=><option key={x}>{x}</option>)}</select><ChevronDown size={14}/></label><label className="mobile-model-select"><span>型号</span><select value={m} onChange={e=>setModel(e.target.value)}><optgroup label="GPU">{gpuModels.map(name=><option key={name}>{name}</option>)}</optgroup><optgroup label="TPU / Trainium">{tpuModels.map(name=><option key={name}>{name}</option>)}{trainiumModels.map(name=><option key={name}>{name}</option>)}</optgroup></select></label></div>
  {loading?<div className="loading"><i/><b>正在读取数据</b><p>汇总规格、部件与项目时间线…</p></div>:<><section id="model-intro" className="gpu-overview" aria-label={`${m} 型号介绍`}><div className="overview-head"><div><span className="over blue-text">{isTpu?"TPU PROFILE":isTrainium?"TRAINIUM PROFILE":"GPU PROFILE"} / 型号介绍</span><h2>{m}<span>{profile.family}</span></h2></div><a href="https://epoch.ai/data/ai-chip-sales-documentation/records" target="_blank" rel="noreferrer">型号字段 <ExternalLink size={13}/></a></div><p className="overview-summary">{profile.summary}</p><p className="overview-context"><CircleAlert size={15}/>{profile.context}</p><div className="overview-specs"><div><small>显存规格</small><strong>{memoryFor(m)}</strong></div><div><small>单颗标称算力</small><strong>{h100eFor(m)} <em>H100e</em></strong></div><div><small>市场口径</small><strong>{metadataFor(m).some(r=>r["Primarily for Chinese market"]==="True")?"主要面向中国市场":isTpu?"Google TPU / 估算口径":isTrainium?"AWS Trainium / 估算口径":"常规型号 / 合并估算"}</strong></div></div></section><SupplierProfile model={m}/><div className="notice"><CircleAlert size={17}/><span><b>口径提示</b>　{partsLatest==="—"?"该规格没有可比较的部件数据；仅展示交付与项目记录。":q>partsLatest?`该规格的可比较部件数据只更新至 ${partsLatest}；当前季度只展示交付与项目记录。`:"部件消耗基于出货估算推导，不能作为独立验证。"} {m.includes("/")?"当前数据将此规格合并统计，不能拆成各型号的独立出货。":""}项目部署仅覆盖已收录的站点。</span></div>
  <div className="metrics"><Card className="metric"><div className="metric-top">该季度交付估算 <Badge>估算值</Badge></div><strong>{one.length?fmt(count):"—"}<small> 颗</small></strong><div className="metric-bottom">{m} · {designer}<span>按型号</span></div></Card><Card className="metric"><div className="metric-top">标称算力 <Badge>H100e</Badge></div><strong>{one.length?fmt(compute):"—"}</strong><div className="metric-bottom">峰值 8-bit 规格换算<span>非有效吞吐</span></div></Card><Card className="metric"><div className="metric-top">CoWoS 供给占用 <Badge tone={part.length?"amber":"muted"}>{part.length?"推导值":"无数据"}</Badge></div><strong>{part.length&&sup?`${share.cowos.toFixed(1)}%`:"—"}</strong><div className="metric-bottom">{part.length?`${fmt(usage.cowos)} 晶圆当量`:partsLatest+" 为最新"}<span>全球分母</span></div></Card><Card className="metric"><div className="metric-top">已记录项目部署 <Badge tone="green">样本内</Badge></div><strong>{sites.length?fmt(known):"—"}<small>{sites.length?" 颗":""}</small></strong><div className="metric-bottom">截至季度末 · {sites.length} 个站点<span>非全球总量</span></div></Card></div>
  <RentalPanel model={m} quarter={q}/>
  <div className="cols"><Card className="chart"><Heading over="02 / SHIPPING & COMPETITION" title="季度算力交付趋势" side={<Badge tone="muted">最新 {periods[0]}</Badge>}/><div className="legend"><span><i style={{background:"#476FFF"}}/>{m}</span><span><i style={{background:"#B3BED4"}}/>GPU 合计</span><span><i style={{background:"#E5A978"}}/>TPU / Trainium 合计</span></div><div className="plot"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={trace} margin={{top:9,right:4,bottom:0,left:-18}}><CartesianGrid vertical={false} stroke="#E6EAF1" strokeDasharray="3 4"/><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fontSize:10,fill:"#8C97A7"}} minTickGap={22}/><YAxis tickFormatter={fmt} tickLine={false} axisLine={false} tick={{fontSize:10,fill:"#8C97A7"}}/><Tooltip content={<Tip/>}/><Area dataKey="gpu" name="GPU 合计" type="monotone" fill="#DFE5F2" stroke="#B3BED4" fillOpacity={.7} strokeWidth={1.5}/><Line dataKey="rivals" name="TPU / Trainium 合计" type="monotone" stroke="#E5A978" strokeWidth={2} dot={false}/><Line dataKey="model" name={m} type="monotone" stroke="#476FFF" strokeWidth={3} dot={false}/></ComposedChart></ResponsiveContainer></div><p className="foot">H100e 标称峰值算力 · 竞争组仅含已收录的 TPU 与 Trainium；选择 TPU 或 Trainium 时该型号也包含在合计线内。不是实际工作负载性能或市场份额预测。</p></Card><Card className="chart"><ComponentPressureInfo latest={partsLatest}/><div className="legend"><span><i style={{background:"#476FFF"}}/>CoWoS</span><span><i style={{background:"#41B3A4"}}/>HBM 金额</span></div><div className="plot"><ResponsiveContainer width="100%" height="100%"><BarChart data={partTrace} margin={{top:9,right:4,bottom:0,left:-18}} barGap={2}><CartesianGrid vertical={false} stroke="#E6EAF1" strokeDasharray="3 4"/><XAxis dataKey="name" tickLine={false} axisLine={false} tick={{fontSize:10,fill:"#8C97A7"}}/><YAxis tickFormatter={(v)=>`${v}%`} tickLine={false} axisLine={false} tick={{fontSize:10,fill:"#8C97A7"}}/><Tooltip formatter={(v:any,name:any)=>[`${Number(v).toFixed(1)}%`,name]}/><Bar dataKey="cowos" name="CoWoS" fill="#476FFF" radius={[4,4,0,0]} maxBarSize={25}/><Bar dataKey="hbm" name="HBM 金额" fill="#41B3A4" radius={[4,4,0,0]} maxBarSize={25}/></BarChart></ResponsiveContainer></div><p className="foot">同季度该型号部件消耗 / 全球供给估计；占用比例不能证明它是当季唯一瓶颈。</p></Card></div>
  <div className="cols"><Card className="project"><Heading over="04 / DEPLOYMENT TRACE" title="项目部署记录" side={<span className="subtle">{m} · 截至 {q}</span>}/><div className="table-scroll"><table><thead><tr><th>数据中心</th><th>硬件拥有者</th><th>国家</th><th>最近记录</th><th>数量</th></tr></thead><tbody>{sites.slice(0,8).map(r=><tr key={r.name}><td><b>{r.name}</b></td><td>{r.owner.replace(/ #(confident|likely|speculative)/g,"")}</td><td>{r.country}</td><td>{r.date}</td><td><b>{fmt(r.count)}</b></td></tr>)}{!sites.length&&<tr><td colSpan={5} className="no-sites">季度末以前没有可匹配的项目型号记录</td></tr>}</tbody></table></div><div className="table-note">仅取每站点同型号最新记录；不可据此反推全球库存。 <a href="https://epoch.ai/data/ai-data-centers" target="_blank" rel="noreferrer">部署原表 ↗</a></div></Card><Card className="breakdown"><Heading over="05 / INVESTOR LENS" title="供应链研究边界"/><div className="bars">{[{name:"先进逻辑晶圆",value:usage.logic,share:share.logic,unit:"晶圆当量",color:"#476FFF"},{name:"CoWoS 封装",value:usage.cowos,share:share.cowos,unit:"晶圆当量",color:"#859DFF"},{name:"HBM 消耗",value:usage.hbm,share:share.hbm,unit:"美元估算",color:"#41B3A4"}].map(x=><div className="bar-line" key={x.name}><div><b>{x.name}</b><span>{part.length?`${x.unit==="美元估算"?dollars(x.value):fmt(x.value)} · ${x.share.toFixed(1)}%`:"当前季度无数据"}</span></div><div className="track"><i style={{width:`${Math.min(100,x.share)}%`,background:x.color}}/></div></div>)}</div><div className="boundary"><b>尚不能推出供应商利润</b><p>当前数据未覆盖该规格的 HBM 厂商供货份额、合同价和毛利率。云端租价不能直接换算为上游供应商收入；此处只显示部件需求估算。</p></div><div className="price-ref">{isCustom?"单颗成本估算":"型号采购价参考"} <b>{one.length?dollars(chipPrice):"—"} / 颗</b><span>{isCustom?"模型估算，非云端报价":"近似采购价，非租价"}</span></div></Card></div>
  <Card className="sources"><Heading over="06 / AUDIT TRAIL" title="数据来源与连接方式" side={<span className="subtle">读取于 {loadedAt} · 北京时间{snapshotAt?`；快照采集 ${snapshotAt}`:""}</span>}/><p className="source-providers">交付与部件：{sourceProviders.join("、")}；GPU 租价：beCloudReady 公开目录；TPU 价格：Google Cloud 官方标价。点击数据集可查看原表。</p><div className="source-grid">{keys.map(k=><a href={`https://epoch.ai/data/${paths[k]}`} target="_blank" rel="noreferrer" className="source" key={k}><span className={`source-icon ${state[k]}`}><Database size={15}/></span><span><b>{labels[k]}</b><small>{sourceProviders.length>1?`${providers[k]} · `:""}{state[k]==="live"?"在线读取":state[k]==="snapshot"?"内置快照":"读取失败"} · {(raw[k]||[]).length} 行</small></span><ExternalLink size={13}/></a>)}<a href="https://gpuprice.becloudready.com/gpu" target="_blank" rel="noreferrer" className="source"><span className="source-icon"><Database size={15}/></span><span><b>GPU 云端按需租价</b><small>beCloudReady · 公开目录按日归档</small></span><ExternalLink size={13}/></a><a href="https://cloud.google.com/tpu/pricing" target="_blank" rel="noreferrer" className="source"><span className="source-icon snapshot"><Database size={15}/></span><span><b>TPU 区域芯片标价</b><small>Google Cloud · 定时核对／保留原日期</small></span><ExternalLink size={13}/></a></div><div className="audit"><span><Check size={14}/> 型号与季度关联</span><span><Clock3 size={14}/> 生产到交付有时间差</span><span><CircleAlert size={14}/> 出货与部件数据同源</span><span><CircleAlert size={14}/> 站点样本不完整</span></div><div className="methods">方法文档：<a target="_blank" rel="noreferrer" href="https://epoch.ai/data/ai-chip-sales-documentation/methodology">销量 ↗</a><a target="_blank" rel="noreferrer" href="https://epoch.ai/data/ai-chip-components-documentation/methodology">部件 ↗</a><a target="_blank" rel="noreferrer" href="https://epoch.ai/data/data-centers-documentation/methodology">数据中心 ↗</a></div></Card><footer>算力供应链 · 仅为研究工具；衍生比例应结合原始方法审阅。当前数据署名：Epoch AI，CC BY 4.0。</footer></>}</div></div></main>;
}
