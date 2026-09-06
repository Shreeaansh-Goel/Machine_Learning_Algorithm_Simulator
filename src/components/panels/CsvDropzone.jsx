import { useRef } from "react";

/**
 * CSV drag-and-drop area with browse fallback.
 * @param {{
 *  fileName: string,
 *  isDragging: boolean,
 *  onFileSelected: (file: File | null) => void,
 *  onDragStateChange: (isDragging: boolean) => void,
 * }} props
 * @returns {JSX.Element}
 */
export const CsvDropzone = ({
  fileName,
  isDragging,
  onFileSelected,
  onDragStateChange,
}) => {
  const fileInputRef = useRef(/** @type {HTMLInputElement | null} */ (null));

  /**
   * Opens the hidden file input picker.
   * @returns {void}
   */
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handles local file input changes.
   * @param {import("react").ChangeEvent<HTMLInputElement>} event
   * @returns {void}
   */
  const handleInputChange = (event) => {
    onFileSelected(event.target.files?.[0] ?? null);
  };

  /**
   * Handles file drop into dropzone.
   * @param {import("react").DragEvent<HTMLDivElement>} event
   * @returns {void}
   */
  const handleDrop = (event) => {
    event.preventDefault();
    onDragStateChange(false);
    onFileSelected(event.dataTransfer.files?.[0] ?? null);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(event) => {
        event.preventDefault();
        onDragStateChange(true);
      }}
      onDragLeave={() => onDragStateChange(false)}
      className={`rounded-xl border-2 border-dashed p-4 text-center transition ${
        isDragging ? "border-primary bg-primary-light" : "border-slate-300 bg-slate-50"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleInputChange}
      />
      <p className="text-sm font-medium text-slate-700">Drag and drop CSV here</p>
      <button
        type="button"
        onClick={handleBrowseClick}
        className="mt-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white"
      >
        Browse CSV
      </button>
      {fileName && <p className="mt-2 text-xs text-slate-500">{fileName}</p>}
    </div>
  );
};

export default CsvDropzone;
