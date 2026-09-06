import { useEffect, useState } from "react";
import { getSampleDatasets } from "../../api/client";
import { getFriendlyApiErrorMessage } from "../../utils/apiErrorMessages";

const DATASET_META = {
  blobs: "Three Gaussian clusters with moderate overlap.",
  moons: "Two crescent-shaped classes with light noise.",
  circles: "Concentric circles for non-linear separation.",
  iris: "Iris dataset using first two numeric features.",
  anisotropic: "Blobs stretched using a linear transform.",
};

const DATASET_ORDER = ["blobs", "moons", "circles", "iris", "anisotropic"];

/**
 * Builds render-ready built-in dataset cards.
 * @param {Record<string, {x: number, y: number, label: string | null}[]>} rawDatasets
 * @returns {{ key: string, name: string, description: string, points: {x: number, y: number, label: string | null}[] }[]}
 */
const toDatasetCards = (rawDatasets) =>
  DATASET_ORDER.map((key) => ({
    key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    description: DATASET_META[key],
    points: rawDatasets[key] ?? [],
  }));

/**
 * Built-in dataset tab content.
 * @param {{ onSelectDataset: (name: string, points: {x: number, y: number, label: string | null}[]) => void }} props
 * @returns {JSX.Element}
 */
export const BuiltInDatasetsTab = ({ onSelectDataset }) => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCancelled = false;

    /**
     * Loads built-in datasets from backend.
     * @returns {Promise<void>}
     */
    const loadDatasets = async () => {
      try {
        const response = await getSampleDatasets();
        if (!isCancelled) {
          setCards(toDatasetCards(response.data));
        }
      } catch (error) {
        if (!isCancelled) {
          console.error("[Datasets] Failed to load sample datasets", error);
          setError(
            getFriendlyApiErrorMessage(
              error,
              "Unable to load sample datasets."
            )
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadDatasets();
    return () => {
      isCancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading sample datasets...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  return (
    <div className="grid gap-2">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          onClick={() => onSelectDataset(card.name, card.points)}
          className="rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-primary"
        >
          <p className="text-sm font-semibold text-slate-900">{card.name}</p>
          <p className="mt-1 text-xs text-slate-600">{card.description}</p>
        </button>
      ))}
    </div>
  );
};

export default BuiltInDatasetsTab;
