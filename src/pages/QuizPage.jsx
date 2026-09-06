import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import AnswerArea from "../components/quiz/AnswerArea.jsx";
import ConceptGlossary from "../components/quiz/ConceptGlossary.jsx";
import HintSystem from "../components/quiz/HintSystem.jsx";
import QuestionPanel from "../components/quiz/QuestionPanel.jsx";
import QuizHeader from "../components/quiz/QuizHeader.jsx";
import RevealPanel from "../components/quiz/RevealPanel.jsx";
import SessionSummary from "../components/quiz/SessionSummary.jsx";
import QuizHomePage from "./QuizHomePage.jsx";
import ScatterPlot from "../components/shared/ScatterPlot.jsx";
import { useDatasetStore } from "../store/datasetStore";
import { useQuizStore } from "../store/quizStore";

const CLUSTER_COLORS = ["#378ADD", "#EF9F27", "#1D9E75", "#E24B4A", "#7C3AED", "#0EA5E9"];
const STATE_COLORS = {
  current: "#FFFFFF",
  core: "#378ADD",
  border: "#EF9F27",
  noise: "#E24B4A",
  unvisited: "#888780",
  neighbor: "#1D9E75",
  query: "#F97316",
  centroid: "#111827",
  data: "#64748B",
};

/**
 * Hashes a label to deterministic color index.
 * @param {string} label
 * @returns {string}
 */
const labelColor = (label) => {
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) {
    hash = (hash << 5) - hash + label.charCodeAt(i);
    hash |= 0;
  }
  return CLUSTER_COLORS[Math.abs(hash) % CLUSTER_COLORS.length];
};

/**
 * Resolves point color for quiz scatter plots.
 * @param {Record<string, unknown>} point
 * @returns {string}
 */
const quizPointColor = (point) => {
  const state = String(point.state || "");
  if (STATE_COLORS[state]) {
    return STATE_COLORS[state];
  }

  const cluster = point.cluster;
  if (typeof cluster === "number" && Number.isFinite(cluster) && cluster >= 0) {
    return CLUSTER_COLORS[Math.abs(cluster) % CLUSTER_COLORS.length];
  }

  if (typeof point.label === "string" && point.label.trim()) {
    return labelColor(point.label);
  }

  return "#94A3B8";
};

/**
 * Resolves point stroke color for highlighted states.
 * @param {Record<string, unknown>} point
 * @returns {string}
 */
const quizPointStroke = (point) => {
  const state = String(point.state || "");
  if (state === "current") {
    return "#534AB7";
  }
  if (state === "query") {
    return "#F97316";
  }
  return "#FFFFFF";
};

/**
 * Resolves point stroke width by state.
 * @param {Record<string, unknown>} point
 * @returns {number}
 */
const quizPointStrokeWidth = (point) => {
  const state = String(point.state || "");
  if (state === "current" || state === "query") {
    return 2.5;
  }
  return 1;
};

/**
 * Builds scatter points to display for current quiz question.
 * @param {any} question
 * @returns {Array<Record<string, unknown>>}
 */
const resolveQuestionPoints = (question) => {
  if (!question) {
    return [];
  }

  const steps = Array.isArray(question.ground_truth_steps) ? question.ground_truth_steps : [];
  const quizType = Number(question.quiz_type);

  if (quizType === 2) {
    const pausedIndex = Number(question.params_used?.paused_step_index ?? 0);
    const step =
      steps.find((candidate) => Number(candidate.step_index) === pausedIndex) ||
      steps[pausedIndex] ||
      steps[0];
    return Array.isArray(step?.points) ? step.points : question.dataset?.points || [];
  }

  if (quizType === 4 || quizType === 5) {
    const finalStep = steps[steps.length - 1];
    return Array.isArray(finalStep?.points) ? finalStep.points : question.dataset?.points || [];
  }

  return Array.isArray(question.dataset?.points) ? question.dataset.points : [];
};

/**
 * Task 11 quiz page orchestration.
 * @returns {JSX.Element}
 */
export const QuizPage = () => {
  const navigate = useNavigate();
  const setDataset = useDatasetStore((state) => state.setDataset);

  const {
    xp,
    level,
    levelTitle,
    streak,
    badges,
    sessionStats,
    currentQuestion,
    phase,
    difficulty,
    timerSeconds,
    hintsRevealed,
    hintDebt,
    isLoading,
    error,
    lastResult,
    type4Attempts,
    unlockedThisQuestion,
    loadQuestion,
    submitAnswer,
    revealAnswer,
    useHint,
    nextQuestion,
    endSession,
    tickTimer,
    resetSession,
  } = useQuizStore();

  const [draftAnswer, setDraftAnswer] = useState(/** @type {unknown} */ (null));
  const [paramDraft, setParamDraft] = useState({});
  const [isGlossaryOpen, setGlossaryOpen] = useState(false);
  const [activeConcept, setActiveConcept] = useState("");

  useEffect(() => {
    if (currentQuestion?.question_id) {
      setDraftAnswer(null);
      setParamDraft({ ...(currentQuestion.params_used || {}) });
    }
  }, [currentQuestion?.question_id]);

  useEffect(() => {
    if (phase !== "question" || timerSeconds == null) {
      return;
    }
    const timerId = window.setInterval(() => {
      tickTimer();
    }, 1000);
    return () => window.clearInterval(timerId);
  }, [phase, tickTimer, timerSeconds]);

  const questionNumber = useMemo(() => {
    if (!["question", "answered", "revealed", "loading"].includes(phase)) {
      return Math.min(sessionStats.questionsAnswered, 10);
    }
    return Math.min(sessionStats.questionsAnswered + 1, 10);
  }, [phase, sessionStats.questionsAnswered]);

  const displayPoints = useMemo(
    () => resolveQuestionPoints(currentQuestion),
    [currentQuestion]
  );

  const timerLimit = Number(currentQuestion?.time_limit_seconds || 0) || null;

  const startDaily = () => {
    loadQuestion(4, "intermediate", { dailyChallenge: true });
  };

  const startDifficulty = (selectedDifficulty) => {
    loadQuestion(null, selectedDifficulty, { dailyChallenge: false });
  };

  const startByType = (quizType) => {
    const difficultyPool = ["beginner", "intermediate", "advanced"];
    const randomDifficulty =
      difficultyPool[Math.floor(Math.random() * difficultyPool.length)];
    loadQuestion(quizType, randomDifficulty, { dailyChallenge: false });
  };

  const handleSubmitAnswer = async () => {
    await submitAnswer(draftAnswer);
  };

  const handleTryParams = async () => {
    await submitAnswer(paramDraft);
  };

  const handleParamChange = (key, value) => {
    setParamDraft((current) => ({ ...current, [key]: value }));
  };

  const handleWatchAlgorithm = () => {
    if (!currentQuestion) {
      return;
    }

    const points = (currentQuestion.dataset?.points || []).map((point) => ({
      x: Number(point.x),
      y: Number(point.y),
      label: point.label == null ? null : String(point.label),
    }));

    const algorithmRaw = String(currentQuestion.algorithm || "").toLowerCase();
    const algorithmRoute = algorithmRaw === "kmeans" ? "k-means" : algorithmRaw;
    const safeSource = /** @type {"builtin"} */ ("builtin");
    setDataset(points, currentQuestion.dataset?.name || "quiz", safeSource);
    navigate(`/visualize/${algorithmRoute}`);
  };

  const handleTrySimilar = () => {
    if (!currentQuestion) {
      return;
    }
    loadQuestion(Number(currentQuestion.quiz_type), difficulty, {
      algorithm: String(currentQuestion.algorithm || ""),
      dailyChallenge: false,
    });
  };

  if (phase === "summary") {
    return (
      <SessionSummary
        sessionStats={sessionStats}
        xp={xp}
        level={level}
        levelTitle={levelTitle}
        badges={badges}
        onRestart={resetSession}
        onBackToVisualizer={() => navigate("/")}
        onPracticeType={(quizType) => loadQuestion(quizType, "intermediate")}
      />
    );
  }

  if (phase === "home") {
    return (
      <QuizHomePage
        sessionStats={sessionStats}
        onStartDaily={startDaily}
        onStartDifficulty={startDifficulty}
        onStartType={startByType}
        error={error}
      />
    );
  }

  if (phase === "loading" || isLoading) {
    return (
      <section className="flex h-[520px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-600">
        Generating quiz question...
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <QuizHeader
        xp={xp}
        streak={streak}
        questionNumber={questionNumber}
        maxQuestions={10}
        timerSeconds={timerSeconds}
        timerLimit={timerLimit}
        onExit={endSession}
      />

      {error ? (
        <section className="rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </section>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[3fr_2fr]">
        <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">Question Canvas</h2>
          <div className="h-[430px] rounded-xl border border-slate-200 bg-slate-50">
            <ScatterPlot
              points={displayPoints}
              width={820}
              height={430}
              colorFn={quizPointColor}
              pointStrokeFn={quizPointStroke}
              pointStrokeWidthFn={quizPointStrokeWidth}
            />
          </div>
        </section>

        <QuestionPanel
          question={currentQuestion}
          onConceptClick={(concept) => {
            setActiveConcept(concept);
            setGlossaryOpen(true);
          }}
        />
      </div>

      {phase === "question" ? (
        <AnswerArea
          question={currentQuestion}
          selectedAnswer={draftAnswer}
          onSelectAnswer={setDraftAnswer}
          onSubmit={handleSubmitAnswer}
          paramDraft={paramDraft}
          onParamChange={handleParamChange}
          onTryParams={handleTryParams}
          type4Attempts={type4Attempts}
          lastResult={lastResult}
        />
      ) : null}

      {phase === "question" ? (
        <HintSystem
          hintTexts={currentQuestion?.hint_texts || []}
          hintsRevealed={hintsRevealed}
          xp={xp}
          hintDebt={hintDebt}
          onUseHint={useHint}
        />
      ) : null}

      {phase === "answered" || phase === "revealed" ? (
        <RevealPanel
          question={currentQuestion}
          lastResult={lastResult}
          unlockedBadges={unlockedThisQuestion}
          isRevealed={phase === "revealed"}
          onReveal={revealAnswer}
          onNext={nextQuestion}
          onWatchAlgorithm={handleWatchAlgorithm}
          onTrySimilar={handleTrySimilar}
        />
      ) : null}

      <ConceptGlossary
        isOpen={isGlossaryOpen}
        activeConcept={activeConcept}
        onClose={() => setGlossaryOpen(false)}
      />
    </div>
  );
};

export default QuizPage;
