export const REFERENCE_CONTEXT_NOTE =
  "成人女性常见公开实验室参考带的汇编示例，不是诊断阈值或 HRT 治疗目标。周期、年龄、妊娠、检测平台和用药方案都可能改变解释。";

export const FEMALE_REFERENCE_RANGES = {
  estradiol: {
    title: "按月经周期与绝经状态",
    rows: [
      { label: "卵泡期", unitId: "pg_ml", min: 12.5, max: 166 },
      { label: "围排卵期", unitId: "pg_ml", min: 85.8, max: 498 },
      { label: "黄体期", unitId: "pg_ml", min: 43.8, max: 211 },
      { label: "绝经后 · 未 HRT", unitId: "pg_ml", min: null, max: 54.7 },
    ],
  },
  estrone: {
    title: "成人女性常见范围",
    rows: [{ label: "成人女性", unitId: "pg_ml", min: 15, max: 80 }],
  },
  estriol: {
    title: "非妊娠期不设通用水平带",
    rows: [],
    note: "雌三醇主要用于妊娠相关评估；非妊娠女性通常很低，不适合用单一成人女性区间判断。",
  },
  ethinylestradiol: {
    title: "合成雌激素，无内源女性参考带",
    rows: [],
    note: "炔雌醇是合成药物，不存在与内源雌二醇相同的女性生理参考区间。",
  },
  testosterone: {
    title: "成人女性总睾酮",
    rows: [{ label: "成人女性", unitId: "ng_dl", min: 15, max: 70 }],
    note: "总睾酮参考区间高度依赖检测平台、年龄和是否绝经。",
  },
  "free-testosterone": {
    title: "成人女性游离睾酮",
    rows: [{ label: "成人女性 · 方法相关", unitId: "pg_ml", min: 0.1, max: 6.3 }],
    note: "游离睾酮的参考范围与分析前处理、检测方法和计算方式密切相关。",
  },
  dht: {
    title: "成人女性 DHT",
    rows: [{ label: "成人女性", unitId: "pg_ml", min: 40, max: 220 }],
    note: "DHT 检测标准化有限，需优先参考本实验室区间。",
  },
  progesterone: {
    title: "按月经周期与绝经状态",
    rows: [
      { label: "卵泡期", unitId: "ng_ml", min: 0.1, max: 0.9 },
      { label: "围排卵期", unitId: "ng_ml", min: 0.1, max: 12 },
      { label: "黄体期", unitId: "ng_ml", min: 1.8, max: 24 },
      { label: "绝经后 · 未 HRT", unitId: "ng_ml", min: null, max: 0.8 },
    ],
  },
  androstenedione: {
    title: "成人女性雄烯二酮",
    rows: [{ label: "成人女性", unitId: "ng_ml", min: 0.4, max: 2.7 }],
    note: "雄烯二酮随年龄、卵巢状态和检测方法变化。",
  },
  dheas: {
    title: "按年龄分组的成人女性范围",
    rows: [
      { label: "18–49 岁", unitId: "ug_dl", min: 35, max: 430 },
      { label: "50 岁以上", unitId: "ug_dl", min: 20, max: 290 },
    ],
    note: "DHEA-S 受年龄影响明显，本表仅作宽泛定位。",
  },
  prolactin: {
    title: "非妊娠成人女性",
    rows: [{ label: "非妊娠女性", unitId: "ng_ml", min: 4, max: 23 }],
    note: "压力、睡眠、进餐、药物、泌乳与垂体疾病均可影响催乳素。",
  },
  lh: {
    title: "按月经周期与绝经状态",
    rows: [
      { label: "卵泡期", unitId: "miu_ml", min: 2.4, max: 12.6 },
      { label: "围排卵期", unitId: "miu_ml", min: 14, max: 95.6 },
      { label: "黄体期", unitId: "miu_ml", min: 1, max: 11.4 },
      { label: "绝经后", unitId: "miu_ml", min: 7.7, max: 58.5 },
    ],
    note: "使用外源性激素、GnRH 激动剂或处于围绝经期时，周期参考带通常不适用。",
  },
  fsh: {
    title: "按月经周期与绝经状态",
    rows: [
      { label: "卵泡期", unitId: "miu_ml", min: 3.5, max: 12.5 },
      { label: "围排卵期", unitId: "miu_ml", min: 4.7, max: 21.5 },
      { label: "黄体期", unitId: "miu_ml", min: 1.7, max: 7.7 },
      { label: "绝经后", unitId: "miu_ml", min: 25.8, max: 134.8 },
    ],
    note: "FSH 会随周期、年龄与抑制性治疗改变，单次结果不能单独判断卵巢状态。",
  },
  shbg: {
    title: "成人女性 SHBG",
    rows: [{ label: "成人女性", unitId: "nmol_l", min: 20, max: 130 }],
    note: "甲状腺功能、肥胖、肝脏状态和雌激素治疗都可能改变 SHBG。",
  },
};

export function getFemaleReference(analyteId) {
  return (
    FEMALE_REFERENCE_RANGES[analyteId] || {
      title: "暂无通用女性参考带",
      rows: [],
      note: "当前分析物没有足够稳定的通用成人女性参考区间。",
    }
  );
}
