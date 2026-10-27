const UNIT_DEFINITIONS = {
  pg_ml: {
    id: "pg_ml",
    label: "pg/mL",
    kind: "mass",
    ngPerL: 1,
  },
  ng_l: {
    id: "ng_l",
    label: "ng/L",
    kind: "mass",
    ngPerL: 1,
  },
  pg_l: {
    id: "pg_l",
    label: "pg/L",
    kind: "mass",
    ngPerL: 0.001,
  },
  ng_ml: {
    id: "ng_ml",
    label: "ng/mL",
    kind: "mass",
    ngPerL: 1000,
  },
  ug_l: {
    id: "ug_l",
    label: "µg/L",
    kind: "mass",
    ngPerL: 1000,
  },
  ng_dl: {
    id: "ng_dl",
    label: "ng/dL",
    kind: "mass",
    ngPerL: 10,
  },
  ug_dl: {
    id: "ug_dl",
    label: "µg/dL",
    kind: "mass",
    ngPerL: 10000,
  },
  mg_l: {
    id: "mg_l",
    label: "mg/L",
    kind: "mass",
    ngPerL: 1000000,
  },
  pmol_l: {
    id: "pmol_l",
    label: "pmol/L",
    kind: "molar",
    nmolPerL: 0.001,
  },
  nmol_l: {
    id: "nmol_l",
    label: "nmol/L",
    kind: "molar",
    nmolPerL: 1,
  },
  umol_l: {
    id: "umol_l",
    label: "µmol/L",
    kind: "molar",
    nmolPerL: 1000,
  },
  miu_ml: {
    id: "miu_ml",
    label: "mIU/mL",
    kind: "iu",
    iuPerL: 1,
  },
  iu_l: {
    id: "iu_l",
    label: "IU/L",
    kind: "iu",
    iuPerL: 1,
  },
  miu_l: {
    id: "miu_l",
    label: "mIU/L",
    kind: "iu",
    iuPerL: 0.001,
  },
  iu_ml: {
    id: "iu_ml",
    label: "IU/mL",
    kind: "iu",
    iuPerL: 1000,
  },
};

function steroidUnit(unitId, tier, molarMass) {
  const definition = UNIT_DEFINITIONS[unitId];
  if (!definition) throw new Error(`Unknown unit: ${unitId}`);

  if (definition.kind === "mass") {
    return {
      id: definition.id,
      label: definition.label,
      kind: definition.kind,
      tier,
      toBase: definition.ngPerL / molarMass,
    };
  }

  return {
    id: definition.id,
    label: definition.label,
    kind: definition.kind,
    tier,
    toBase: definition.nmolPerL,
  };
}

function iuUnit(unitId, tier) {
  const definition = UNIT_DEFINITIONS[unitId];
  return {
    id: definition.id,
    label: definition.label,
    kind: definition.kind,
    tier,
    toBase: definition.iuPerL,
  };
}

function steroidUnits(molarMass, unitSpecs) {
  return unitSpecs.map(([unitId, tier]) => steroidUnit(unitId, tier, molarMass));
}

const ESTRADIOL_UNITS = [
  ["pg_ml", 1],
  ["pmol_l", 1],
  ["ng_l", 2],
  ["ng_dl", 2],
  ["ng_ml", 2],
  ["nmol_l", 2],
  ["ug_l", 2],
  ["umol_l", 2],
];

const TESTOSTERONE_UNITS = [
  ["ng_dl", 1],
  ["nmol_l", 1],
  ["ng_ml", 2],
  ["pg_ml", 2],
  ["pmol_l", 2],
  ["ug_l", 2],
  ["ug_dl", 2],
];

export const ANALYTES = [
  {
    id: "estradiol",
    shortName: "E2",
    nameZh: "雌二醇",
    nameEn: "Estradiol",
    family: "estrogen",
    formula: "C18H24O2",
    molarMass: 272.38,
    baseUnitLabel: "pmol/L",
    defaultUnitId: "pg_ml",
    defaultTargetUnitId: "pmol_l",
    units: steroidUnits(272.38, ESTRADIOL_UNITS),
    note: "HRT 中最常检测的雌激素。只对血清或血浆雌二醇浓度做单位换算。",
    aliases: ["E2", "雌二醇", "estradiol", "oestradiol"],
  },
  {
    id: "estrone",
    shortName: "E1",
    nameZh: "雌酮",
    nameEn: "Estrone",
    family: "estrogen",
    formula: "C18H22O2",
    molarMass: 270.37,
    baseUnitLabel: "pmol/L",
    defaultUnitId: "pg_ml",
    defaultTargetUnitId: "pmol_l",
    units: steroidUnits(270.37, ESTRADIOL_UNITS),
    note: "雌酮与雌二醇是不同分子，转换时不能共用系数。",
    aliases: ["E1", "雌酮", "estrone"],
  },
  {
    id: "estriol",
    shortName: "E3",
    nameZh: "雌三醇",
    nameEn: "Estriol",
    family: "estrogen",
    formula: "C18H24O3",
    molarMass: 288.38,
    baseUnitLabel: "pmol/L",
    defaultUnitId: "ng_ml",
    defaultTargetUnitId: "nmol_l",
    units: steroidUnits(288.38, ESTRADIOL_UNITS),
    note: "雌三醇的摩尔质量与雌二醇不同，换算系数也不同。",
    aliases: ["E3", "雌三醇", "estriol"],
  },
  {
    id: "ethinylestradiol",
    shortName: "EE2",
    nameZh: "炔雌醇",
    nameEn: "Ethinylestradiol",
    family: "estrogen",
    formula: "C20H24O2",
    molarMass: 296.4,
    baseUnitLabel: "pmol/L",
    defaultUnitId: "pg_ml",
    defaultTargetUnitId: "pmol_l",
    units: steroidUnits(296.4, ESTRADIOL_UNITS),
    note: "合成的乙炔基雌二醇。药物剂量与血药浓度不是同一种量纲，不能直接互换。",
    aliases: ["EE2", "炔雌醇", "ethinylestradiol", "ethinyl estradiol"],
  },
  {
    id: "testosterone",
    shortName: "T",
    nameZh: "总睾酮",
    nameEn: "Total testosterone",
    family: "androgen",
    formula: "C19H28O2",
    molarMass: 288.42,
    baseUnitLabel: "nmol/L",
    defaultUnitId: "ng_dl",
    defaultTargetUnitId: "nmol_l",
    units: steroidUnits(288.42, TESTOSTERONE_UNITS),
    note: "总睾酮包含与蛋白结合和游离的部分；不同检测方法可能给出不同结果。",
    aliases: ["T", "总睾酮", "testosterone", "total testosterone"],
  },
  {
    id: "free-testosterone",
    shortName: "FT",
    nameZh: "游离睾酮",
    nameEn: "Free testosterone",
    family: "androgen",
    formula: "C19H28O2",
    molarMass: 288.42,
    baseUnitLabel: "pmol/L",
    defaultUnitId: "pg_ml",
    defaultTargetUnitId: "pmol_l",
    units: steroidUnits(288.42, ESTRADIOL_UNITS),
    note: "游离睾酮的参考区间和检测标准化差异较大，单位换算不能替代方法学信息。",
    aliases: ["FT", "游离睾酮", "free testosterone", "free T"],
  },
  {
    id: "dht",
    shortName: "DHT",
    nameZh: "双氢睾酮",
    nameEn: "Dihydrotestosterone",
    family: "androgen",
    formula: "C19H30O2",
    molarMass: 290.44,
    baseUnitLabel: "pmol/L",
    defaultUnitId: "pg_ml",
    defaultTargetUnitId: "pmol_l",
    units: steroidUnits(290.44, ESTRADIOL_UNITS),
    note: "DHT 与睾酮不是同一种激素，即使都以质量单位报告也不能直接互换。",
    aliases: ["DHT", "双氢睾酮", "dihydrotestosterone"],
  },
  {
    id: "progesterone",
    shortName: "P4",
    nameZh: "孕酮",
    nameEn: "Progesterone",
    family: "progestogen",
    formula: "C21H30O2",
    molarMass: 314.46,
    baseUnitLabel: "nmol/L",
    defaultUnitId: "ng_ml",
    defaultTargetUnitId: "nmol_l",
    units: steroidUnits(314.46, [
      ["ng_ml", 1],
      ["nmol_l", 1],
      ["ng_dl", 2],
      ["pmol_l", 2],
      ["ug_l", 2],
      ["umol_l", 2],
    ]),
    note: "孕酮水平会随用药途径、采样时点和月经周期显著变化。",
    aliases: ["P4", "孕酮", "黄体酮", "progesterone"],
  },
  {
    id: "androstenedione",
    shortName: "A4",
    nameZh: "雄烯二酮",
    nameEn: "Androstenedione",
    family: "androgen",
    formula: "C19H26O2",
    molarMass: 286.41,
    baseUnitLabel: "nmol/L",
    defaultUnitId: "ng_dl",
    defaultTargetUnitId: "nmol_l",
    units: steroidUnits(286.41, TESTOSTERONE_UNITS),
    note: "雄烯二酮是睾酮合成通路中的前体，不能当作总睾酮读数。",
    aliases: ["A4", "雄烯二酮", "androstenedione"],
  },
  {
    id: "dheas",
    shortName: "DHEA-S",
    nameZh: "硫酸脱氢表雄酮",
    nameEn: "DHEA sulfate",
    family: "androgen",
    formula: "C19H28O5S",
    molarMass: 368.49,
    baseUnitLabel: "µmol/L",
    defaultUnitId: "ug_dl",
    defaultTargetUnitId: "umol_l",
    units: steroidUnits(368.49, [
      ["ug_dl", 1],
      ["umol_l", 1],
      ["ng_ml", 2],
      ["nmol_l", 2],
      ["mg_l", 2],
    ]),
    note: "不同实验室的 DHEA-S 校准和参考区间可能不同，尤其需要注意单位。",
    aliases: ["DHEA-S", "DHEAS", "硫酸脱氢表雄酮", "dehydroepiandrosterone sulfate"],
  },
  {
    id: "prolactin",
    shortName: "PRL",
    nameZh: "催乳素",
    nameEn: "Prolactin",
    family: "pituitary",
    formula: "Protein hormone",
    molarMass: null,
    baseUnitLabel: "mIU/L",
    defaultUnitId: "ng_ml",
    defaultTargetUnitId: "miu_l",
    units: [
      {
        id: "ng_ml",
        label: "ng/mL",
        kind: "mass",
        tier: 1,
        toBase: 21.2,
      },
      {
        id: "miu_l",
        label: "mIU/L",
        kind: "iu",
        tier: 1,
        toBase: 1,
      },
      {
        id: "ug_l",
        label: "µg/L",
        kind: "mass",
        tier: 2,
        toBase: 21.2,
      },
      {
        id: "iu_l",
        label: "IU/L",
        kind: "iu",
        tier: 2,
        toBase: 1000,
      },
    ],
    note: "质量单位与 mIU/L 的换算受免疫测定标准影响。默认采用约 21.2 mIU/L = 1 ng/mL 的近似系数，请以实验室说明为准。",
    aliases: ["PRL", "催乳素", "泌乳素", "prolactin"],
    usesAssayFactor: true,
  },
  {
    id: "lh",
    shortName: "LH",
    nameZh: "促黄体生成素",
    nameEn: "Luteinizing hormone",
    family: "pituitary",
    formula: "Glycoprotein hormone",
    molarMass: null,
    baseUnitLabel: "IU/L",
    defaultUnitId: "miu_ml",
    defaultTargetUnitId: "iu_l",
    units: [iuUnit("miu_ml", 1), iuUnit("iu_l", 1), iuUnit("miu_l", 2), iuUnit("iu_ml", 2)],
    note: "LH 以免疫测定国际单位报告，不能用蛋白质质量或通用摩尔质量在 IU 与 ng/mL 之间换算。",
    aliases: ["LH", "促黄体生成素", "黄体生成素", "luteinizing hormone"],
  },
  {
    id: "fsh",
    shortName: "FSH",
    nameZh: "促卵泡激素",
    nameEn: "Follicle-stimulating hormone",
    family: "pituitary",
    formula: "Glycoprotein hormone",
    molarMass: null,
    baseUnitLabel: "IU/L",
    defaultUnitId: "miu_ml",
    defaultTargetUnitId: "iu_l",
    units: [iuUnit("miu_ml", 1), iuUnit("iu_l", 1), iuUnit("miu_l", 2), iuUnit("iu_ml", 2)],
    note: "FSH 的国际单位与检测系统相关，不能和 LH 或质量单位共用换算系数。",
    aliases: ["FSH", "促卵泡激素", "卵泡刺激素", "follicle stimulating hormone"],
  },
  {
    id: "shbg",
    shortName: "SHBG",
    nameZh: "性激素结合球蛋白",
    nameEn: "Sex hormone-binding globulin",
    family: "binding",
    formula: "Glycoprotein",
    molarMass: null,
    baseUnitLabel: "nmol/L",
    defaultUnitId: "nmol_l",
    defaultTargetUnitId: "umol_l",
    units: [
      {
        id: "nmol_l",
        label: "nmol/L",
        kind: "molar",
        tier: 1,
        toBase: 1,
      },
      {
        id: "pmol_l",
        label: "pmol/L",
        kind: "molar",
        tier: 2,
        toBase: 0.001,
      },
      {
        id: "umol_l",
        label: "µmol/L",
        kind: "molar",
        tier: 1,
        toBase: 1000,
      },
    ],
    note: "SHBG 通常只用摩尔浓度；由于蛋白糖基化和检测标准差异，不提供不可靠的 ng/mL 质量换算。",
    aliases: ["SHBG", "性激素结合球蛋白", "sex hormone binding globulin"],
  },
];

export const FAMILY_META = {
  estrogen: { label: "雌激素", tone: "rose" },
  androgen: { label: "雄激素", tone: "clay" },
  progestogen: { label: "孕激素", tone: "sage" },
  pituitary: { label: "垂体激素", tone: "blue" },
  binding: { label: "结合蛋白", tone: "sand" },
};

export function getAnalyte(id) {
  return ANALYTES.find((analyte) => analyte.id === id) ?? ANALYTES[0];
}

export function getUnits(analyte, options = {}) {
  const prolactinFactor = Number(options.prolactinFactor);
  if (!analyte.usesAssayFactor || !Number.isFinite(prolactinFactor) || prolactinFactor <= 0) {
    return analyte.units;
  }

  return analyte.units.map((unit) => {
    if (unit.kind !== "mass") return unit;
    return { ...unit, toBase: prolactinFactor };
  });
}

export function getUnit(analyte, unitId, options = {}) {
  return getUnits(analyte, options).find((unit) => unit.id === unitId);
}

export function convert(value, analyte, fromUnitId, toUnitId, options = {}) {
  const numericValue = Number(value);
  const fromUnit = getUnit(analyte, fromUnitId, options);
  const toUnit = getUnit(analyte, toUnitId, options);

  if (!Number.isFinite(numericValue)) {
    throw new TypeError("Value must be a finite number.");
  }
  if (!fromUnit || !toUnit) {
    throw new RangeError("Unknown conversion unit.");
  }

  return (numericValue * fromUnit.toBase) / toUnit.toBase;
}

export function conversionFactor(analyte, fromUnitId, toUnitId, options = {}) {
  return convert(1, analyte, fromUnitId, toUnitId, options);
}

export function formatMeasurement(value, significantDigits = 5) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";

  const digits = Math.min(8, Math.max(2, Number(significantDigits) || 5));
  const rounded = Number(value.toPrecision(digits));
  const absolute = Math.abs(rounded);

  if ((absolute > 0 && absolute < 0.0001) || absolute >= 1e9) {
    return rounded.toExponential(Math.max(1, digits - 1)).replace("e+", "e");
  }

  return new Intl.NumberFormat("en-US", {
    maximumSignificantDigits: digits,
    useGrouping: true,
  }).format(rounded);
}

export function formatFactor(value) {
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value >= 0.01 && value < 100000) {
    return new Intl.NumberFormat("en-US", {
      maximumSignificantDigits: 6,
      useGrouping: false,
    }).format(value);
  }
  return value.toExponential(4).replace("e+", "e");
}

export function getPrimaryUnits(analyte) {
  return analyte.units.filter((unit) => unit.tier === 1);
}

export function getSecondaryUnits(analyte) {
  return analyte.units.filter((unit) => unit.tier === 2);
}
