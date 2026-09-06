import { Link, NavLink, useLocation } from "react-router-dom";

import { useQuizStore } from "../../store/quizStore";

const pillBase = "rounded-full px-3 py-1.5 text-sm font-medium transition";

/**
 * Builds class names for mode pills.
 * @param {{ isActive: boolean }} navState
 * @returns {string}
 */
const getPillClass = ({ isActive }) =>
  [
    pillBase,
    "border border-transparent",
    isActive ? "bg-primary text-white shadow-sm" : "bg-primary-light text-primary",
  ].join(" ");

/**
 * Top navigation bar with mode switchers.
 * @returns {JSX.Element}
 */
export const Topbar = () => (
  <TopbarContent />
);

/**
 * Topbar content with mode pills and quiz score display.
 * @returns {JSX.Element}
 */
export const TopbarContent = () => {
  const location = useLocation();
  const xp = useQuizStore((state) => state.xp);
  const answered = useQuizStore((state) => state.sessionStats.questionsAnswered);
  const streak = useQuizStore((state) => state.streak);
  const showQuizStats = location.pathname.startsWith("/quiz");

  return (
    <header className="fixed left-0 right-0 top-0 z-20 h-12 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="flex h-full items-center justify-between gap-3 px-4 md:px-6">
        <Link to="/" className="text-lg font-semibold tracking-wide text-primary">
          ML Algorithm Simulator
        </Link>
        <nav className="flex items-center gap-2 overflow-x-auto">
          <NavLink to="/visualize" className={getPillClass}>
            Visualize
          </NavLink>
          <NavLink to="/compare" className={getPillClass}>
            Compare
          </NavLink>
          <NavLink to="/quiz" className={getPillClass}>
            Quiz Mode
          </NavLink>
          <button
            type="button"
            className={`${pillBase} bg-white/70 text-slate-700`}
          >
            My Datasets
          </button>
        </nav>
        <div className="flex items-center gap-3">
          {showQuizStats ? (
            <p className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary">
              XP: {xp} | Answered: {answered} {streak > 1 ? `| ${streak} streak` : ""}
            </p>
          ) : null}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-white">
            S
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
