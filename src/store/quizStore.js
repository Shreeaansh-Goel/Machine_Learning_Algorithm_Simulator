import { create } from "zustand";

import {
	evaluateQuizParams,
	generateQuizQuestion,
	getDailyChallenge,
} from "../api/client";
import {
	calculateEarnedXP,
	getLevelFromXP,
} from "../utils/xpSystem";

const QUIZ_TYPES = [1, 2, 3, 4, 5];
const BEGINNER_TYPES = [1, 3];

const emptyTypeStats = () => ({
	1: { attempted: 0, correct: 0 },
	2: { attempted: 0, correct: 0 },
	3: { attempted: 0, correct: 0 },
	4: { attempted: 0, correct: 0 },
	5: { attempted: 0, correct: 0 },
});

const emptySessionStats = () => ({
	correct: 0,
	wrong: 0,
	hintsUsed: 0,
	xpEarned: 0,
	questionsAnswered: 0,
	bestStreak: 0,
	startedAt: Date.now(),
	typeStats: emptyTypeStats(),
	correctByAlgorithm: {
		dbscan: 0,
		kmeans: 0,
		"decision-tree": 0,
		other: 0,
	},
	type4Perfect: 0,
	hintFreeCorrectStreak: 0,
	advancedFastCorrect: 0,
	dailyChallengeWins: 0,
});

/**
 * Resolves random quiz type with optional difficulty constraints.
 * @param {"beginner" | "intermediate" | "advanced"} difficulty
 * @returns {number}
 */
const pickRandomType = (difficulty) => {
	const pool = difficulty === "beginner" ? BEGINNER_TYPES : QUIZ_TYPES;
	return pool[Math.floor(Math.random() * pool.length)];
};

/**
 * Resolves whether submitted answer is correct for a non-type4 question.
 * @param {number} quizType
 * @param {unknown} submitted
 * @param {unknown} expected
 * @returns {boolean}
 */
const isAnswerCorrect = (quizType, submitted, expected) => {
	if (quizType === 1) {
		return Number(submitted) === Number(expected);
	}
	if (quizType === 3) {
		return String(submitted ?? "").trim().toLowerCase() ===
			String(expected ?? "").trim().toLowerCase();
	}
	return Number(submitted) === Number(expected);
};

/**
 * Builds latest level fields from XP total.
 * @param {number} xp
 * @returns {{ level: number, levelTitle: string }}
 */
const getLevelFields = (xp) => {
	const levelMeta = getLevelFromXP(xp);
	return {
		level: levelMeta.level,
		levelTitle: levelMeta.title,
	};
};

/**
 * Computes new badge list from current stats snapshot.
 * @param {import("./quizStore").QuizStateLike} state
 * @returns {string[]}
 */
const computeBadges = (state) => {
	const badgeSet = new Set(state.badges);
	const stats = state.sessionStats;

	if (stats.correct >= 1) {
		badgeSet.add("first_cluster");
	}
	if (state.streak >= 3) {
		badgeSet.add("on_a_roll");
	}
	if (state.streak >= 5) {
		badgeSet.add("hot_streak");
	}
	if (stats.correctByAlgorithm.dbscan >= 10) {
		badgeSet.add("dbscan_master");
	}
	if ((stats.typeStats[3]?.correct ?? 0) >= 5) {
		badgeSet.add("algorithm_selector");
	}
	if (stats.type4Perfect >= 3) {
		badgeSet.add("param_whisperer");
	}
	if ((stats.typeStats[5]?.correct ?? 0) >= 10) {
		badgeSet.add("metric_reader");
	}
	if (stats.hintFreeCorrectStreak >= 5) {
		badgeSet.add("hint_free");
	}
	if (stats.advancedFastCorrect >= 3) {
		badgeSet.add("speed_demon");
	}
	if (stats.dailyChallengeWins >= 3) {
		badgeSet.add("daily_warrior");
	}

	return Array.from(badgeSet.values());
};

const initialState = {
	xp: 0,
	level: 1,
	levelTitle: "Data Novice",
	streak: 0,
	badges: [],
	sessionStats: emptySessionStats(),
	currentQuestion: null,
	phase: "home",
	difficulty: "beginner",
	selectedQuizType: null,
	timerSeconds: null,
	hintsRevealed: 0,
	hintDebt: 0,
	selectedAnswer: null,
	isLoading: false,
	error: "",
	lastResult: null,
	type4Attempts: 0,
	pendingParams: {},
	unlockedThisQuestion: [],
	questionStartedAt: null,
	isDailyChallenge: false,
};

/**
 * @typedef {{
 *  xp: number,
 *  level: number,
 *  levelTitle: string,
 *  streak: number,
 *  badges: string[],
 *  sessionStats: ReturnType<typeof emptySessionStats>,
 *  currentQuestion: any,
 *  phase: "home"|"loading"|"question"|"answered"|"revealed"|"summary",
 *  difficulty: "beginner"|"intermediate"|"advanced",
 *  selectedQuizType: number | null,
 *  timerSeconds: number | null,
 *  hintsRevealed: number,
 *  hintDebt: number,
 *  selectedAnswer: unknown,
 *  isLoading: boolean,
 *  error: string,
 *  lastResult: any,
 *  type4Attempts: number,
 *  pendingParams: Record<string, unknown>,
 *  unlockedThisQuestion: string[],
 *  questionStartedAt: number | null,
 *  isDailyChallenge: boolean,
 * }} QuizStateLike
 */

export const useQuizStore = create((set, get) => ({
	...initialState,

	/**
	 * Loads a new quiz question from backend.
	 * @param {number | null} type
	 * @param {"beginner"|"intermediate"|"advanced"} difficulty
	 * @param {{ algorithm?: string | null, dailyChallenge?: boolean }} [options]
	 * @returns {Promise<void>}
	 */
	loadQuestion: async (type, difficulty, options = {}) => {
		const { algorithm = null, dailyChallenge = false } = options;
		const resolvedType = type ?? pickRandomType(difficulty);

		set({
			phase: "loading",
			isLoading: true,
			error: "",
			selectedQuizType: type,
			difficulty,
			currentQuestion: null,
			selectedAnswer: null,
			hintsRevealed: 0,
			type4Attempts: 0,
			lastResult: null,
			unlockedThisQuestion: [],
			isDailyChallenge: dailyChallenge,
		});

		try {
			const response = dailyChallenge
				? await getDailyChallenge()
				: await generateQuizQuestion({
						quiz_type: resolvedType,
						difficulty,
						algorithm,
					});
			const question = response.data;

			set({
				currentQuestion: question,
				selectedQuizType: type,
				phase: "question",
				isLoading: false,
				timerSeconds:
					difficulty === "advanced"
						? Number(question.time_limit_seconds ?? 60)
						: null,
				hintsRevealed: 0,
				selectedAnswer: null,
				type4Attempts: 0,
				pendingParams: { ...(question.params_used || {}) },
				questionStartedAt: Date.now(),
				isDailyChallenge: Boolean(question.params_used?.daily_challenge || dailyChallenge),
			});
		} catch (error) {
			console.error("[Quiz] loadQuestion failed", error);
			set({
				isLoading: false,
				phase: "home",
				error: "Unable to load quiz question. Please check backend and retry.",
			});
		}
	},

	/**
	 * Submits answer for current question.
	 * @param {unknown} answer
	 * @returns {Promise<void>}
	 */
	submitAnswer: async (answer) => {
		const state = get();
		const question = state.currentQuestion;
		if (!question) {
			return;
		}

		if (question.quiz_type === 4) {
			const attempts = state.type4Attempts + 1;
			try {
				const response = await evaluateQuizParams({
					question_id: question.question_id,
					student_params: answer || {},
					dataset: question.dataset,
				});
				const evaluation = response.data;
				const isPerfect = Number(evaluation.score_pct) >= 100;
				const shouldFinalize = isPerfect || attempts >= 5;

				if (!shouldFinalize) {
					set({
						type4Attempts: attempts,
						selectedAnswer: answer,
						lastResult: {
							isCorrect: false,
							isPartial: true,
							scorePct: Number(evaluation.score_pct),
							evaluation,
						},
					});
					return;
				}

				const earnedXp = Math.round(
					Number(question.xp_reward || 50) * (Number(evaluation.score_pct) / 100)
				);
				const previousStreak = state.streak;
				const nextStreak = isPerfect ? previousStreak + 1 : 0;
				const nextXp = Math.max(0, state.xp + earnedXp);
				const levelFields = getLevelFields(nextXp);
				const isFastAdvanced =
					state.difficulty === "advanced" &&
					state.questionStartedAt != null &&
					Date.now() - state.questionStartedAt <= 25_000;

				const typeStats = {
					...state.sessionStats.typeStats,
					4: {
						attempted: (state.sessionStats.typeStats[4]?.attempted || 0) + 1,
						correct:
							(state.sessionStats.typeStats[4]?.correct || 0) + (isPerfect ? 1 : 0),
					},
				};

				const nextStats = {
					...state.sessionStats,
					questionsAnswered: state.sessionStats.questionsAnswered + 1,
					correct: state.sessionStats.correct + (isPerfect ? 1 : 0),
					wrong: state.sessionStats.wrong + (isPerfect ? 0 : 1),
					xpEarned: state.sessionStats.xpEarned + earnedXp,
					bestStreak: Math.max(state.sessionStats.bestStreak, nextStreak),
					typeStats,
					type4Perfect: state.sessionStats.type4Perfect + (isPerfect ? 1 : 0),
					hintFreeCorrectStreak:
						state.hintsRevealed === 0 && isPerfect
							? state.sessionStats.hintFreeCorrectStreak + 1
							: 0,
					advancedFastCorrect:
						state.sessionStats.advancedFastCorrect +
						(isPerfect && isFastAdvanced ? 1 : 0),
					dailyChallengeWins:
						state.sessionStats.dailyChallengeWins +
						(isPerfect && state.isDailyChallenge ? 1 : 0),
				};

				const nextState = {
					...state,
					xp: nextXp,
					...levelFields,
					streak: nextStreak,
					sessionStats: nextStats,
				};
				const allBadges = computeBadges(nextState);
				const unlocked = allBadges.filter((badge) => !state.badges.includes(badge));

				set({
					xp: nextXp,
					...levelFields,
					streak: nextStreak,
					sessionStats: nextStats,
					badges: allBadges,
					unlockedThisQuestion: unlocked,
					type4Attempts: attempts,
					selectedAnswer: answer,
					phase: "answered",
					lastResult: {
						isCorrect: isPerfect,
						isPartial: !isPerfect,
						scorePct: Number(evaluation.score_pct),
						earnedXp,
						evaluation,
					},
					timerSeconds: null,
				});
				return;
			} catch (error) {
				console.error("[Quiz] evaluate params failed", error);
				set({
					error: "Could not evaluate parameters. Try again.",
				});
				return;
			}
		}

		const quizType = Number(question.quiz_type);
		const correct = isAnswerCorrect(quizType, answer, question.correct_answer);
		const previousStreak = state.streak;
		const nextStreak = correct ? previousStreak + 1 : 0;
		const earnedXp = correct
			? calculateEarnedXP({
					baseXp: Number(question.xp_reward || 0),
					hintsUsed: state.hintsRevealed,
					streak: nextStreak,
					isDailyChallenge: state.isDailyChallenge,
				})
			: 0;

		const nextXp = Math.max(0, state.xp + earnedXp);
		const levelFields = getLevelFields(nextXp);
		const algorithmKey = ["dbscan", "kmeans", "decision-tree"].includes(
			String(question.algorithm)
		)
			? String(question.algorithm)
			: "other";
		const isFastAdvanced =
			state.difficulty === "advanced" &&
			state.questionStartedAt != null &&
			Date.now() - state.questionStartedAt <= 25_000;

		const typeStats = {
			...state.sessionStats.typeStats,
			[quizType]: {
				attempted: (state.sessionStats.typeStats[quizType]?.attempted || 0) + 1,
				correct:
					(state.sessionStats.typeStats[quizType]?.correct || 0) + (correct ? 1 : 0),
			},
		};

		const nextStats = {
			...state.sessionStats,
			questionsAnswered: state.sessionStats.questionsAnswered + 1,
			correct: state.sessionStats.correct + (correct ? 1 : 0),
			wrong: state.sessionStats.wrong + (correct ? 0 : 1),
			xpEarned: state.sessionStats.xpEarned + earnedXp,
			bestStreak: Math.max(state.sessionStats.bestStreak, nextStreak),
			typeStats,
			correctByAlgorithm: {
				...state.sessionStats.correctByAlgorithm,
				[algorithmKey]:
					(state.sessionStats.correctByAlgorithm[algorithmKey] || 0) +
					(correct ? 1 : 0),
			},
			hintFreeCorrectStreak:
				state.hintsRevealed === 0 && correct
					? state.sessionStats.hintFreeCorrectStreak + 1
					: 0,
			advancedFastCorrect:
				state.sessionStats.advancedFastCorrect + (correct && isFastAdvanced ? 1 : 0),
			dailyChallengeWins:
				state.sessionStats.dailyChallengeWins + (correct && state.isDailyChallenge ? 1 : 0),
		};

		const nextState = {
			...state,
			xp: nextXp,
			...levelFields,
			streak: nextStreak,
			sessionStats: nextStats,
		};
		const allBadges = computeBadges(nextState);
		const unlocked = allBadges.filter((badge) => !state.badges.includes(badge));

		set({
			xp: nextXp,
			...levelFields,
			streak: nextStreak,
			sessionStats: nextStats,
			badges: allBadges,
			unlockedThisQuestion: unlocked,
			selectedAnswer: answer,
			phase: "answered",
			timerSeconds: null,
			lastResult: {
				isCorrect: correct,
				earnedXp,
				expected: question.correct_answer,
				submitted: answer,
			},
		});
	},

	/**
	 * Moves answer phase into revealed phase.
	 */
	revealAnswer: () => {
		if (get().phase !== "answered") {
			return;
		}
		set({ phase: "revealed" });
	},

	/**
	 * Uses one hint and applies hint XP cost.
	 */
	useHint: () => {
		const state = get();
		if (!state.currentQuestion || state.hintsRevealed >= 3 || state.phase !== "question") {
			return;
		}

		const hintCost = 5;
		const nextHints = state.hintsRevealed + 1;
		const nextXpRaw = state.xp - hintCost;
		const nextXp = Math.max(0, nextXpRaw);
		const nextDebt = state.hintDebt + (nextXpRaw < 0 ? Math.abs(nextXpRaw) : 0);
		const levelFields = getLevelFields(nextXp);

		set({
			hintsRevealed: nextHints,
			xp: nextXp,
			...levelFields,
			hintDebt: nextDebt,
			sessionStats: {
				...state.sessionStats,
				hintsUsed: state.sessionStats.hintsUsed + 1,
			},
		});
	},

	/**
	 * Adds XP and updates level fields.
	 * @param {number} amount
	 */
	addXP: (amount) => {
		const nextXp = Math.max(0, get().xp + Number(amount || 0));
		set({
			xp: nextXp,
			...getLevelFields(nextXp),
		});
	},

	/**
	 * Recomputes badges from current state.
	 */
	checkBadges: () => {
		const state = get();
		const nextBadges = computeBadges(state);
		const unlocked = nextBadges.filter((badge) => !state.badges.includes(badge));
		set({ badges: nextBadges, unlockedThisQuestion: unlocked });
	},

	/**
	 * Advances to next question or ends session at 10 answered questions.
	 * @returns {Promise<void>}
	 */
	nextQuestion: async () => {
		const state = get();
		if (state.sessionStats.questionsAnswered >= 10) {
			set({ phase: "summary", timerSeconds: null, currentQuestion: null });
			return;
		}
		await get().loadQuestion(state.selectedQuizType, state.difficulty, {
			dailyChallenge: false,
		});
	},

	/**
	 * Ends active quiz session and shows summary state.
	 */
	endSession: () => {
		set({
			phase: "summary",
			timerSeconds: null,
			currentQuestion: null,
			selectedAnswer: null,
			isLoading: false,
		});
	},

	/**
	 * Decrements timer and auto-submits timeout as incorrect when elapsed.
	 * @returns {Promise<void>}
	 */
	tickTimer: async () => {
		const state = get();
		if (state.phase !== "question" || state.timerSeconds == null) {
			return;
		}
		if (state.timerSeconds <= 1) {
			set({ timerSeconds: 0 });
			await get().submitAnswer(null);
			return;
		}
		set({ timerSeconds: state.timerSeconds - 1 });
	},

	/**
	 * Resets session progress and returns to quiz home state.
	 */
	resetSession: () => {
		set({
			...initialState,
			sessionStats: emptySessionStats(),
		});
	},
}));

export default useQuizStore;
