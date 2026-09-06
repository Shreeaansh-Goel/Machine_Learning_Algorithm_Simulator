import { useEffect } from "react";

import { runAlgorithm } from "../api/client";
import { getFriendlyApiErrorMessage } from "../utils/apiErrorMessages";
import { getDatasetGuardMessage } from "../utils/datasetGuards";

/**
 * Fetches PCA steps whenever dataset or params change.
 * @param {{
 *  datasetPoints: Array<Record<string, unknown>>,
 *  params: { n_components: number },
 *  setSteps: (steps: Array<Record<string, unknown>>) => void,
 *  setPlaying: (playing: boolean) => void,
 *  setLoading: (loading: boolean) => void,
 *  setError: (message: string) => void,
 * }} options
 */
export const usePCASteps = ({
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
     * Requests PCA execution trace from backend.
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

      setLoading(true);
      setError("");

      try {
        const response = await runAlgorithm("pca", datasetPoints, params);
        if (!cancelled) {
          setSteps(response.data?.steps ?? []);
        }
      } catch (error) {
        if (!cancelled) {
          setSteps([]);
          setError(getFriendlyApiErrorMessage(error, "Unable to generate PCA steps."));
          console.error("[PCAViz] failed to fetch steps", error);
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

export default usePCASteps;
