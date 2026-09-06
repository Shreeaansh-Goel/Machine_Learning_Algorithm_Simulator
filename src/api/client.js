import axios from "axios";

const DEFAULT_API_BASE_URL = "http://127.0.0.1:8000";
const LEGACY_INVALID_BASE_URL = "http://localhost:127.0.0.1:8000";

/**
 * Resolves a valid backend base URL from env config.
 * @returns {string}
 */
const resolveApiBaseUrl = () => {
  const envBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const candidate = envBaseUrl || DEFAULT_API_BASE_URL;

  if (candidate === LEGACY_INVALID_BASE_URL) {
    return DEFAULT_API_BASE_URL;
  }

  try {
    return new URL(candidate).origin;
  } catch {
    return DEFAULT_API_BASE_URL;
  }
};

export const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 10000,
});

apiClient.interceptors.request.use(
  /**
   * Logs outgoing request URL before sending.
   * @param {import("axios").InternalAxiosRequestConfig} config
   * @returns {import("axios").InternalAxiosRequestConfig}
   */
  (config) => {
    const requestUrl = `${config.baseURL ?? ""}${config.url ?? ""}`;
    console.log(`[API Request] ${requestUrl}`);
    return config;
  },
  /**
   * Passes request errors through to callers.
   * @param {unknown} error
   * @returns {Promise<never>}
   */
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  /**
   * Returns successful responses unchanged.
   * @param {import("axios").AxiosResponse} response
   * @returns {import("axios").AxiosResponse}
   */
  (response) => response,
  /**
   * Logs response errors and re-throws them.
   * @param {unknown} error
   * @returns {Promise<never>}
   */
  (error) => {
    console.error("[API Error]", error);
    return Promise.reject(error);
  }
);

/**
 * Runs an ML algorithm endpoint.
 * @param {string} name
 * @param {Array<Record<string, unknown>>} data
 * @param {Record<string, unknown>} params
 * @param {Record<string, unknown>} [extraPayload]
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const runAlgorithm = (name, data, params, extraPayload = {}) =>
  apiClient.post(`/api/run/${name}`, { points: data, params, ...extraPayload });

/**
 * Fetches built-in sample datasets from backend.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const getSampleDatasets = () => apiClient.get("/api/datasets/sample");

/**
 * Fetches backend health status.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const getHealth = () => apiClient.get("/health");

/**
 * Requests a generated quiz question.
 * @param {{ quiz_type: number, difficulty: "beginner" | "intermediate" | "advanced", algorithm?: string | null }} payload
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const generateQuizQuestion = (payload) =>
  apiClient.post("/api/quiz/generate", payload);

/**
 * Evaluates parameter tuning attempt for type-4 quiz questions.
 * @param {{ question_id: string, student_params: Record<string, unknown>, dataset?: { points: Array<{x: number, y: number, label?: string | null}>, name: string } }} payload
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const evaluateQuizParams = (payload) =>
  apiClient.post("/api/quiz/evaluate-params", payload);

/**
 * Fetches today's deterministic daily challenge question.
 * @returns {Promise<import("axios").AxiosResponse>}
 */
export const getDailyChallenge = () => apiClient.get("/api/quiz/daily-challenge");

export default apiClient;
