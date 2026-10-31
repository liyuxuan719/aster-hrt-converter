import { ANALYTES, convert, getUnits } from "./converter.js";

export const MAX_WORKSHEET_ROWS = 50;

export function evaluateRow(row, options = {}) {
  const analyte = ANALYTES.find((item) => item.id === row.analyteId);
  if (!analyte) return { error: "请选择有效的分析物" };
  if (String(row.value ?? "").trim() === "") return { error: "请输入数值" };
  const value = Number(row.value);
  if (!Number.isFinite(value) || value < 0) return { error: "请输入非负有限数值" };
  const units = getUnits(analyte, options);
  const from = units.find((unit) => unit.id === row.fromUnitId);
  const to = units.find((unit) => unit.id === row.toUnitId);
  if (!from || !to) return { error: "单位与分析物不匹配" };
  const result = convert(value, analyte, from.id, to.id, options);
  if (!Number.isFinite(result)) return { error: "结果超出数值范围" };
  return { analyte, value, from, to, result,
    assayFactor: analyte.usesAssayFactor ? (options.prolactinFactor ?? 21.2) : "" };
}

export function worksheetCsv(rows, options = {}) {
  if (!rows.length || rows.length > MAX_WORKSHEET_ROWS) throw new RangeError("Invalid worksheet size.");
  const output = [["analyte", "input_value", "input_unit", "output_value", "output_unit", "prolactin_mIU_L_per_ng_mL"]];
  for (const row of rows) {
    const evaluated = evaluateRow(row, options);
    if (evaluated.error) throw new TypeError(evaluated.error);
    output.push([evaluated.analyte.nameZh, evaluated.value, evaluated.from.label,
      evaluated.result, evaluated.to.label, evaluated.assayFactor]);
  }
  return `\uFEFF${output.map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\r\n")}`;
}
