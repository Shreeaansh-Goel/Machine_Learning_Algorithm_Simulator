/**
 * Validates dataset readiness before algorithm execution.
 * @param {Array<Record<string, unknown>>} datasetPoints
 * @returns {string}
 */
export const getDatasetGuardMessage = (datasetPoints) => {
  if (!Array.isArray(datasetPoints) || datasetPoints.length === 0) {
    return "Please load a dataset first.";
  }

  if (datasetPoints.length < 10) {
    return "Dataset too small - try a built-in dataset.";
  }

  return "";
};

export default {
  getDatasetGuardMessage,
};
