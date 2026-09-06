import { useEffect } from "react";

import { runAlgorithm } from "../api/client";
import { getFriendlyApiErrorMessage } from "../utils/apiErrorMessages";
import { getDatasetGuardMessage } from "../utils/datasetGuards";

/**
 * Fetches K-Means algorithm steps when input dataset or params change.
 * @param {{
 *  datasetPoints: Array<Record<string, unknown>>,
 *  params: { k: number, max_iter: number, init: "random" | "kmeans++" },
 *  setSteps: (steps: Array<Record<string, unknown>>) => void,
 *  setPlaying: (playing: boolean) => void,
 *  setLoading: (loading: boolean) => void,
 *  setError: (message: string) => void,
 * }} options
 */
export const useKMeansSteps = ({
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
        const response = await runAlgorithm("kmeans", datasetPoints, params);
        if (!cancelled) {
          setSteps(response.data?.steps ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setSteps([]);
          setError(
            getFriendlyApiErrorMessage(
              error,
              "Unable to generate K-Means steps."
            )
          );
          console.error("[KMeansViz] failed to fetch steps", error);
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

export default useKMeansSteps;
