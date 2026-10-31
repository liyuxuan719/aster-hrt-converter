import { ANALYTES, formatMeasurement } from "../src/converter.js";
import { evaluateRow, worksheetCsv, MAX_WORKSHEET_ROWS } from "../src/worksheet.js";

export function initWorksheet({ getCurrent, getOptions, notify }) {
  const list = document.querySelector("#worksheet-rows");
  const status = document.querySelector("#worksheet-status");
  const addButton = document.querySelector("#worksheet-add");
  const exportButton = document.querySelector("#worksheet-export");
  const rows = [];
  const make = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const options = () => ({ prolactinFactor: getOptions().prolactinFactor });

  function refresh() {
    const settings = getOptions();
    let valid = 0;
    rows.forEach((entry, index) => {
      entry.legend.textContent = `第 ${index + 1} 项`;
      const result = evaluateRow(entry.data, options());
      entry.output.textContent = result.error || `${formatMeasurement(result.result, settings.precision)} ${result.to.label}`;
      entry.output.classList.toggle("is-error", Boolean(result.error));
      if (!result.error) valid += 1;
    });
    status.textContent = `${rows.length} 项，${valid} 项可导出 · PRL 系数 ${settings.prolactinFactor} mIU/L = 1 ng/mL`;
    addButton.disabled = rows.length >= MAX_WORKSHEET_ROWS;
    document.querySelector("#worksheet-current").disabled = addButton.disabled;
    exportButton.disabled = !rows.length || valid !== rows.length;
  }

  function addRow(initial = { analyteId: "estradiol", value: "", fromUnitId: "pg_ml", toUnitId: "pmol_l" }) {
    if (rows.length >= MAX_WORKSHEET_ROWS) return;
    const data = { ...initial };
    const box = make("fieldset");
    box.className = "worksheet-row";
    const legend = make("legend");
    box.append(legend);
    const label = (text, control) => {
      const node = make("label", text);
      node.append(control);
      box.append(node);
      return control;
    };
    const analyte = label("分析物", make("select"));
    ANALYTES.forEach((item) => { const option = make("option", `${item.shortName} · ${item.nameZh}`); option.value = item.id; analyte.append(option); });
    analyte.value = data.analyteId;
    const value = label("数值", make("input"));
    value.type = "number"; value.min = "0"; value.step = "any";
    value.inputMode = "decimal"; value.autocomplete = "off"; value.value = data.value;
    const from = label("原始单位", make("select"));
    const to = label("目标单位", make("select"));
    const output = make("output");
    output.setAttribute("aria-live", "polite");
    output.className = "worksheet-result";
    label("结果", output);
    const remove = make("button", "移除");
    remove.type = "button"; remove.className = "quiet-button";
    box.append(remove);
    const entry = { data, box, legend, output };
    rows.push(entry);
    list.append(box);

    function unitOptions() {
      const item = ANALYTES.find((item) => item.id === data.analyteId);
      for (const select of [from, to]) {
        select.replaceChildren();
        item.units.forEach((unit) => { const option = make("option", unit.label); option.value = unit.id; select.append(option); });
      }
      from.value = data.fromUnitId; to.value = data.toUnitId;
    }
    unitOptions();
    analyte.addEventListener("change", () => {
      data.analyteId = analyte.value;
      const item = ANALYTES.find((item) => item.id === data.analyteId);
      data.fromUnitId = item.defaultUnitId; data.toUnitId = item.defaultTargetUnitId;
      unitOptions(); refresh();
    });
    value.addEventListener("input", () => { data.value = value.value; refresh(); });
    from.addEventListener("change", () => { data.fromUnitId = from.value; refresh(); });
    to.addEventListener("change", () => { data.toUnitId = to.value; refresh(); });
    remove.addEventListener("click", () => { rows.splice(rows.indexOf(entry), 1); box.remove(); refresh(); addButton.focus(); });
    refresh();
  }

  addButton.addEventListener("click", () => addRow());
  document.querySelector("#worksheet-current").addEventListener("click", () => addRow(getCurrent()));
  document.querySelector("#worksheet-clear").addEventListener("click", () => {
    if (!rows.length || window.confirm("清空本次批量换算？尚未导出的内容将移除。")) {
      rows.length = 0; list.replaceChildren(); refresh();
    }
  });
  exportButton.addEventListener("click", () => {
    try {
      const blob = new Blob([worksheetCsv(rows.map((row) => row.data), options())], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = make("a");
      anchor.href = url; anchor.download = `aster-worksheet-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.append(anchor); anchor.click(); anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("批量换算 CSV 已导出");
    } catch { notify("请先修正全部换算项再导出"); }
  });
  document.querySelector("#precision-select").addEventListener("change", refresh);
  document.querySelector("#assay-factor-input").addEventListener("input", refresh);
  document.querySelector("#reset-button").addEventListener("click", refresh);
  addRow();
}
