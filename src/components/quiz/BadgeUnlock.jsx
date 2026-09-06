import { getBadgeById } from "../../utils/xpSystem";

/**
 * Renders a simple badge unlock chip with glow animation.
 * @param {{ badgeId: string }} props
 * @returns {JSX.Element}
 */
export const BadgeUnlock = ({ badgeId }) => {
  const badge = getBadgeById(badgeId);

  return (
    <div className="animate-fade-in rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm shadow-sm">
      <p className="font-semibold text-amber-800">Badge Unlocked</p>
      <p className="text-amber-700">{badge.label}</p>
    </div>
  );
};

export default BadgeUnlock;
