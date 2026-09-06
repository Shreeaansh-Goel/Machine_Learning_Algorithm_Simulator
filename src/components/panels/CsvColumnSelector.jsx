/**
 * Selectors for choosing X/Y numeric CSV columns.
 * @param {{
 *  numericColumns: string[],
 *  xColumn: string,
 *  yColumn: string,
 *  canLoad: boolean,
 *  onXChange: (value: string) => void,
 *  onYChange: (value: string) => void,
 *  onLoadDataset: () => void,
 * }} props
 * @returns {JSX.Element}
 */
export const CsvColumnSelector = ({
  numericColumns,
  xColumn,
  yColumn,
  canLoad,
  onXChange,
  onYChange,
  onLoadDataset,
}) => (
  <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="text-xs font-medium text-slate-600">
        X Axis
        <select
          value={xColumn}
          onChange={(event) => onXChange(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          {numericColumns.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-medium text-slate-600">
        Y Axis
        <select
          value={yColumn}
          onChange={(event) => onYChange(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          {numericColumns.map((column) => (
            <option key={column} value={column}>
              {column}
            </option>
          ))}
        </select>
      </label>
    </div>
    <button
      type="button"
      disabled={!canLoad}
      onClick={onLoadDataset}
      className="w-full rounded-full bg-teal px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
    >
      Load Dataset
    </button>
  </div>
);

export default CsvColumnSelector;
