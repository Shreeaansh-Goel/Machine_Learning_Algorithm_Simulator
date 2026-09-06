const EXPLANATIONS = {
  dbscan: {
    check_point:
      "DBSCAN processes points one at a time in arbitrary order. The order doesn't affect the final result - only epsilon and MinPts determine cluster membership.",
    count_neighbors:
      "The epsilon neighborhood is the core concept of DBSCAN. Unlike K-Means which assumes spherical clusters, this neighborhood can detect clusters of any shape.",
    core_point:
      "Core points are the anchors of DBSCAN clusters. Every cluster must have at least one core point. This is what makes DBSCAN robust to noise - isolated points can never form a cluster.",
    border_point:
      "Border points extend the cluster's edge but are not strong enough to start one. If this point's neighborhood had >= MinPts points, it would be a core point instead.",
    noise_point:
      "Noise points are DBSCAN's superpower. K-Means would force every point into a cluster. DBSCAN honestly admits: this point doesn't belong anywhere.",
    expand_cluster:
      "Cluster expansion is recursive - a core point's neighbors are added, and if any of them are also core points, their neighbors are added too. This is how DBSCAN finds arbitrarily shaped clusters.",
    done: "DBSCAN has fully traversed density-reachable regions, so cluster memberships are now stable under the chosen epsilon and MinPts values.",
  },
  kmeans: {
    init: "Centroid initialization matters. Random initialization can lead to poor results (a problem called bad initialization). K-Means++ (the smarter init) places centroids far apart to improve convergence.",
    assign:
      "This is the E step in EM algorithm terms. Each point is assigned to its nearest centroid using Euclidean distance. This makes K-Means sensitive to scale - always normalize your features!",
    update:
      "This is the M step. The centroid moves to the mean of all its assigned points. K-Means is named for this - K clusters, each defined by its Mean.",
    converged:
      "Convergence means no point changed its cluster assignment. K-Means always converges, but may converge to a local minimum - that's why running it multiple times with different initializations is best practice.",
  },
  "decision-tree": {
    split:
      "Each split chooses a threshold that reduces impurity the most, so the tree progressively separates classes with simpler local rules.",
    leaf: "A leaf is a terminal rule: samples reaching this node are assigned to the majority class stored here.",
    done: "The full tree now represents a sequence of if-then decisions that maps feature regions to predicted classes.",
  },
  knn: {
    compute_distances:
      "KNN is a lazy learner: it stores all training points and does the heavy work only at prediction time by measuring distances to the query.",
    sort_distances:
      "Sorting makes nearest-neighbor selection deterministic and easy to inspect. Only relative distance rank matters for KNN voting.",
    select_k:
      "The value of k controls bias-variance tradeoff: small k is sensitive to noise, larger k smooths decision boundaries.",
    predict:
      "Prediction is majority vote among selected neighbors. Confidence comes from how dominant the winning class is within that local neighborhood.",
  },
  "linear-regression": {
    init:
      "Gradient descent starts from an initial line. Different starts can change optimization path, but convex MSE leads to the same global minimum.",
    gradient_step:
      "Each gradient step moves weight and bias opposite the loss gradient, reducing prediction error over repeated updates.",
    converged:
      "Final parameters minimize squared error for this feature-target view. The line now represents the best linear trend under MSE.",
  },
  pca: {
    compute_covariance:
      "Covariance tells us how feature pairs vary together. PCA starts here because principal directions are defined by this variance structure.",
    compute_eigenvectors:
      "Eigenvectors of the covariance matrix are the principal component directions. Their eigenvalues tell us how much variance each direction explains.",
    project:
      "Projection maps each sample onto the principal directions. This keeps the most informative variation while reducing dimensionality.",
    done: "The PCA projection is complete. PC1 and PC2 now provide a compact 2D view of the original feature space.",
  },
  svm: {
    fit: "SVM learns a separating surface that maximizes margin between classes while balancing errors with the regularization parameter C.",
    show_margin:
      "Margin lines indicate confidence around the decision boundary. Wider margins usually improve generalization on unseen data.",
    show_support_vectors:
      "Support vectors are the critical points nearest the boundary. Moving them would change the classifier; most other points do not directly affect it.",
  },
};

const DEFAULT_WHY_TEXT =
  "This step changes the model state in a way that influences all later decisions and the final prediction quality.";

/**
 * Normalizes route or internal algorithm names to explanation keys.
 * @param {string | null | undefined} algorithm
 * @returns {string}
 */
const normalizeAlgorithm = (algorithm) => {
  const value = String(algorithm ?? "").toLowerCase();
  if (value === "k-means") {
    return "kmeans";
  }
  if (value === "decision-tree") {
    return "decision-tree";
  }
  return value;
};

/**
 * Returns educational context for a given algorithm step.
 * @param {string | null | undefined} algorithm
 * @param {string | null | undefined} stepType
 * @returns {string}
 */
export const getWhyThisMatters = (algorithm, stepType) => {
  if (!stepType) {
    return DEFAULT_WHY_TEXT;
  }

  const algorithmKey = normalizeAlgorithm(algorithm);
  return EXPLANATIONS[algorithmKey]?.[stepType] || DEFAULT_WHY_TEXT;
};

export default EXPLANATIONS;