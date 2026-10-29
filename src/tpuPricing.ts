export type TpuPrice = {
  model: string; product: string; region: string; location: string;
  onDemand: number; flex: number | null; calendar: number | null;
  oneYear: number; threeYear: number;
};
// Verified against the Google Cloud public pricing table on 2026-10-28.
// This is a dated fallback, never represented as a live quote.
export const verifiedAt = "2026-10-28";
export const tpuPriceSource = "https://cloud.google.com/tpu/pricing";
export const tpuPrices: TpuPrice[] = [
  { model:"TPU v7", product:"Ironwood", region:"us-central1", location:"Iowa", onDemand:12, flex:6, calendar:8.4, oneYear:8.4, threeYear:5.4 },
  { model:"TPU v7", product:"Ironwood", region:"europe-west2", location:"London", onDemand:13.2, flex:6, calendar:8.4, oneYear:9.24, threeYear:5.94 },
  { model:"TPU v6e", product:"Trillium", region:"us-east1", location:"South Carolina", onDemand:2.7, flex:1.35, calendar:1.89, oneYear:1.89, threeYear:1.22 },
  { model:"TPU v6e", product:"Trillium", region:"us-east5", location:"Ohio", onDemand:2.7, flex:1.35, calendar:1.89, oneYear:1.89, threeYear:1.22 },
  { model:"TPU v6e", product:"Trillium", region:"europe-west4", location:"Amsterdam", onDemand:2.97, flex:1.35, calendar:1.89, oneYear:2.08, threeYear:1.34 },
  { model:"TPU v6e", product:"Trillium", region:"asia-northeast1", location:"Tokyo", onDemand:3.24, flex:1.35, calendar:1.89, oneYear:2.27, threeYear:1.46 },
  { model:"TPU v5p", product:"TPU v5p", region:"us-east5", location:"Columbus", onDemand:4.2, flex:2.1, calendar:2.94, oneYear:2.94, threeYear:1.89 },
  { model:"TPU v5p", product:"TPU v5p", region:"us-east1", location:"South Carolina", onDemand:4.2, flex:2.1, calendar:2.94, oneYear:2.94, threeYear:1.89 },
  { model:"TPU v5e", product:"TPU v5e", region:"us-central1", location:"Iowa", onDemand:1.2, flex:.6, calendar:.84, oneYear:.84, threeYear:.54 },
  { model:"TPU v5e", product:"TPU v5e", region:"us-east5", location:"Columbus", onDemand:1.2, flex:.6, calendar:.84, oneYear:.84, threeYear:.54 },
  { model:"TPU v5e", product:"TPU v5e", region:"us-south1", location:"Dallas", onDemand:1.416, flex:.6, calendar:.84, oneYear:.9912, threeYear:.6372 },
  { model:"TPU v5e", product:"TPU v5e", region:"us-west1", location:"Oregon", onDemand:1.2, flex:.6, calendar:.84, oneYear:.84, threeYear:.54 },
  { model:"TPU v5e", product:"TPU v5e", region:"us-west4", location:"Las Vegas", onDemand:1.2, flex:.6, calendar:.84, oneYear:.84, threeYear:.54 },
  { model:"TPU v5e", product:"TPU v5e", region:"europe-west1", location:"Belgium", onDemand:1.32132, flex:.6, calendar:.84, oneYear:.924924, threeYear:.594594 },
  { model:"TPU v5e", product:"TPU v5e", region:"europe-west4", location:"Netherlands", onDemand:1.56, flex:.6, calendar:.84, oneYear:1.092, threeYear:.702 },
  { model:"TPU v5e", product:"TPU v5e", region:"asia-southeast1", location:"Singapore", onDemand:1.56, flex:.6, calendar:.84, oneYear:1.092, threeYear:.702 },
  { model:"TPU v4", product:"TPU v4 pod", region:"us-central2", location:"Oklahoma", onDemand:3.22, flex:null, calendar:null, oneYear:2.0286, threeYear:1.449 },
];
