/**
 * Canvas loading state with animated SVG spinner.
 * @param {{ algorithmLabel: string }} props
 * @returns {JSX.Element}
 */
export const CanvasLoadingState = ({ algorithmLabel }) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-700">
    <svg
      className="h-10 w-10 animate-spin text-primary"
      viewBox="0 0 50 50"
      role="img"
      aria-label="Loading"
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="90 45"
      />
    </svg>
    <p className="text-sm font-medium">Running {algorithmLabel}...</p>
  </div>
);

export default CanvasLoadingState;
