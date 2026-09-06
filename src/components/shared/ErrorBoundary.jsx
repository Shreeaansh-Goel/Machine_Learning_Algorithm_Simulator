import { ErrorBoundary as ReactErrorBoundary } from "react-error-boundary";

/**
 * Fallback content shown when visualizer rendering fails.
 * @param {{ error: Error, resetErrorBoundary: () => void }} props
 * @returns {JSX.Element}
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-6 text-center">
    <p className="text-base font-semibold text-rose-700">Something went wrong in this visualizer.</p>
    <p className="max-w-xl text-sm text-rose-600">
      {error?.message || "Unexpected rendering error."}
    </p>
    <button
      type="button"
      onClick={resetErrorBoundary}
      className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
    >
      Try again
    </button>
  </div>
);

/**
 * Shared visualizer-safe error boundary wrapper.
 * @param {{ children: import("react").ReactNode, resetKeys?: unknown[] }} props
 * @returns {JSX.Element}
 */
export const ErrorBoundary = ({ children, resetKeys = [] }) => {
  /**
   * Logs render errors for debugging.
   * @param {Error} error
   * @param {{ componentStack: string }} info
   */
  const handleError = (error, info) => {
    console.error("[ErrorBoundary] Visualizer render failure", error, info);
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      resetKeys={resetKeys}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default ErrorBoundary;
