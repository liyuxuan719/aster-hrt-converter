export const HRT_TARGET_SOURCES = {
  endocrineSociety: {
    label: "Endocrine Society 2017 指南",
    url: "https://www.endocrine.org/clinical-practice-guidelines/gender-dysphoria-gender-incongruence",
  },
  wpath: {
    label: "WPATH SOC8",
    url: "https://wpath.org/publications/soc8/",
  },
  estradiolReview: {
    label: "Estradiol 目标范围系统综述（2025）",
    url: "https://doi.org/10.1089/lgbt.2024.0407",
  },
};

export const HRT_FEMINIZATION_TARGETS = {
  estradiol: {
    title: "雌二醇女性化 HRT 监测带",
    rangeLabel: "常见雌二醇监测范围",
    unitId: "pg_ml",
    min: 100,
    max: 200,
    note:
      "公开指南与综述常使用 100–200 pg/mL 作为监测范围；部分指南更强调不超过 200 pg/mL。具体目标需结合给药途径、采血时点、实验室方法与临床安排。",
    caveat: "位于该范围不等于保证特定身体变化，高于上限也不应自行停药或改剂量。",
    sourceKeys: ["endocrineSociety", "wpath", "estradiolReview"],
  },
  testosterone: {
    title: "睾酮女性化 HRT 抑制目标",
    rangeLabel: "常见睾酮监测上限",
    unitId: "ng_dl",
    min: null,
    max: 50,
    note:
      "女性化激素治疗通常以总睾酮进入女性范围、常见监测上限低于 50 ng/dL 为目标；部分实验室与临床方案可能采用不同上限。",
    caveat: "低于监测上限不等于越高雌激素就越好，也不等于特定女性化效果已经被保证。",
    sourceKeys: ["endocrineSociety", "wpath"],
  },
};

export function getHrtFeminizationTarget(analyteId) {
  const target = HRT_FEMINIZATION_TARGETS[analyteId];
  if (!target) return null;

  return {
    ...target,
    sources: target.sourceKeys
      .map((key) => HRT_TARGET_SOURCES[key])
      .filter(Boolean),
  };
}
