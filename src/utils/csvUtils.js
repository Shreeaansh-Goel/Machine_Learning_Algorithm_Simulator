import Papa from "papaparse";

/**
 * @typedef {Record<string, unknown>} CsvRow
 */

/**
 * Converts a raw CSV value into a finite number.
 * @param {unknown} value
 * @returns {number | null}
 */
export const toFiniteNumber = (value) => {
  const parsed = Number.parseFloat(String(value ?? "").trim());
  return Number.isFinite(parsed) ? parsed : null;
};

/**
 * Returns columns where all non-empty values are numeric.
 * @param {CsvRow[]} rows
 * @returns {string[]}
 */
export const getNumericColumns = (rows) => {
  const keys = Object.keys(rows[0] ?? {});
  return keys.filter((key) => {
    let hasValue = false;
    for (const row of rows) {
      const value = row[key];
      if (value === "" || value == null) {
        continue;
      }
      hasValue = true;
      if (toFiniteNumber(value) == null) {
        return false;
      }
    }
    return hasValue;
  });
};

/**
 * Checks whether a selected numeric column has usable variance.
 * @param {CsvRow[]} rows
 * @param {string} column
 * @returns {boolean}
 */
export const hasColumnVariance = (rows, column) => {
  const numericValues = rows
    .map((row) => toFiniteNumber(row[column]))
    .filter((value) => value != null)
    .map((value) => /** @type {number} */ (value));

  if (numericValues.length < 2) {
    return false;
  }

  const reference = numericValues[0];
  return numericValues.some((value) => Math.abs(value - reference) > 1e-10);
};

/**
 * Builds normalized point objects from selected CSV columns.
 * @param {CsvRow[]} rows
 * @param {string} xColumn
 * @param {string} yColumn
 * @returns {{ x: number, y: number, label: null }[]}
 */
export const buildPointsFromRows = (rows, xColumn, yColumn) =>
  rows
    .map((row) => ({
      x: toFiniteNumber(row[xColumn]),
      y: toFiniteNumber(row[yColumn]),
    }))
    .filter((row) => row.x != null && row.y != null)
    .map((row) => ({
      x: /** @type {number} */ (row.x),
      y: /** @type {number} */ (row.y),
      label: null,
    }));

/**
 * Parses a CSV file into row objects.
 * @param {File} file
 * @returns {Promise<CsvRow[]>}
 */
export const parseCsvFile = (file) =>
  new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0) {
          reject(new Error(result.errors[0].message));
          return;
        }
        const rows = /** @type {CsvRow[]} */ (result.data ?? []);
        resolve(rows);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
