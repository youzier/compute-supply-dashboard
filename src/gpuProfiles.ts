export type GpuProfile = { family: string; summary: string; context: string };

// Editorial summaries of Epoch's chip-type records and chip-sales methodology.
// Quantitative specifications are read from Epoch's chip-types CSV at runtime.
export const gpuProfiles: Record<string, GpuProfile> = {
  A100: {
    family: "NVIDIA · Ampere",
    summary: "Hopper 之前的数据中心主力 GPU，曾是 AI 训练和推理的主要采购型号。",
    context: "观察旧代际存量与新型号替换；这里的出货估算不是在役数量。",
  },
  A800: {
    family: "NVIDIA · Ampere · 中国市场版本",
    summary: "A100 的中国市场版本。它在交付数据中单列，不能把 A800 的交付直接算作 A100。",
    context: "需求和交付受出口政策影响；同代产品并不代表完全相同的系统配置。",
  },
  "H100/H200": {
    family: "NVIDIA · Hopper · 合并口径",
    summary: "H100 是 Hopper 代际的旗舰 AI GPU；H200 提供更大显存。现有出货数据缺少可靠拆分，因此把两者合并估算。",
    context: "显存分别列示，交付量、采购价及 H100e 均沿用合并口径，不能据此推算两款各自销量。",
  },
  H800: {
    family: "NVIDIA · Hopper · 中国市场版本",
    summary: "H100 的中国市场版本，在交付数据中与 H100/H200 分开追踪。",
    context: "面向市场及出口政策变化会改变销量路径；不能仅以单卡算力推断可交付量。",
  },
  H20: {
    family: "NVIDIA · Hopper · 中国市场版本",
    summary: "面向中国市场的降规格 Hopper GPU。其标称 H100e 与 H100/H200 有明显差别。",
    context: "较低的峰值算力不等于所有任务吞吐等比例下降；出口政策使出货估算更不稳定。",
  },
  B200: {
    family: "NVIDIA · Blackwell",
    summary: "Blackwell 代际的主力 AI GPU。当前数据主要按 GB200 系统中的单 GPU 规格估算，并把少量 B100 并入此口径。",
    context: "关注从 Hopper 转向 Blackwell 时的 HBM、先进封装和整机交付滞后。",
  },
  B300: {
    family: "NVIDIA · Blackwell Ultra",
    summary: "B200 的中期升级型号，当前数据按 GB300 系统中的单 GPU 规格估算。",
    context: "显存配置和系统形态不同；H100e 是纸面峰值，不能直接当作实际推理性能。",
  },
  MI250X: {
    family: "AMD · Instinct · 较早代际",
    summary: "AMD 较早一代的高性能计算加速 GPU，在 AMD 出货估算中单列。",
    context: "更适合观察历史基数和产品切换，不能与较新型号直接按颗数比较需求价值。",
  },
  MI300A: {
    family: "AMD · Instinct · CPU+GPU APU",
    summary: "面向高性能计算的 CPU 与 GPU 集成加速器。当前数据将其纳入 AMD 加速器销量序列。",
    context: "它不是与 MI300X 同类的独立 GPU；按单颗与纯 GPU 比较时需看系统和任务差异。",
  },
  MI300X: {
    family: "AMD · Instinct · AI GPU",
    summary: "AMD 面向 AI 训练与推理的旗舰 GPU，是与 Hopper 同期竞争的一代产品。",
    context: "大容量显存是重要配置，投资关联仍需区分出货估计与客户实际部署。",
  },
  MI308X: {
    family: "AMD · Instinct · 中国市场版本",
    summary: "MI300X 的中国市场版本，在交付数据中独立列出。",
    context: "高量出货是否发生存在不确定性，不能把估算当作已确认订单。",
  },
  MI325X: {
    family: "AMD · Instinct · MI300 系列升级",
    summary: "MI300X 的升级型号，重点增加显存容量；数据将其单独估算，而非并入 MI300X。",
    context: "产品切换期的型号收入占比是模型假设，可能与实际采购组合不同。",
  },
  MI350X: {
    family: "AMD · Instinct · MI350 系列",
    summary: "AMD 更新一代的 AI GPU，在数据中单独追踪其销量和标称算力。",
    context: "观察它对 MI300 系列的替代以及先进封装、HBM 需求估算的变化。",
  },
  MI355X: {
    family: "AMD · Instinct · MI350 系列",
    summary: "与 MI350X 同属更新一代产品，但规格、功耗和销量估计单列。",
    context: "更高的纸面 H100e 或功耗不自动转化为更高利用率、租价或供应商利润。",
  },
  "TPU v4i": {
    family: "Google · TPU · 早期型号",
    summary: "交付估算表单列的 Google TPU 早期型号；公开规格资料较少。",
    context: "不要把它与 TPU v4 合并，也不要从名称推断其实际服务或供货配置。",
  },
  "TPU v4": {
    family: "Google · TPU · 第四代",
    summary: "Google 第四代 TPU，在 Cloud TPU 中以 Pod 和切片形式提供算力。",
    context: "交付颗数与云上可租用容量不是同一指标。",
  },
  "TPU v5e": {
    family: "Google · TPU · 第五代",
    summary: "Google 面向训练和推理的 v5e 型号，在源表中单独估算交付量。",
    context: "与 v5p 的单颗规格和适用场景不同，不能合并计算价格或产能。",
  },
  "TPU v5p": {
    family: "Google · TPU · 第五代",
    summary: "Google 面向大规模训练的 v5p 型号，在源表中与 v5e 分开追踪。",
    context: "H100e 是标称换算，不代表跨架构的实际训练吞吐。",
  },
  "TPU v6e": {
    family: "Google · Trillium · 第六代",
    summary: "Google 的 Trillium TPU，亦称 v6e，面向训练与推理工作负载。",
    context: "在部件估算中单列；其云端标价与 GPU 成交租价不具同一口径。",
  },
  "TPU v7": {
    family: "Google · Ironwood · 第七代",
    summary: "Google 的 Ironwood TPU，在官方云服务中称 TPU7x；源表使用 v7 名称。",
    context: "按源表型号匹配交付与部件，不能把不同 Google 命名版本的价格自动并入。",
  },
  "TPU v8i": {
    family: "Google · TPU 8i · 更新代际",
    summary: "源表列示 v8i 的交付估算；Google 将 TPU 8i 定位于后训练和推理。",
    context: "公开供给和价格覆盖尚有限；当前部件表没有对应的型号级估算。",
  },
  Trainium1: {
    family: "AWS · Trainium · Trn1",
    summary: "AWS 第一代 Trainium，作为 EC2 Trn1 实例中的训练加速器提供。",
    context: "源表的交付与部件数值是模型估算；CoWoS 记为零不证明无需先进封装。实例价格也不能直接换算成单颗价格。",
  },
  Trainium2: {
    family: "AWS · Trainium2 · Trn2",
    summary: "AWS 第二代 Trainium，用于 EC2 Trn2 实例及 UltraServer 的训练和推理。",
    context: "部件需求与部署记录可沿型号关联，但并非 AWS 实际采购或全网在役量。",
  },
  Trainium3: {
    family: "AWS · Trainium3 · Trn3",
    summary: "AWS 第三款以 Trainium 命名的加速器，搭载于 EC2 Trn3 UltraServer。",
    context: "源表交付估算已列该型号；部件和部署覆盖随季度变化，缺失时不能以零代替。",
  },
};

export const defaultGpuProfile: GpuProfile = {
  family: "收录型号",
  summary: "该型号已出现在交付数据中，简介尚未核对。",
  context: "请查看原始型号表与方法文档，勿从名称推断规格或供应商。",
};
