import { ExternalLink } from "lucide-react";
import { defaultSupplierProfile, supplierProfiles, type SupplierEvidence } from "./supplierProfiles";

function Evidence({ label, item }: { label: string; item: SupplierEvidence }) {
  return <div className="supplier-evidence">
    <div className="supplier-evidence-head"><span>{label}</span><em className={item.level === "官方关联" || item.level === "合作协议" ? "confirmed" : item.level === "未核实" ? "unknown" : "qualified"}>{item.level}</em></div>
    <strong>{item.vendors}</strong>
    <p>{item.note}</p>
    <div className="supplier-links">{item.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} <ExternalLink size={11}/></a>)}</div>
  </div>;
}

export default function SupplierProfile({ model }: { model: string }) {
  const profile = supplierProfiles[model] || defaultSupplierProfile;
  return <section className="supplier-profile card" aria-label={`${model} 供应链参与方`}>
    <div className="supplier-heading"><div><span className="over">SUPPLIER EVIDENCE / 型号关联</span><h3>{profile.partner ? "TPU 合作方与部件供应商" : "CoWoS 与 HBM 供应商"}</h3></div><span>公开资料核对至 2026-10-28 · 不随分析季度改变</span></div>
    {profile.partner && <div className="supplier-partner"><Evidence label="TPU 开发与供应合作方" item={profile.partner}/></div>}
    <div className="supplier-grid"><Evidence label="CoWoS 封装" item={profile.cowos}/><div className="supplier-hbm">{profile.hbm.map((item, i) => <Evidence key={`${item.vendors}-${i}`} label={profile.hbm.length > 1 ? `HBM · ${i + 1}` : "HBM 显存"} item={item}/>)}</div></div>
    <p className="supplier-disclaimer">{profile.partner && "合作协议只确认未来代际 TPU 项目关系，不证明所选历史型号的具体供货范围。"}“官方关联”仅表示官方资料出现对应产品，不代表独家供应或全部批次；“平台关联”不能量化订单。HBM 成本和 CoWoS 消耗没有按供应商拆分，不能据此推算各家的收入。</p>
  </section>;
}
