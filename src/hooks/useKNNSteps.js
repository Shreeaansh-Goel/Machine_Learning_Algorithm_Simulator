import { useEffect } from "react";

import { runAlgorithm } from "../api/client";
import { getFriendlyApiErrorMessage } from "../utils/apiErrorMessages";
import { getDatasetGuardMessage } from "../utils/datasetGuards";

/**
 * Fetches KNN algorithm steps whenever dataset, params, or query point changes.
 * @param {{
 *  datasetPoints: Array<Record<string, unknown>>,
 *  params: { k: number, metric: "euclidean" | "manhattan" },
 *  queryPoint: { x: number, y: number } | null,
 *  setSteps: (steps: Array<Record<string, unknown>>) => void,
 *  setPlaying: (playing: boolean) => void,
 *  setLoading: (loading: boolean) => void,
 *  setError: (message: string) => void,
 * }} options
 */
export const useKNNSteps = ({
  datasetPoints,
  params,
  queryPoint,
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

      if (labelValues.length !== datasetPoints.length) {
        setSteps([]);
        setLoading(false);
        setPlaying(false);
        setError(
          "This algorithm needs labeled points. Use a built-in dataset or upload CSV with labels."
        );
        return;
      }

      if (!queryPoint) {
        setSteps([]);
        setLoading(false);
        setPlaying(false);
        setError("Click on the chart to place a query point.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await runAlgorithm("knn", datasetPoints, params, {
          query_point: queryPoint,
        });
        if (!cancelled) {
          setSteps(response.data?.steps ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setSteps([]);
          setError(
            getFriendlyApiErrorMessage(error, "Unable to generate KNN steps.")
          );
          console.error("[KNNViz] failed to fetch steps", error);
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
  }, [
    datasetPoints,
    params,
    queryPoint,
    setError,
    setLoading,
    setPlaying,
    setSteps,
  ]);
};

export default useKNNSteps;