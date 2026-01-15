/** 受験中スナップショットを取得するユースケース。 */

import { authorizeCandidateAccess } from "@/features/auth/usecase/authorize-candidate-access";
import { prisma } from "@/shared/db/prisma";

type AttemptSectionSnapshot = {
  sectionId: string;
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
  sectionId: string;
  position: number;
  points: number;
  selectedOptionId: string | null;
  question: AttemptQuestionSnapshot;
};

type AttemptSnapshot = {
  attemptId: string;
  status: string;
  sections: AttemptSectionSnapshot[];
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

  const [sections, timers, items] = await Promise.all([
    prisma.examVersionSection.findMany({
      where: { examVersionId: attempt.examVersionId },
      select: {
        sectionId: true,
        position: true,
        durationSeconds: true,
        section: {
          select: {
            code: true,
            name: true,
          },
        },
      },
      orderBy: { position: "asc" },
    }),
    prisma.attemptSectionTimer.findMany({
      where: { attemptId: attempt.id },
      select: {
        sectionId: true,
        remainingSeconds: true,
      },
    }),
    prisma.attemptItem.findMany({
      where: { attemptId: attempt.id },
      select: {
        id: true,
        sectionId: true,
        questionId: true,
        position: true,
        points: true,
      },
    }),
  ]);

  if (sections.length === 0 || items.length === 0) {
    return null;
  }

  const sectionTimerMap = new Map(
    timers.map((timer) => [timer.sectionId, timer.remainingSeconds]),
  );
  const sectionPositionMap = new Map(
    sections.map((section) => [section.sectionId, section.position]),
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
    const sectionPositionA = sectionPositionMap.get(a.sectionId) ?? 0;
    const sectionPositionB = sectionPositionMap.get(b.sectionId) ?? 0;

    if (sectionPositionA !== sectionPositionB) {
      return sectionPositionA - sectionPositionB;
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
      sectionId: item.sectionId,
      position: item.position,
      points: item.points,
      selectedOptionId: answerMap.get(item.id) ?? null,
      question,
    });
  }

  return {
    attemptId: attempt.id,
    status: attempt.status,
    sections: sections.map((section) => ({
      sectionId: section.sectionId,
      code: section.section.code,
      name: section.section.name,
      position: section.position,
      durationSeconds: section.durationSeconds,
      remainingSeconds:
        sectionTimerMap.get(section.sectionId) ?? section.durationSeconds,
    })),
    items: itemSnapshots,
  };
};

export { getAttemptSnapshot };
