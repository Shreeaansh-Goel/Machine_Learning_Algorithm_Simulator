import { useState } from "react";
import CsvDropzone from "./CsvDropzone.jsx";
import CsvColumnSelector from "./CsvColumnSelector.jsx";
import {
  buildPointsFromRows,
  getNumericColumns,
  hasColumnVariance,
  parseCsvFile,
} from "../../utils/csvUtils.js";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * CSV upload tab with parsing and numeric column selection.
 * @param {{ onLoadDataset: (name: string, points: { x: number, y: number, label: null }[], xColumn: string, yColumn: string) => void }} props
 * @returns {JSX.Element}
 */
export const CsvUploadTab = ({ onLoadDataset }) => {
  const [rows, setRows] = useState([]);
  const [numericColumns, setNumericColumns] = useState([]);
  const [xColumn, setXColumn] = useState("");
  const [yColumn, setYColumn] = useState("");
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState("");

  /**
   * Handles CSV file parsing and validation.
   * @param {File | null} file
   * @returns {Promise<void>}
   */
  const handleFileSelected = async (file) => {
    if (!file) {
      return;
    }
    setError("");
    setRows([]);
    setNumericColumns([]);
    setFileName(file.name);
    if (file.size > MAX_FILE_SIZE) {
      setError("File too large. Maximum size is 5MB.");
      return;
    }
    try {
      const parsedRows = await parseCsvFile(file);
      if (parsedRows.length < 10) {
        setError("CSV must contain at least 10 rows.");
        return;
      }
      const numeric = getNumericColumns(parsedRows);
      if (numeric.length < 2) {
        setError("At least two numeric columns are required.");
        return;
      }
      setRows(parsedRows);
      setNumericColumns(numeric);
      setXColumn(numeric[0]);
      setYColumn(numeric[1]);
    } catch {
      setError("Unable to parse CSV file.");
    }
  };

  /**
   * Builds point payload and emits dataset to parent.
   * @returns {void}
   */
  const handleLoadDataset = () => {
    if (!hasColumnVariance(rows, xColumn) || !hasColumnVariance(rows, yColumn)) {
      setError("Selected column has no variance - pick a different column.");
      return;
    }

    const points = buildPointsFromRows(rows, xColumn, yColumn);
    if (points.length < 10) {
      setError("Selected columns produced fewer than 10 valid rows.");
      return;
    }
    setError("");
    onLoadDataset(fileName || "Uploaded CSV", points, xColumn, yColumn);
  };

  const canLoad = rows.length > 0 && xColumn !== "" && yColumn !== "";

  return (
    <div className="space-y-3">
      <CsvDropzone
        fileName={fileName}
        isDragging={isDragging}
        onFileSelected={handleFileSelected}
        onDragStateChange={setIsDragging}
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {numericColumns.length > 0 && (
        <CsvColumnSelector
          numericColumns={numericColumns}
          xColumn={xColumn}
          yColumn={yColumn}
          canLoad={canLoad}
          onXChange={setXColumn}
          onYChange={setYColumn}
          onLoadDataset={handleLoadDataset}
        />
      )}
    </div>
  );
};

export default CsvUploadTab;
