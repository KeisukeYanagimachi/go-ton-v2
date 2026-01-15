/** 受験中スナップショットを取得するユースケース。 */

import { authorizeCandidateAccess } from "@/features/auth/usecase/authorize-candidate-access";
import { prisma } from "@/shared/db/prisma";

type AttemptModuleSnapshot = {
  moduleId: string;
  code: string;
  name: string;
  position: number;
  durationSeconds: number;
  remainingSeconds: number;
};

type AttemptQuestionOptionSnapshot = {
  id: string;
  position: number;
  optionText: string;
};

type AttemptQuestionSnapshot = {
  id: string;
  stem: string;
  options: AttemptQuestionOptionSnapshot[];
};

type AttemptItemSnapshot = {
  attemptItemId: string;
  moduleId: string;
  position: number;
  points: number;
  selectedOptionId: string | null;
  question: AttemptQuestionSnapshot;
};

type AttemptSnapshot = {
  attemptId: string;
  status: string;
  modules: AttemptModuleSnapshot[];
  items: AttemptItemSnapshot[];
};

const getAttemptSnapshot = async (
  ticketCode: string,
  pin: string,
): Promise<AttemptSnapshot | null> => {
  const candidateAuth = await authorizeCandidateAccess(ticketCode, pin);

  if (!candidateAuth) {
    return null;
  }

  const attempt = await prisma.attempt.findUnique({
    where: { ticketId: candidateAuth.ticketId },
    select: {
      id: true,
      status: true,
      examVersionId: true,
    },
  });

  if (!attempt) {
    return null;
  }

  const [modules, timers, items] = await Promise.all([
    prisma.examVersionModule.findMany({
      where: { examVersionId: attempt.examVersionId },
      select: {
        moduleId: true,
        position: true,
        durationSeconds: true,
        module: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: { position: "asc" },
    }),
    prisma.attemptModuleTimer.findMany({
      where: { attemptId: attempt.id },
      select: {
        moduleId: true,
        remainingSeconds: true,
      },
    }),
    prisma.attemptItem.findMany({
      where: { attemptId: attempt.id },
      select: {
        id: true,
        moduleId: true,
        questionId: true,
        position: true,
        points: true,
      },
    }),
  ]);

  if (modules.length === 0 || items.length === 0) {
    return null;
  }

  const moduleTimerMap = new Map(
    timers.map((timer) => [timer.moduleId, timer.remainingSeconds]),
  );
  const modulePositionMap = new Map(
    modules.map((module) => [module.moduleId, module.position]),
  );

  const questionIds = items.map((item) => item.questionId);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      stem: true,
      options: {
        select: {
          id: true,
          position: true,
          optionText: true,
        },
        orderBy: { position: "asc" },
      },
    },
  });

  const questionMap = new Map(
    questions.map((question) => [question.id, question]),
  );

  const attemptAnswers = await prisma.attemptAnswer.findMany({
    where: { attemptItemId: { in: items.map((item) => item.id) } },
    select: {
      attemptItemId: true,
      selectedOptionId: true,
    },
  });
  const answerMap = new Map(
    attemptAnswers.map((answer) => [
      answer.attemptItemId,
      answer.selectedOptionId,
    ]),
  );

  const sortedItems = [...items].sort((a, b) => {
    const modulePositionA = modulePositionMap.get(a.moduleId) ?? 0;
    const modulePositionB = modulePositionMap.get(b.moduleId) ?? 0;

    if (modulePositionA !== modulePositionB) {
      return modulePositionA - modulePositionB;
    }

    return a.position - b.position;
  });

  const itemSnapshots: AttemptItemSnapshot[] = [];

  for (const item of sortedItems) {
    const question = questionMap.get(item.questionId);

    if (!question) {
      return null;
    }

    itemSnapshots.push({
      attemptItemId: item.id,
      moduleId: item.moduleId,
      position: item.position,
      points: item.points,
      selectedOptionId: answerMap.get(item.id) ?? null,
      question,
    });
  }

  return {
    attemptId: attempt.id,
    status: attempt.status,
    modules: modules.map((module) => ({
      moduleId: module.moduleId,
      code: module.module.code,
      name: module.module.name,
      position: module.position,
      durationSeconds: module.durationSeconds,
      remainingSeconds:
        moduleTimerMap.get(module.moduleId) ?? module.durationSeconds,
    })),
    items: itemSnapshots,
  };
};

export { getAttemptSnapshot };
