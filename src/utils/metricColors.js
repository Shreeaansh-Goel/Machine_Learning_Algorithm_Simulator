export const BAR_COLOR_CLASSES = {
  purple:
    "[&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary",
  red: "[&::-webkit-progress-value]:bg-rose-500 [&::-moz-progress-bar]:bg-rose-500",
  amber:
    "[&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500",
  green:
    "[&::-webkit-progress-value]:bg-emerald-500 [&::-moz-progress-bar]:bg-emerald-500",
  blue: "[&::-webkit-progress-value]:bg-sky-500 [&::-moz-progress-bar]:bg-sky-500",
  teal: "[&::-webkit-progress-value]:bg-teal-500 [&::-moz-progress-bar]:bg-teal-500",
  slate:
    "[&::-webkit-progress-value]:bg-slate-400 [&::-moz-progress-bar]:bg-slate-400",
  sky: "[&::-webkit-progress-value]:bg-sky-500 [&::-moz-progress-bar]:bg-sky-500",
};

/**
 * Resolves a progress bar color class based on metric quality thresholds.
 * @param {string} metricName
 * @param {number | null | undefined} value
 * @returns {string}
 */
export const getBarColor = (metricName, value) => {
  const metric = String(metricName ?? "").toLowerCase();
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : null;

  if (metric === "noise_ratio") {
    return BAR_COLOR_CLASSES.red;
  }

  if (metric === "points_processed") {
    return BAR_COLOR_CLASSES.purple;
  }

  if (
    metric === "inertia" ||
    metric === "mse" ||
    metric === "rmse" ||
    metric === "loss"
  ) {
    return BAR_COLOR_CLASSES.amber;
  }

  if (numeric === null) {
    return BAR_COLOR_CLASSES.slate;
  }

  if (metric === "silhouette_score") {
    if (numeric > 0.5) {
      return BAR_COLOR_CLASSES.green;
    }
    if (numeric >= 0.2) {
      return BAR_COLOR_CLASSES.amber;
    }
    return BAR_COLOR_CLASSES.red;
  }

  if (metric === "accuracy") {
    if (numeric > 80) {
      return BAR_COLOR_CLASSES.green;
    }
    if (numeric >= 50) {
      return BAR_COLOR_CLASSES.amber;
    }
    return BAR_COLOR_CLASSES.red;
  }

  if (metric === "precision" || metric === "recall" || metric === "f1") {
    if (numeric > 0.8) {
      return BAR_COLOR_CLASSES.green;
    }
    if (numeric >= 0.5) {
      return BAR_COLOR_CLASSES.amber;
    }
    return BAR_COLOR_CLASSES.red;
  }

  if (metric === "r2") {
    if (numeric > 0.8) {
      return BAR_COLOR_CLASSES.green;
    }
    if (numeric >= 0.5) {
      return BAR_COLOR_CLASSES.amber;
    }
    return BAR_COLOR_CLASSES.red;
  }

  return BAR_COLOR_CLASSES.slate;
};

export default getBarColor;