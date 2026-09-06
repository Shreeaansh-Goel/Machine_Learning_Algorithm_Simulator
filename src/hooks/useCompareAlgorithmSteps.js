import { useEffect } from "react";

import { runAlgorithm } from "../api/client";
import { getFriendlyApiErrorMessage } from "../utils/apiErrorMessages";
import {
  buildAlgorithmExtraPayload,
  getAlgorithmEndpoint,
  getAlgorithmLabel,
} from "../utils/compareUtils";
import { getDatasetGuardMessage } from "../utils/datasetGuards";

/**
 * Fetches one compare column's algorithm steps when inputs change.
 * @param {{
 *  datasetPoints: Array<Record<string, unknown>>,
 *  algorithmName: string,
 *  params: Record<string, unknown>,
 *  setSteps: (steps: Array<Record<string, unknown>>) => void,
 *  setLoading: (loading: boolean) => void,
 *  setError: (message: string) => void,
 *  setPlaying: (playing: boolean) => void,
 *  setSyncedProgress: (progress: number) => void,
 * }} options
 * @returns {void}
 */
export const useCompareAlgorithmSteps = ({
  datasetPoints,
  algorithmName,
  params,
  setSteps,
  setLoading,
  setError,
  setPlaying,
  setSyncedProgress,
}) => {
  useEffect(() => {
    let cancelled = false;

    /**
     * Runs one backend algorithm endpoint and stores the full step trace.
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

      const labelValues = datasetPoints
        .map((point) => String(point?.label ?? "").trim())
        .filter((label) => label !== "");
      const uniqueLabels = new Set(labelValues);
      const needsLabeledData =
        algorithmName === "knn" || algorithmName === "decision-tree";

      if (needsLabeledData && labelValues.length !== datasetPoints.length) {
        setSteps([]);
        setLoading(false);
        setError(
          "This algorithm needs labeled points. Use a built-in dataset or upload CSV with labels."
        );
        return;
      }

      if (algorithmName === "decision-tree" && uniqueLabels.size < 2) {
        setSteps([]);
        setLoading(false);
        setError("Decision Tree needs at least two unique labels.");
        return;
      }

      setLoading(true);
      setError("");
      setPlaying(false);
      setSyncedProgress(0);

      try {
        const endpoint = getAlgorithmEndpoint(algorithmName);
        const extraPayload = buildAlgorithmExtraPayload(algorithmName, datasetPoints);
        const response = await runAlgorithm(endpoint, datasetPoints, params, extraPayload);
        if (!cancelled) {
          setSteps(response.data?.steps ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setSteps([]);
          setError(
            getFriendlyApiErrorMessage(
              error,
              `Unable to run ${getAlgorithmLabel(algorithmName)} on this dataset.`
            )
          );
          console.error("[CompareMode] failed to fetch steps", error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSteps();
    return () => {
      cancelled = true;
    };
  }, [
    datasetPoints,
    algorithmName,
    params,
    setSteps,
    setLoading,
    setError,
    setPlaying,
    setSyncedProgress,
  ]);
};

export default useCompareAlgorithmSteps;
