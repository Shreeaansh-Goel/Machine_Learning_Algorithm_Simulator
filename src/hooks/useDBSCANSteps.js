import { useEffect } from "react";

import { runAlgorithm } from "../api/client";
import { getFriendlyApiErrorMessage } from "../utils/apiErrorMessages";
import { getDatasetGuardMessage } from "../utils/datasetGuards";

/**
 * Fetches DBSCAN algorithm steps whenever dataset or params change.
 * @param {{
 *  datasetPoints: Array<Record<string, unknown>>,
 *  params: { eps: number, min_samples: number, metric: "euclidean" | "manhattan" },
 *  setSteps: (steps: Array<Record<string, unknown>>) => void,
 *  setPlaying: (playing: boolean) => void,
 *  setLoading: (loading: boolean) => void,
 *  setError: (message: string) => void,
 * }} options
 */
export const useDBSCANSteps = ({
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

      setLoading(true);
      setError("");

      try {
        const response = await runAlgorithm("dbscan", datasetPoints, params);
        if (!cancelled) {
          setSteps(response.data?.steps ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setSteps([]);
          setError(
            getFriendlyApiErrorMessage(error, "Unable to generate DBSCAN steps.")
          );
          console.error("[DBSCANViz] failed to fetch steps", error);
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

export default useDBSCANSteps;
