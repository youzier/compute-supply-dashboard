export type SupplierEvidence = {
  vendors: string;
  level: "合作协议" | "官方关联" | "平台关联" | "设备样例" | "未核实";
  note: string;
  sources: { label: string; url: string }[];
};
export type SupplierProfile = { partner?: SupplierEvidence; cowos: SupplierEvidence; hbm: SupplierEvidence[] };

const tsmcPlatform = {
  vendors: "台积电（TSMC）",
  level: "平台关联",
  note: "NVIDIA 公开确认使用台积电 CoWoS；该型号的封装执行方、批次和份额未逐一披露。",
  sources: [{ label: "台积电与 NVIDIA", url: "https://pr.tsmc.com/english/news/2968" }],
} satisfies SupplierEvidence;
const amdPlatform = {
  vendors: "台积电（TSMC）",
  level: "平台关联",
  note: "同系列采用先进封装；此型号的 CoWoS 执行方及分包比例未找到单独确认。",
  sources: [{ label: "AMD MI300X 封装说明", url: "https://www.amd.com/en/blogs/2024/accelerating-energy-efficiency-our-latest-30x25-u.html" }],
} satisfies SupplierEvidence;
const unknownCowos = {
  vendors: "尚未核实",
  level: "未核实",
  note: "不能由晶圆代工厂或 CoWoS 消耗估算反推出该型号的封装服务商。",
  sources: [{ label: "台积电 CoWoS 技术", url: "https://www.tsmc.com/english/dedicatedFoundry/technology/platform_HPC_tech_WLSI" }],
} satisfies SupplierEvidence;
const unknownHbm = (note: string, url: string): SupplierEvidence => ({
  vendors: "型号级供货商未公开确认", level: "未核实", note,
  sources: [{ label: "产品规格", url }],
});
const mi350Hbm = {
  vendors: "三星电子、美光",
  level: "官方关联",
  note: "AMD 明示两者用于 MI350 系列；三星称为主要 HBM3E 伙伴。没有可验证的逐批份额。",
  sources: [
    { label: "AMD MI350 系列", url: "https://www.amd.com/en/blogs/2025/amd-instinct-mi350-series-and-beyond-accelerating-the-future-of-ai-and-hpc.html" },
    { label: "三星与 AMD", url: "https://news.samsung.com/global/samsung-and-amd-expand-strategic-collaboration-on-next-generation-ai-memory-solutions" },
  ],
} satisfies SupplierEvidence;
const tpuCowos = {
  vendors: "型号级封装服务商未公开确认", level: "未核实",
  note: "部件表的 CoWoS 晶圆当量是估算，不能据此指定 Google TPU 的实际封装厂或分包方。",
  sources: [{ label: "TPU 产品资料", url: "https://cloud.google.com/tpu" }],
} satisfies SupplierEvidence;
const tpuHbm = unknownHbm("Google 的公开 TPU 规格列出 HBM 容量，但未披露该型号的 HBM 供货厂商及份额。", "https://cloud.google.com/tpu");
const tpuPartner = {
  vendors: "博通（Broadcom）", level: "合作协议",
  note: "博通与 Google 的公开协议涉及未来代际 TPU 的开发和供应。协议未逐一列出本页各型号的交付内容；具体分工、CoWoS 执行方与 HBM 制造商仍需分别核实。",
  sources: [{ label: "博通与 Google 的 8-K 协议披露", url: "https://www.sec.gov/Archives/edgar/data/1730168/000119312526144028/d87999d8k.htm" }],
} satisfies SupplierEvidence;
const trainiumCowos = {
  vendors: "型号级封装服务商未公开确认", level: "未核实",
  note: "部件模型中的封装晶圆当量不能证明 AWS 该型号的实际封装厂、工艺或订单份额。",
  sources: [{ label: "AWS Trainium 产品", url: "https://aws.amazon.com/ai/machine-learning/trainium/" }],
} satisfies SupplierEvidence;
const trainiumHbm = unknownHbm("AWS 公布加速器 HBM 规格，但未公开确认该型号的 HBM 厂商与供货份额。", "https://aws.amazon.com/ai/machine-learning/trainium/");

export const supplierProfiles: Record<string, SupplierProfile> = {
  A100: { cowos: tsmcPlatform, hbm: [unknownHbm("HBM2/HBM2E 规格随版本而异；不能由 NVIDIA 的公司级采购名单指定 A100 的供货商。", "https://www.nvidia.com/en-us/data-center/a100/")] },
  A800: { cowos: tsmcPlatform, hbm: [unknownHbm("该版本的 HBM 厂商与批次未获公开型号级确认。", "https://docs.nvidia.com/datacenter/tesla/tesla-release-notes-581-15/index.html")] },
  "H100/H200": { cowos: tsmcPlatform, hbm: [
    { vendors: "H100：SK 海力士", level: "官方关联", note: "SK 海力士公告 HBM3 用于 H100；不代表每批都是单一供应商。", sources: [{ label: "SK 海力士公告", url: "https://news.skhynix.com/en/sk-hynix-to-supply-industrys-first-hbm3-dram-to-nvidia/" }] },
    { vendors: "H200：美光、SK 海力士", level: "官方关联", note: "美光明确公布供货，SK 海力士公开展示 H200 配套 HBM3E；两者份额未披露。", sources: [{ label: "美光 H200", url: "https://investors.micron.com/news/press-release/2024/Micron-Commences-Volume-Production-of-Industry-Leading-HBM3E-Solution-to-Accelerate-the-Growth-of-AI-02-26-2024/default.aspx" }, { label: "SK 海力士展示", url: "https://news.skhynix.com/en/2024-ocp-global-summit-advancing-ai-and-data-center-memory/" }] },
  ] },
  H800: { cowos: tsmcPlatform, hbm: [unknownHbm("不能从 H100 的供应商直接推定 H800 的具体 HBM 厂商。", "https://images.nvidia.com/aem-dam/Solutions/documents/NVIDIA-Sustainability-Report-Fiscal-Year-2025.pdf")] },
  H20: { cowos: tsmcPlatform, hbm: [unknownHbm("型号级 HBM 供货方和批次未获公开确认。", "https://images.nvidia.com/aem-dam/Solutions/documents/NVIDIA-Sustainability-Report-Fiscal-Year-2025.pdf")] },
  B200: { cowos: tsmcPlatform, hbm: [
    { vendors: "美光、SK 海力士", level: "官方关联", note: "美光公布 HBM3E 用于 HGX B200/GB200，SK 海力士展示 GB200 模组；B200 交付估算还含少量 B100。", sources: [{ label: "美光 B200", url: "https://investors.micron.com/news/press-release/2025/Micron-Innovates-From-the-Data-Center-to-the-Edge-With-NVIDIA-03-18-2025/default.aspx" }, { label: "SK 海力士 GB200", url: "https://news.skhynix.com/en/sk-hynix-showcases-hbm4-next-gen-ai-memory-at-computex-taipei-2025/" }] },
  ] },
  B300: { cowos: tsmcPlatform, hbm: [
    { vendors: "美光、SK 海力士", level: "官方关联", note: "美光公布 HBM3E 12H 用于 B300/GB300，SK 海力士展示 GB300 配套 HBM3E。", sources: [{ label: "美光 B300", url: "https://investors.micron.com/news/press-release/2025/Micron-Innovates-From-the-Data-Center-to-the-Edge-With-NVIDIA-03-18-2025/default.aspx" }, { label: "SK 海力士 GB300", url: "https://news.skhynix.com/en/gtc-2026-exhibition-booth/" }] },
  ] },
  MI250X: { cowos: unknownCowos, hbm: [unknownHbm("AMD 公开 HBM2e 规格，但未明确具体 HBM 厂商。", "https://www.amd.com/en/products/accelerators/instinct/mi200/mi250x.html")] },
  MI300A: { cowos: amdPlatform, hbm: [unknownHbm("AMD 公开 128 GB 统一 HBM3；没有足以指认量产批次供应商的型号级资料。", "https://instinct.docs.amd.com/projects/amdgpu-docs/en/develop/gpu-partitioning/mi300a/overview.html")] },
  MI300X: { cowos: {
    vendors: "台积电（TSMC）", level: "官方关联", note: "AMD 公开说明 MI300X 采用 CoWoS；最终封装分包与产能份额未披露。",
    sources: [{ label: "AMD MI300X 封装", url: "https://www.amd.com/en/blogs/2024/accelerating-energy-efficiency-our-latest-30x25-u.html" }],
  }, hbm: [{ vendors: "SK 海力士（设备样例）", level: "设备样例", note: "AMD SMI 的 MI300X 示例设备显示 HYNIX；这不是全量订单或独家供应证明。", sources: [{ label: "AMD SMI 示例", url: "https://instinct.docs.amd.com/projects/amd-smi-virt/en/latest/how_to/amdsmi_cli_usage.html" }] }] },
  MI308X: { cowos: amdPlatform, hbm: [unknownHbm("不能由 MI300X 的设备样例推定 MI308X 的 HBM 来源。", "https://www.amd.com/en/products/specifications/accelerators.html")] },
  MI325X: { cowos: amdPlatform, hbm: [unknownHbm("AMD 公开 HBM3E 规格，但未公布可用于量化的型号级供货商名单。", "https://www.amd.com/en/products/accelerators/instinct/mi300/mi325x.html")] },
  MI350X: { cowos: unknownCowos, hbm: [mi350Hbm] },
  MI355X: { cowos: unknownCowos, hbm: [mi350Hbm] },
  "TPU v4i": { partner: tpuPartner, cowos: tpuCowos, hbm: [tpuHbm] },
  "TPU v4": { partner: tpuPartner, cowos: tpuCowos, hbm: [tpuHbm] },
  "TPU v5e": { partner: tpuPartner, cowos: tpuCowos, hbm: [tpuHbm] },
  "TPU v5p": { partner: tpuPartner, cowos: tpuCowos, hbm: [tpuHbm] },
  "TPU v6e": { partner: tpuPartner, cowos: tpuCowos, hbm: [tpuHbm] },
  "TPU v7": { partner: tpuPartner, cowos: tpuCowos, hbm: [tpuHbm] },
  "TPU v8i": { partner: tpuPartner, cowos: tpuCowos, hbm: [tpuHbm] },
  Trainium1: { cowos: trainiumCowos, hbm: [trainiumHbm] },
  Trainium2: { cowos: trainiumCowos, hbm: [trainiumHbm] },
  Trainium3: { cowos: trainiumCowos, hbm: [trainiumHbm] },
};

export const defaultSupplierProfile: SupplierProfile = {
  cowos: unknownCowos,
  hbm: [unknownHbm("新型号需单独核实，不能沿用同代产品的供应商。", "https://www.tsmc.com/english/dedicatedFoundry/technology/platform_HPC_tech_WLSI")],
};
