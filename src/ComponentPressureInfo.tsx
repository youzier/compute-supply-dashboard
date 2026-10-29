"use client";

import { useState } from "react";
import { ExternalLink, Info } from "lucide-react";

export default function ComponentPressureInfo({ latest }: { latest: string }) {
  const [open, setOpen] = useState(false);

  return <>
    <div className="heading component-pressure-heading">
      <div>
        <span className="over">03 / COMPONENT PRESSURE</span>
        <div className="component-pressure-title">
          <h2>型号占全球部件供给</h2>
          <button type="button" className="component-info-button" aria-label="查看部件供给占比的计算方式" aria-expanded={open} aria-controls="component-pressure-method" title="查看计算方式" onClick={() => setOpen(value => !value)}><Info size={15}/></button>
        </div>
      </div>
      <span className="badge amber">至 {latest}</span>
    </div>
    {open && <div id="component-pressure-method" className="component-method" role="note" onKeyDown={event => { if (event.key === "Escape") setOpen(false); }}>
      <strong>计算方式 · 按型号、同季度的中位数</strong>
      <p><b>CoWoS 占比</b> = 型号的 CoWoS 晶圆当量 ÷ 估算 CoWoS 季度供给 × 100%</p>
      <p><b>HBM 金额占比</b> = 型号的 HBM 成本估算（美元）÷ 估算全球 HBM 季度供给金额（美元）× 100%</p>
      <small>部件需求由产量、物料、良率及生产时滞推导；HBM 是金额比例，不是容量或颗数比例。缺少对应型号或同期供给数据时不画柱，也不能据此推算供应商收入。</small>
      <a href="https://epoch.ai/data/ai-chip-components-documentation/methodology" target="_blank" rel="noreferrer">查看部件估算方法 <ExternalLink size={12}/></a>
    </div>}
  </>;
}
