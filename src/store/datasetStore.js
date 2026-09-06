import { create } from "zustand";

/**
 * @typedef {{ x: number, y: number, label: string | null }} DatasetPoint
 */

/**
 * @typedef {"builtin" | "upload" | "draw"} DatasetSource
 */

/**
 * @typedef {Object} DatasetState
 * @property {DatasetPoint[]} points
 * @property {string} datasetName
 * @property {DatasetSource} source
 * @property {string} xColumn
 * @property {string} yColumn
 * @property {(points: DatasetPoint[], name: string, source: DatasetSource) => void} setDataset
 * @property {(x: string, y: string) => void} setColumns
 * @property {() => void} clearDataset
 */

/**
 * Creates the dataset store state and actions.
 * @param {(partial: Partial<DatasetState>) => void} set
 * @returns {DatasetState}
 */
const createDatasetStore = (set) => ({
  points: [],
  datasetName: "",
  source: "builtin",
  xColumn: "",
  yColumn: "",
  setDataset: (points, name, source) =>
    set({ points, datasetName: name, source }),
  setColumns: (x, y) => set({ xColumn: x, yColumn: y }),
  clearDataset: () =>
    set({
      points: [],
      datasetName: "",
      source: "builtin",
      xColumn: "",
      yColumn: "",
    }),
});

export const useDatasetStore = create(createDatasetStore);

export default useDatasetStore;
