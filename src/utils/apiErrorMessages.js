import axios from "axios";

export const TIMEOUT_ERROR_MESSAGE =
  "Computation taking too long - try reducing dataset size.";

export const BACKEND_UNREACHABLE_MESSAGE =
  "Backend server not running - start with: uvicorn app.main:app --reload";

/**
 * Resolves user-facing API error messages for network, timeout, and backend errors.
 * @param {unknown} error
 * @param {string} fallback
 * @returns {string}
 */
export const getFriendlyApiErrorMessage = (error, fallback) => {
  if (axios.isAxiosError(error)) {
    const message = String(error.message || "").toLowerCase();

    if (error.code === "ECONNABORTED" || message.includes("timeout")) {
      return TIMEOUT_ERROR_MESSAGE;
    }

    if (!error.response || error.code === "ERR_NETWORK") {
      return BACKEND_UNREACHABLE_MESSAGE;
    }

    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail.trim() !== "") {
      return detail;
    }
  }

  return fallback;
};

export default {
  BACKEND_UNREACHABLE_MESSAGE,
  TIMEOUT_ERROR_MESSAGE,
  getFriendlyApiErrorMessage,
};
