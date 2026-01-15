/** 採点結果を確定するユースケース。 */

import { Prisma } from "@prisma/client";

type ScoreAttemptResult =
  | { ok: true }
  | {
      ok: false;
      error: "ATTEMPT_NOT_FOUND" | "INVALID_STATE" | "ALREADY_SCORED";
    };

const scoreAttempt = async (
  tx: Prisma.TransactionClient,
  attemptId: string,
): Promise<ScoreAttemptResult> => {
  const attempt = await tx.attempt.findUnique({
    where: { id: attemptId },
    select: { id: true, status: true },
  });

  if (!attempt) {
    return { ok: false, error: "ATTEMPT_NOT_FOUND" };
  }

  if (attempt.status === "SCORED") {
    return { ok: false, error: "ALREADY_SCORED" };
  }

  if (attempt.status !== "SUBMITTED") {
    return { ok: false, error: "INVALID_STATE" };
  }

  const items = await tx.attemptItem.findMany({
    where: { attemptId },
    select: {
      id: true,
      sectionId: true,
      points: true,
      questionId: true,
    },
  });

  if (items.length === 0) {
    return { ok: false, error: "INVALID_STATE" };
  }

  const existingScores = await tx.attemptAnswerScore.findMany({
    where: { attemptItemId: { in: items.map((item) => item.id) } },
    select: { attemptItemId: true },
  });

  if (existingScores.length > 0) {
    return { ok: false, error: "ALREADY_SCORED" };
  }

  const answers = await tx.attemptAnswer.findMany({
    where: { attemptItemId: { in: items.map((item) => item.id) } },
    select: { attemptItemId: true, selectedOptionId: true },
  });
  const answerMap = new Map(
    answers.map((answer) => [answer.attemptItemId, answer.selectedOptionId]),
  );

  const questionIds = items.map((item) => item.questionId);
  const options = await tx.questionOption.findMany({
    where: { questionId: { in: questionIds } },
    select: { id: true, questionId: true, isCorrect: true },
  });
  const correctOptionByQuestion = new Map<string, string>();
  options.forEach((option) => {
    if (option.isCorrect) {
      correctOptionByQuestion.set(option.questionId, option.id);
    }
  });

  const answerScores = items.map((item) => {
    const selectedOptionId = answerMap.get(item.id) ?? null;
    const correctOptionId = correctOptionByQuestion.get(item.questionId) ?? null;
    const isCorrect = Boolean(
      selectedOptionId && correctOptionId && selectedOptionId === correctOptionId,
    );
    return {
      attemptItemId: item.id,
      isCorrect,
      pointsAwarded: isCorrect ? item.points : 0,
    };
  });

  await tx.attemptAnswerScore.createMany({
    data: answerScores.map((score) => ({
      attemptItemId: score.attemptItemId,
      isCorrect: score.isCorrect,
      pointsAwarded: score.pointsAwarded,
    })),
  });

  const sectionScoreMap = new Map<
    string,
    { rawScore: number; maxScore: number }
  >();
  answerScores.forEach((score, index) => {
    const sectionId = items[index].sectionId;
    const current = sectionScoreMap.get(sectionId) ?? { rawScore: 0, maxScore: 0 };
    current.rawScore += score.pointsAwarded;
    current.maxScore += items[index].points;
    sectionScoreMap.set(sectionId, current);
  });

  await tx.attemptSectionScore.createMany({
    data: Array.from(sectionScoreMap.entries()).map(([sectionId, totals]) => ({
      attemptId,
      sectionId,
      rawScore: totals.rawScore,
      maxScore: totals.maxScore,
    })),
  });

  const totalScore = Array.from(sectionScoreMap.values()).reduce(
    (acc, totals) => ({
      rawScore: acc.rawScore + totals.rawScore,
      maxScore: acc.maxScore + totals.maxScore,
    }),
    { rawScore: 0, maxScore: 0 },
  );

  await tx.attemptScore.create({
    data: {
      attemptId,
      rawScore: totalScore.rawScore,
      maxScore: totalScore.maxScore,
    },
  });

  await tx.attempt.update({
    where: { id: attemptId },
    data: { status: "SCORED" },
  });

  return { ok: true };
};

export { scoreAttempt };
export type { ScoreAttemptResult };

