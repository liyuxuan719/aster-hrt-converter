import {
  ANALYTES,
  FAMILY_META,
  convert,
  formatFactor,
  formatMeasurement,
  getAnalyte,
  getPrimaryUnits,
  getUnit,
  getUnits,
} from "../src/converter.js";
import { getFemaleReference, REFERENCE_CONTEXT_NOTE } from "../src/female-ranges.js";
import { getHrtFeminizationTarget } from "../src/hrt-targets.js";

const STORAGE_KEY = "aster-hrt-converter-settings-v1";
const DEFAULT_ASSAY_FACTOR = 21.2;

const elements = {
  analyteSelect: document.querySelector("#analyte-select"),
  valueInput: document.querySelector("#value-input"),
  fromUnit: document.querySelector("#from-unit"),
  unitCount: document.querySelector("#unit-count"),
  precisionSelect: document.querySelector("#precision-select"),
  quickPicks: document.querySelector("#quick-picks"),
  assayFactor: document.querySelector("#assay-factor"),
  assayFactorInput: document.querySelector("#assay-factor-input"),
  assayHelp: document.querySelector("#assay-help"),
  swapButton: document.querySelector("#swap-button"),
  resetButton: document.querySelector("#reset-button"),
  analyteProfile: document.querySelector("#analyte-profile"),
  analyteShort: document.querySelector("#analyte-short"),
  analyteName: document.querySelector("#analyte-name"),
  analyteMeta: document.querySelector("#analyte-meta"),
  analyteFamily: document.querySelector("#analyte-family"),
  primaryEquation: document.querySelector("#primary-equation"),
  primaryValue: document.querySelector("#primary-value"),
  primaryUnit: document.querySelector("#primary-unit"),
  primaryCopy: document.querySelector("#primary-copy"),
  hrtTarget: document.querySelector("#hrt-target"),
  hrtTargetTitle: document.querySelector("#hrt-target-title"),
  hrtTargetStatus: document.querySelector("#hrt-target-status"),
  hrtTargetRangeLabel: document.querySelector("#hrt-target-range-label"),
  hrtTargetRangeValue: document.querySelector("#hrt-target-range-value"),
  hrtTargetBand: document.querySelector("#hrt-target-band"),
  hrtTargetMarker: document.querySelector("#hrt-target-marker"),
  hrtTargetSummary: document.querySelector("#hrt-target-summary"),
  hrtTargetNote: document.querySelector("#hrt-target-note"),
  hrtTargetCaveat: document.querySelector("#hrt-target-caveat"),
  hrtTargetSources: document.querySelector("#hrt-target-sources"),
  femaleReference: document.querySelector("#female-reference"),
  femaleTitle: document.querySelector("#female-reference-title"),
  femaleSummary: document.querySelector("#female-summary"),
  femaleRangeList: document.querySelector("#female-range-list"),
  femaleContextNote: document.querySelector("#female-context-note"),
  copyAllButton: document.querySelector("#copy-all-button"),
  showMoreButton: document.querySelector("#show-more-button"),
  resultList: document.querySelector("#result-list"),
  formulaLine: document.querySelector("#formula-line"),
  clinicalNote: document.querySelector("#clinical-note"),
  shareButton: document.querySelector("#share-button"),
  installButton: document.querySelector("#install-button"),
  networkState: document.querySelector("#network-state"),
  networkLabel: document.querySelector("#network-label"),
  toast: document.querySelector("#toast"),
  year: document.querySelector("#year"),
};

const urlState = new URLSearchParams(window.location.search);
const storedState = readStoredSettings();
const initialStateId = ANALYTES.some((analyte) => analyte.id === urlState.get("analyte"))
  ? urlState.get("analyte")
  : storedState.analyteId || "estradiol";
const initialAnalyte = getAnalyte(initialStateId);
const requestedUnit = urlState.get("unit");
const initialUnitId = initialAnalyte.units.some((unit) => unit.id === requestedUnit)
  ? requestedUnit
  : initialAnalyte.units.some((unit) => unit.id === storedState.unitId)
    ? storedState.unitId
    : initialAnalyte.defaultUnitId;
const initialValue = urlState.has("value") ? sanitizeNumericInput(urlState.get("value")) : "100";

const state = {
  analyteId: initialStateId,
  fromUnitId: initialUnitId,
  precision: clampInteger(urlState.get("precision") || storedState.precision || 5, 3, 7),
  expanded: urlState.get("more") === "1",
  prolactinFactor: clampNumber(
    urlState.get("assayFactor") || storedState.prolactinFactor || DEFAULT_ASSAY_FACTOR,
    1,
    100,
  ),
};

let toastTimer = null;
let installPrompt = null;

function readStoredSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function storeSettings() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        analyteId: state.analyteId,
        unitId: state.fromUnitId,
        precision: state.precision,
        prolactinFactor: state.prolactinFactor,
      }),
    );
  } catch {
    // The converter remains fully functional when storage is blocked.
  }
}

function clampInteger(value, min, max) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function clampNumber(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function sanitizeNumericInput(value) {
  const normalized = String(value ?? "").trim().replace(",", ".");
  return Number.isFinite(Number(normalized)) ? normalized : "";
}

function getCurrentAnalyte() {
  return getAnalyte(state.analyteId);
}

function getCurrentUnits() {
  return getUnits(getCurrentAnalyte(), {
    prolactinFactor: state.prolactinFactor,
  });
}

function getCurrentUnit() {
  return (
    getUnit(getCurrentAnalyte(), state.fromUnitId, {
      prolactinFactor: state.prolactinFactor,
    }) || getUnits(getCurrentAnalyte())[0]
  );
}

function chooseTargetUnit(analyte, fromUnitId) {
  const primaryUnits = getPrimaryUnits(analyte);
  if (fromUnitId !== analyte.defaultTargetUnitId && analyte.units.some((unit) => unit.id === analyte.defaultTargetUnitId)) {
    return analyte.defaultTargetUnitId;
  }

  return primaryUnits.find((unit) => unit.id !== fromUnitId)?.id || analyte.units.find((unit) => unit.id !== fromUnitId)?.id;
}

function getConversionSnapshot() {
  const analyte = getCurrentAnalyte();
  const units = getCurrentUnits();
  const fromUnit = units.find((unit) => unit.id === state.fromUnitId) || units[0];
  const targetUnitId = chooseTargetUnit(analyte, fromUnit.id);
  const targetUnit = units.find((unit) => unit.id === targetUnitId) || units.find((unit) => unit.id !== fromUnit.id);
  const numericValue = Number(elements.valueInput.value);
  const hasValue = elements.valueInput.value.trim() !== "" && Number.isFinite(numericValue) && numericValue >= 0;

  const convertTo = (toUnitId) => {
    if (!hasValue || !toUnitId) return null;
    return convert(numericValue, analyte, fromUnit.id, toUnitId, {
      prolactinFactor: state.prolactinFactor,
    });
  };

  return {
    analyte,
    units,
    fromUnit,
    targetUnit,
    numericValue,
    hasValue,
    convertTo,
  };
}

function buildAnalyteOptions() {
  const groups = new Map();
  for (const analyte of ANALYTES) {
    if (!groups.has(analyte.family)) groups.set(analyte.family, []);
    groups.get(analyte.family).push(analyte);
  }

  const fragment = document.createDocumentFragment();
  for (const [familyId, analytes] of groups) {
    const group = document.createElement("optgroup");
    group.label = FAMILY_META[familyId].label;
    for (const analyte of analytes) {
      const option = document.createElement("option");
      option.value = analyte.id;
      option.textContent = `${analyte.nameZh} · ${analyte.shortName}`;
      group.append(option);
    }
    fragment.append(group);
  }
  elements.analyteSelect.replaceChildren(fragment);
}

function buildUnitOptions(fromUnitId) {
  const primaryGroup = document.createElement("optgroup");
  primaryGroup.label = "常用单位";
  const secondaryGroup = document.createElement("optgroup");
  secondaryGroup.label = "其他单位";

  for (const unit of getCurrentUnits()) {
    const option = document.createElement("option");
    option.value = unit.id;
    option.textContent = unit.label;
    if (unit.tier === 1) {
      primaryGroup.append(option);
    } else {
      secondaryGroup.append(option);
    }
  }

  const groups = [];
  if (primaryGroup.children.length) groups.push(primaryGroup);
  if (secondaryGroup.children.length) groups.push(secondaryGroup);
  elements.fromUnit.replaceChildren(...groups);
  elements.fromUnit.value = fromUnitId;
}

function unitKindLabel(kind) {
  return {
    mass: "质量浓度",
    molar: "摩尔浓度",
    iu: "国际单位",
  }[kind] || "单位";
}

function renderAnalyteProfile(analyte) {
  const family = FAMILY_META[analyte.family];
  elements.analyteProfile.dataset.tone = family.tone;
  elements.analyteShort.textContent = analyte.shortName;
  elements.analyteName.textContent = analyte.nameZh;
  elements.analyteFamily.textContent = family.label;
  elements.analyteMeta.textContent = [
    analyte.nameEn,
    analyte.formula,
    analyte.molarMass ? `${analyte.molarMass} g/mol` : "方法学相关",
  ].join(" · ");
}

function renderQuickPicks() {
  for (const button of elements.quickPicks.querySelectorAll("[data-analyte]")) {
    button.classList.toggle("is-active", button.dataset.analyte === state.analyteId);
    button.setAttribute("aria-pressed", String(button.dataset.analyte === state.analyteId));
  }
}

function renderAssayFactor(analyte) {
  const isProlactin = Boolean(analyte.usesAssayFactor);
  elements.assayFactor.hidden = !isProlactin;
  elements.assayFactorInput.value = state.prolactinFactor;
}

function createCopyButton(value, ariaLabel) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "copy-button";
  button.dataset.copyValue = value;
  button.setAttribute("aria-label", ariaLabel);
  button.title = ariaLabel;
  button.innerHTML = '<i data-lucide="copy"></i>';
  return button;
}

function getVisibleResultUnits(snapshot) {
  const remaining = snapshot.units.filter(
    (unit) => unit.id !== snapshot.fromUnit.id && unit.id !== snapshot.targetUnit?.id,
  );
  if (state.expanded) return remaining;

  const primary = remaining.filter((unit) => unit.tier === 1);
  const extras = remaining.filter((unit) => unit.tier === 2).slice(0, 3);
  return [...primary, ...extras];
}

function renderResults(snapshot) {
  const { analyte, fromUnit, targetUnit, hasValue, convertTo } = snapshot;
  const targetValue = targetUnit ? convertTo(targetUnit.id) : null;
  const precision = state.precision;
  const formattedTarget = targetValue === null ? "—" : formatMeasurement(targetValue, precision);

  elements.primaryEquation.textContent = targetUnit
    ? `${fromUnit.label} → ${targetUnit.label}`
    : "选择目标单位";
  elements.primaryValue.textContent = formattedTarget;
  elements.primaryUnit.textContent = targetUnit?.label || "";
  elements.primaryCopy.disabled = targetValue === null;
  elements.primaryCopy.dataset.copyValue =
    targetValue === null ? "" : `${formattedTarget} ${targetUnit.label}`;

  const fragment = document.createDocumentFragment();
  let renderedCount = 0;
  for (const unit of getVisibleResultUnits(snapshot)) {
    const value = convertTo(unit.id);
    const formatted = value === null ? "—" : formatMeasurement(value, precision);
    const row = document.createElement("div");
    row.className = "result-row";

    const unitBlock = document.createElement("div");
    unitBlock.className = "result-unit";
    const unitLabel = document.createElement("strong");
    unitLabel.textContent = unit.label;
    const unitKind = document.createElement("small");
    unitKind.textContent = unitKindLabel(unit.kind);
    unitBlock.append(unitLabel, unitKind);

    const output = document.createElement("output");
    output.className = "result-number";
    output.textContent = formatted;
    output.setAttribute("aria-label", `${unit.label}: ${formatted}`);

    row.append(unitBlock, output, createCopyButton(value === null ? "" : `${formatted} ${unit.label}`, `复制 ${unit.label} 结果`));
    fragment.append(row);
    renderedCount += 1;
  }

  if (!renderedCount) {
    const empty = document.createElement("p");
    empty.className = "field-hint";
    empty.textContent = "没有更多可显示的换算单位。";
    fragment.append(empty);
  }

  elements.resultList.replaceChildren(fragment);
  elements.showMoreButton.setAttribute("aria-expanded", String(state.expanded));
  elements.showMoreButton.querySelector("span").textContent = state.expanded ? "收起单位" : "更多单位";

  const factor = targetUnit
    ? convert(1, analyte, fromUnit.id, targetUnit.id, { prolactinFactor: state.prolactinFactor })
    : null;
  if (factor && Number.isFinite(factor)) {
    elements.formulaLine.querySelector("span").textContent =
      `1 ${fromUnit.label} = ${formatFactor(factor)} ${targetUnit.label}`;
  } else {
    elements.formulaLine.querySelector("span").textContent = "选择有效的分析物与单位后显示换算关系";
  }

  const copyAllLines = [
    `ASTER · ${analyte.nameZh} (${analyte.shortName})`,
    `${elements.valueInput.value || "—"} ${fromUnit.label}`,
    ...(targetUnit
      ? [`${targetValue === null ? "—" : formatMeasurement(targetValue, precision)} ${targetUnit.label}`]
      : []),
    ...getVisibleResultUnits(snapshot).map((unit) => {
      const value = convertTo(unit.id);
      return `${value === null ? "—" : formatMeasurement(value, precision)} ${unit.label}`;
    }),
  ];
  elements.copyAllButton.dataset.copyValue = hasValue ? copyAllLines.join("\n") : "";
  elements.copyAllButton.disabled = !hasValue;
}

function classifyRange(value, min, max) {
  if (!Number.isFinite(value)) return "unknown";
  if (min !== null && value < min) return "below";
  if (max !== null && value > max) return "above";
  return "within";
}

function referenceStatusLabel(status) {
  return {
    below: "低于参考带",
    within: "位于参考带",
    above: "高于参考带",
    unknown: "等待数值",
  }[status];
}

function formatReferenceRange(min, max, unitLabel, precision) {
  if (min === null && max === null) return "—";
  if (min !== null && max !== null) {
    return `${formatMeasurement(min, precision)}–${formatMeasurement(max, precision)} ${unitLabel}`;
  }
  if (max !== null) return `≤ ${formatMeasurement(max, precision)} ${unitLabel}`;
  return `≥ ${formatMeasurement(min, precision)} ${unitLabel}`;
}

function renderHrtFeminizationTarget(snapshot) {
  const { analyte, fromUnit, numericValue, hasValue } = snapshot;
  const target = getHrtFeminizationTarget(analyte.id);

  if (!target) {
    elements.hrtTarget.hidden = true;
    return;
  }

  elements.hrtTarget.hidden = false;
  const displayMin =
    target.min === null
      ? null
      : convert(target.min, analyte, target.unitId, fromUnit.id, {
          prolactinFactor: state.prolactinFactor,
        });
  const displayMax =
    target.max === null
      ? null
      : convert(target.max, analyte, target.unitId, fromUnit.id, {
          prolactinFactor: state.prolactinFactor,
        });
  const status = hasValue ? classifyRange(numericValue, displayMin, displayMax) : "unknown";
  const domainMin = displayMin === null ? 0 : displayMin * 0.75;
  const domainMax = (displayMax ?? displayMin) * 1.25;
  const domainSpan = Math.max(domainMax - domainMin, 1);
  const position = (value) =>
    Math.min(100, Math.max(0, ((value - domainMin) / domainSpan) * 100));
  const bandStart = displayMin === null ? 0 : position(displayMin);
  const bandEnd = displayMax === null ? 100 : position(displayMax);

  elements.hrtTargetTitle.textContent = target.title;
  elements.hrtTargetRangeLabel.textContent = target.rangeLabel;
  elements.hrtTargetRangeValue.textContent = formatReferenceRange(
    displayMin,
    displayMax,
    fromUnit.label,
    state.precision,
  );
  elements.hrtTargetBand.style.setProperty("--hrt-band-start", `${bandStart}%`);
  elements.hrtTargetBand.style.setProperty("--hrt-band-width", `${Math.max(1, bandEnd - bandStart)}%`);
  elements.hrtTargetMarker.style.setProperty(
    "--hrt-marker-position",
    `${hasValue ? position(numericValue) : 50}%`,
  );
  elements.hrtTargetMarker.hidden = !hasValue;
  elements.hrtTargetStatus.className = `hrt-target-status is-${status}`;
  elements.hrtTargetStatus.textContent = {
    below: "低于监测带",
    within: "位于监测带",
    above: "高于监测带",
    unknown: "等待数值",
  }[status];

  const currentValue = hasValue
    ? `${formatMeasurement(numericValue, state.precision)} ${fromUnit.label}`
    : "当前值";
  if (!hasValue) {
    elements.hrtTargetSummary.textContent = "输入有效数值后显示是否位于常见 HRT 监测范围。";
  } else if (status === "within") {
    elements.hrtTargetSummary.textContent = `${currentValue} 位于所示常见 HRT 监测带内。`;
  } else if (status === "below") {
    elements.hrtTargetSummary.textContent = `${currentValue} 低于所示常见 HRT 监测带下限。`;
  } else {
    elements.hrtTargetSummary.textContent = `${currentValue} 高于所示常见 HRT 监测带上限。`;
  }

  elements.hrtTargetNote.textContent = target.note;
  elements.hrtTargetCaveat.textContent = target.caveat;

  const sourceFragment = document.createDocumentFragment();
  const sourceLead = document.createElement("span");
  sourceLead.textContent = "资料 · 核对于 2026-10-27";
  sourceFragment.append(sourceLead);
  for (const source of target.sources) {
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = source.label;
    sourceFragment.append(link);
  }
  elements.hrtTargetSources.replaceChildren(sourceFragment);
}

function renderFemaleReference(snapshot) {
  const { analyte, fromUnit, numericValue, hasValue } = snapshot;
  const reference = getFemaleReference(analyte.id);
  const rows = reference.rows || [];
  elements.femaleTitle.textContent = "女性水平对照";
  elements.femaleContextNote.textContent = reference.note || REFERENCE_CONTEXT_NOTE;

  if (!rows.length) {
    elements.femaleSummary.textContent = reference.title;
    const empty = document.createElement("p");
    empty.className = "female-empty";
    empty.textContent = reference.note || "当前分析物暂无可用的通用女性参考带。";
    elements.femaleRangeList.replaceChildren(empty);
    return;
  }

  const displayRows = rows.map((row) => ({
    ...row,
    displayMin:
      row.min === null
        ? null
        : convert(row.min, analyte, row.unitId, fromUnit.id, {
            prolactinFactor: state.prolactinFactor,
          }),
    displayMax:
      row.max === null
        ? null
        : convert(row.max, analyte, row.unitId, fromUnit.id, {
            prolactinFactor: state.prolactinFactor,
          }),
  }));

  const finiteMinima = displayRows
    .map((row) => row.displayMin)
    .filter((value) => Number.isFinite(value));
  const finiteMaxima = displayRows
    .map((row) => row.displayMax)
    .filter((value) => Number.isFinite(value));
  const rawDomainMin = finiteMinima.length ? Math.min(...finiteMinima) : 0;
  const rawDomainMax = finiteMaxima.length ? Math.max(...finiteMaxima) : 1;
  const domainSpan = Math.max(rawDomainMax - rawDomainMin, Math.abs(rawDomainMax || 1) * 0.1);
  const domainMin = Math.max(0, rawDomainMin - domainSpan * 0.025);
  const domainMax = rawDomainMax + domainSpan * 0.025;
  const position = (value) =>
    Math.min(100, Math.max(0, ((value - domainMin) / (domainMax - domainMin)) * 100));

  const fragment = document.createDocumentFragment();
  const withinLabels = [];
  const statuses = new Set();

  for (const row of displayRows) {
    const status = hasValue ? classifyRange(numericValue, row.displayMin, row.displayMax) : "unknown";
    statuses.add(status);
    if (status === "within") withinLabels.push(row.label);

    const item = document.createElement("div");
    item.className = `female-range-row is-${status}`;

    const top = document.createElement("div");
    top.className = "female-range-top";

    const label = document.createElement("span");
    label.className = "female-range-label";
    label.textContent = row.label;

    const range = document.createElement("span");
    range.className = "female-range-values";
    range.textContent = formatReferenceRange(
      row.displayMin,
      row.displayMax,
      fromUnit.label,
      state.precision,
    );

    const badge = document.createElement("span");
    badge.className = "female-status";
    badge.textContent = referenceStatusLabel(status);

    top.append(label, range, badge);

    const track = document.createElement("div");
    track.className = "female-range-track";
    const band = document.createElement("span");
    band.className = "female-range-band";
    const bandStart = position(row.displayMin ?? domainMin);
    const bandEnd = position(row.displayMax ?? domainMax);
    band.style.setProperty("--band-start", `${bandStart}%`);
    band.style.setProperty("--band-width", `${Math.max(1, bandEnd - bandStart)}%`);

    const marker = document.createElement("span");
    marker.className = "female-range-marker";
    marker.style.setProperty("--marker-position", `${hasValue ? position(numericValue) : 50}%`);
    if (!hasValue) marker.hidden = true;

    track.append(band, marker);
    item.append(top, track);
    fragment.append(item);
  }

  elements.femaleRangeList.replaceChildren(fragment);

  if (!hasValue) {
    elements.femaleSummary.textContent = "输入有效数值后显示对应的女性参考带位置。";
  } else if (withinLabels.length === 1) {
    elements.femaleSummary.textContent = `当前值位于${withinLabels[0]}参考带内。`;
  } else if (withinLabels.length > 1) {
    elements.femaleSummary.textContent = `当前值可与${withinLabels.join("、")}参考带重叠。`;
  } else if (statuses.has("below") && statuses.has("above")) {
    elements.femaleSummary.textContent = "当前值不在所列女性参考带内，各分期的位置不同。";
  } else if (statuses.has("below")) {
    elements.femaleSummary.textContent = "当前值低于所列女性参考带，不等于已经诊断异常。";
  } else if (statuses.has("above")) {
    elements.femaleSummary.textContent = "当前值高于所列女性参考带，不等于已经诊断异常。";
  }
}

function renderClinicalNote(analyte) {
  elements.clinicalNote.querySelector("p").textContent = analyte.note;
}

function render() {
  const snapshot = getConversionSnapshot();
  const analyte = snapshot.analyte;
  const family = FAMILY_META[analyte.family];

  elements.analyteSelect.value = analyte.id;
  elements.unitCount.textContent = `${snapshot.units.length} 个单位`;
  elements.precisionSelect.value = String(state.precision);
  renderQuickPicks();
  renderAnalyteProfile(analyte);
  renderAssayFactor(analyte);
  buildUnitOptions(snapshot.fromUnit.id);
  renderResults(snapshot);
  renderHrtFeminizationTarget(snapshot);
  renderFemaleReference(snapshot);
  renderClinicalNote(analyte);
  updateUrl(analyte, snapshot.fromUnit);
  createIcons();
}

function createIcons() {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons({
      attrs: {
        "aria-hidden": "true",
        "stroke-width": 1.8,
      },
    });
  }
}

function updateUrl(analyte, fromUnit) {
  const parameters = new URLSearchParams(window.location.search);
  parameters.set("analyte", analyte.id);
  parameters.set("unit", fromUnit.id);
  if (elements.valueInput.value.trim()) parameters.set("value", elements.valueInput.value.trim());
  else parameters.delete("value");
  if (state.precision !== 5) parameters.set("precision", String(state.precision));
  else parameters.delete("precision");
  if (state.expanded) parameters.set("more", "1");
  else parameters.delete("more");
  if (analyte.usesAssayFactor && state.prolactinFactor !== DEFAULT_ASSAY_FACTOR) {
    parameters.set("assayFactor", String(state.prolactinFactor));
  } else {
    parameters.delete("assayFactor");
  }

  const nextUrl = `${window.location.pathname}?${parameters.toString()}${window.location.hash}`;
  window.history.replaceState(null, "", nextUrl);
}

function selectAnalyte(analyteId) {
  const analyte = getAnalyte(analyteId);
  state.analyteId = analyte.id;
  state.fromUnitId = analyte.defaultUnitId;
  state.expanded = false;
  render();
  storeSettings();
  elements.valueInput.focus();
  elements.valueInput.select();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 2200);
}

async function copyText(text, message = "已复制") {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast(message);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand("copy");
    textarea.remove();
    showToast(copied ? message : "无法访问剪贴板");
  }
}

function handleCopy(button) {
  const value = button.dataset.copyValue;
  if (!value) return;
  copyText(value, "换算结果已复制");
}

function setupEventListeners() {
  elements.analyteSelect.addEventListener("change", () => {
    selectAnalyte(elements.analyteSelect.value);
  });

  elements.quickPicks.addEventListener("click", (event) => {
    const button = event.target.closest("[data-analyte]");
    if (button) selectAnalyte(button.dataset.analyte);
  });

  elements.valueInput.addEventListener("input", () => {
    render();
  });

  elements.fromUnit.addEventListener("change", () => {
    state.fromUnitId = elements.fromUnit.value;
    state.expanded = false;
    render();
    storeSettings();
  });

  elements.precisionSelect.addEventListener("change", () => {
    state.precision = clampInteger(elements.precisionSelect.value, 3, 7);
    render();
    storeSettings();
  });

  elements.showMoreButton.addEventListener("click", () => {
    state.expanded = !state.expanded;
    render();
  });

  elements.swapButton.addEventListener("click", () => {
    const snapshot = getConversionSnapshot();
    if (!snapshot.targetUnit) return;
    const converted = snapshot.convertTo(snapshot.targetUnit.id);
    if (converted !== null) {
      elements.valueInput.value = formatMeasurement(converted, 8).replaceAll(",", "");
    }
    state.fromUnitId = snapshot.targetUnit.id;
    state.expanded = false;
    render();
    storeSettings();
    showToast("已切换换算方向");
  });

  elements.resetButton.addEventListener("click", () => {
    state.analyteId = "estradiol";
    state.fromUnitId = "pg_ml";
    state.precision = 5;
    state.expanded = false;
    state.prolactinFactor = DEFAULT_ASSAY_FACTOR;
    elements.valueInput.value = "100";
    render();
    storeSettings();
    showToast("已恢复默认换算");
  });

  elements.assayFactorInput.addEventListener("input", () => {
    const rawValue = elements.assayFactorInput.value.trim();
    if (!rawValue || !Number.isFinite(Number(rawValue))) return;
    state.prolactinFactor = clampNumber(rawValue, 1, 100);
    render();
    storeSettings();
  });

  elements.assayHelp.addEventListener("click", () => {
    showToast("催乳素质量单位与 mIU/L 的换算依赖免疫测定标准。");
  });

  elements.primaryCopy.addEventListener("click", () => handleCopy(elements.primaryCopy));
  elements.copyAllButton.addEventListener("click", () => handleCopy(elements.copyAllButton));

  elements.resultList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-copy-value]");
    if (button) handleCopy(button);
  });

  elements.shareButton.addEventListener("click", async () => {
    const shareUrl = window.location.href;
    if (navigator.share && window.matchMedia("(max-width: 680px)").matches) {
      try {
        await navigator.share({
          title: "ASTER · HRT 激素单位换算器",
          text: "使用 ASTER 换算 HRT 激素单位",
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    await copyText(shareUrl, "当前换算链接已复制");
  });

  window.addEventListener("online", updateNetworkState);
  window.addEventListener("offline", updateNetworkState);

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    elements.installButton.hidden = false;
  });

  elements.installButton.addEventListener("click", async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") showToast("ASTER 已添加到设备");
    installPrompt = null;
    elements.installButton.hidden = true;
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    elements.installButton.hidden = true;
    showToast("ASTER 已安装，可离线使用");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
      event.preventDefault();
      elements.valueInput.focus();
      elements.valueInput.select();
    }
  });
}

function updateNetworkState() {
  const online = navigator.onLine;
  elements.networkState.classList.toggle("is-offline", !online);
  elements.networkLabel.textContent = online ? "在线" : "离线可用";
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(window.location.protocol)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Offline installation is optional; online conversion is unaffected.
    });
  });
}

function init() {
  buildAnalyteOptions();
  elements.valueInput.value = initialValue || "100";
  setupEventListeners();
  updateNetworkState();
  render();
  elements.year.textContent = new Date().getFullYear();
  document.body.classList.add("is-ready");
  registerServiceWorker();
}

init();
