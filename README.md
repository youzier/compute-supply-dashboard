# 算力供应链 · 投资研究看板

GPU / TPU / Trainium 型号、云租价、部件消耗及项目部署研究。此版本运行于 GitHub Pages，前端无服务端接口、无密钥。

## 发布

1. 将本目录的全部源码上传至 `youzier/compute-supply-dashboard` 仓库的 `main` 分支（包括隐藏目录 `.github`）。
2. 仓库 Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。
3. Actions → Update data and deploy Pages → Run workflow。成功后以部署输出的链接为准。

请不要只上传 ZIP 本身。若通过网页上传，先解压再上传目录内容。

## 数据更新

推送 main、手动运行或每日 06:20 UTC（北京时间 14:20）触发更新和发布。定时运行可能延迟；公开仓库长期无活动时 GitHub 可能暂停定时任务，请在 Actions 页查看运行结果。

- Epoch AI：六份 CSV 同次成功才整体替换，失败保留已有快照并保留原日期。
- GPU 云租价：读取 beCloudReady 使用的公开目录 JSON（freellm.org），筛选美元按需报价，按精确型号计算中位数、最低价及近 14 天历史。页面尝试浏览器直接更新，失败回退构建时归档。
- TPU：Google Cloud 定价页按芯片小时、地区与购买方式读取；页面结构或网络异常时保留上次核对快照及原日期。
- 未匹配型号不使用相近规格代替。没有生成或模拟历史价格。

## 本地运行

Node.js 22.13+、Python 3.10+。

```sh
npm install
python3 scripts/update_data.py
npm run dev
npm run build
```

## 审计与限制

云目录价不是成交价。最低挂牌可能缺货；中位数按报价条目计算，受实例与地区组成影响。TPU、GPU 的每颗小时费用无法直接表示同等有效算力成本。交付量与部件消耗为模型估算，不能据此直接推出供应商利润。

数据署名：Epoch AI 数据使用 CC BY 4.0；Google Cloud TPU 价格与 beCloudReady 云目录报价均保留来源链接。具体供应链映射为公开资料研究，证据与边界见页面。
