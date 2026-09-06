import { useEffect } from "react";

import { runAlgorithm } from "../api/client";
import { getFriendlyApiErrorMessage } from "../utils/apiErrorMessages";
import { getDatasetGuardMessage } from "../utils/datasetGuards";

/**
 * Fetches SVM steps whenever dataset or params change.
 * @param {{
 *  datasetPoints: Array<Record<string, unknown>>,
 *  params: { kernel: "linear" | "rbf", C: number },
 *  setSteps: (steps: Array<Record<string, unknown>>) => void,
 *  setPlaying: (playing: boolean) => void,
 *  setLoading: (loading: boolean) => void,
 *  setError: (message: string) => void,
 * }} options
 */
export const useSVMSteps = ({
  datasetPoints,
  params,
  setSteps,
  setPlaying,
  setLoading,
  setError,
}) => {
  useEffect(() => {
    let cancelled = false;

    /**
     * Requests SVM execution trace from backend.
     * @returns {Promise<void>}
     */
    const fetchSteps = async () => {
      const datasetGuardMessage = getDatasetGuardMessage(datasetPoints);
      if (datasetGuardMessage) {
        setSteps([]);
        setLoading(false);
        setPlaying(false);
        setError(datasetGuardMessage);
        return;
      }

      const labels = datasetPoints
        .map((point) => String(point?.label ?? "").trim())
        .filter((label) => label !== "");
      const uniqueLabels = new Set(labels);

      if (labels.length !== datasetPoints.length) {
        setSteps([]);
        setLoading(false);
        setPlaying(false);
        setError(
          "This algorithm needs labeled points. Use a built-in dataset or upload CSV with labels."
        );
        return;
      }

      if (uniqueLabels.size !== 2) {
        setSteps([]);
        setLoading(false);
        setPlaying(false);
        setError("SVM visualizer currently supports exactly two classes.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await runAlgorithm("svm", datasetPoints, params);
        if (!cancelled) {
          setSteps(response.data?.steps ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setSteps([]);
          setError(getFriendlyApiErrorMessage(error, "Unable to generate SVM steps."));
          console.error("[SVMViz] failed to fetch steps", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setPlaying(false);
        }
      }
    };

    fetchSteps();
    return () => {
      cancelled = true;
    };
  }, [datasetPoints, params, setError, setLoading, setPlaying, setSteps]);
};

export default useSVMSteps;
