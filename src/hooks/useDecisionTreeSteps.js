import { useEffect } from "react";

import { runAlgorithm } from "../api/client";
import { getFriendlyApiErrorMessage } from "../utils/apiErrorMessages";
import { getDatasetGuardMessage } from "../utils/datasetGuards";

/**
 * Fetches Decision Tree steps whenever points or params change.
 * @param {{
 *  datasetPoints: Array<Record<string, unknown>>,
 *  params: { max_depth: number, criterion: "gini" | "entropy", min_samples_split: number },
 *  setSteps: (steps: Array<Record<string, unknown>>) => void,
 *  setPlaying: (playing: boolean) => void,
 *  setLoading: (loading: boolean) => void,
 *  setError: (message: string) => void,
 * }} options
 */
export const useDecisionTreeSteps = ({
  datasetPoints,
  params,
  setSteps,
  setPlaying,
  setLoading,
  setError,
}) => {
  useEffect(() => {
    let cancelled = false;

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
      if (labelValues.length !== datasetPoints.length) {
        setSteps([]);
        setLoading(false);
        setPlaying(false);
        setError(
          "This algorithm needs labeled points. Use a built-in dataset or upload CSV with labels."
        );
        return;
      }

      if (uniqueLabels.size < 2) {
        setSteps([]);
        setLoading(false);
        setPlaying(false);
        setError("Decision Tree needs at least two unique labels.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await runAlgorithm("decision-tree", datasetPoints, params);
        if (!cancelled) {
          setSteps(response.data?.steps ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setSteps([]);
          setError(
            getFriendlyApiErrorMessage(
              error,
              "Unable to generate Decision Tree steps."
            )
          );
          console.error("[DecisionTreeViz] failed to fetch steps", error);
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

export default useDecisionTreeSteps;
