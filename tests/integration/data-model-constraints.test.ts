import { Prisma } from "@prisma/client";
import { randomUUID } from "crypto";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { disconnect, prisma } from "./helpers/prisma";

const ensureStaffRole = async () =>
  prisma.staffRole.upsert({
    where: { code: "ADMIN" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      code: "ADMIN",
      name: "Administrator",
    },
  });

const ensureExamModules = async () =>
  Promise.all([
    prisma.examModule.upsert({
      where: { code: "VERBAL" },
      update: {},
      create: {
        id: "20000000-0000-0000-0000-000000000001",
        code: "VERBAL",
        name: "Verbal",
      },
    }),
    prisma.examModule.upsert({
      where: { code: "NONVERBAL" },
      update: {},
      create: {
        id: "20000000-0000-0000-0000-000000000002",
        code: "NONVERBAL",
        name: "Nonverbal",
      },
    }),
  ]);

const createCandidate = async () =>
  prisma.candidate.create({
    data: {
      id: randomUUID(),
      fullName: `Candidate ${randomUUID()}`,
      birthDate: new Date("1999-01-01"),
    },
  });

const createVisitSlot = async () =>
  prisma.visitSlot.create({
    data: {
      id: randomUUID(),
      startsAt: new Date("2030-01-01T09:00:00Z"),
      endsAt: new Date("2030-01-01T12:00:00Z"),
      capacity: 10,
    },
  });

const createExam = async () =>
  prisma.exam.create({
    data: {
      id: randomUUID(),
      name: `Exam ${randomUUID()}`,
      description: "Integration test exam",
    },
  });

const createExamVersion = async (examId: string, versionNumber = 1) =>
  prisma.examVersion.create({
    data: {
      id: randomUUID(),
      examId,
      versionNumber,
      status: "DRAFT",
    },
  });

const createQuestion = async () =>
  prisma.question.create({
    data: {
      id: randomUUID(),
      stem: `Question ${randomUUID()}`,
      explanation: "Integration test question",
      isActive: true,
    },
  });

const createQuestionOption = async (questionId: string, position: number) =>
  prisma.questionOption.create({
    data: {
      id: randomUUID(),
      questionId,
      optionText: `Option ${randomUUID()}`,
      isCorrect: position === 1,
      position,
    },
  });

const expectUniqueViolation = async (promise: Promise<unknown>) => {
  await expect(
    promise,
  ).rejects.toMatchObject<Prisma.PrismaClientKnownRequestError>({
    code: "P2002",
  });
};

const expectForeignKeyViolation = async (promise: Promise<unknown>) => {
  await expect(
    promise,
  ).rejects.toMatchObject<Prisma.PrismaClientKnownRequestError>({
    code: "P2003",
  });
};

describe("data model constraints (integration)", () => {
  beforeAll(async () => {
    await ensureStaffRole();
    await ensureExamModules();
  });

  afterAll(async () => {
    await disconnect();
  });

  test("staff_users.email is unique", async () => {
    const email = `unique-${randomUUID()}@example.com`;
    await prisma.staffUser.create({
      data: {
        id: randomUUID(),
        email,
        displayName: "Tester",
        isActive: true,
      },
    });

    await expectUniqueViolation(
      prisma.staffUser.create({
        data: {
          id: randomUUID(),
          email,
          displayName: "Tester Duplicate",
          isActive: true,
        },
      }),
    );
  });

  test("staff_user_roles enforces composite uniqueness", async () => {
    const staffRole = await prisma.staffRole.findUniqueOrThrow({
      where: { code: "ADMIN" },
    });
    const staffUser = await prisma.staffUser.create({
      data: {
        id: randomUUID(),
        email: `role-${randomUUID()}@example.com`,
        displayName: "Role Tester",
        isActive: true,
      },
    });

    await prisma.staffUserRole.create({
      data: {
        staffUserId: staffUser.id,
        staffRoleId: staffRole.id,
      },
    });

    await expectUniqueViolation(
      prisma.staffUserRole.create({
        data: {
          staffUserId: staffUser.id,
          staffRoleId: staffRole.id,
        },
      }),
    );
  });

  test("candidate_slot_assignments requires valid foreign keys", async () => {
    const visitSlot = await createVisitSlot();

    await expectForeignKeyViolation(
      prisma.candidateSlotAssignment.create({
        data: {
          id: randomUUID(),
          candidateId: randomUUID(),
          visitSlotId: visitSlot.id,
        },
      }),
    );
  });

  test("tickets.ticket_code is unique", async () => {
    const candidate = await createCandidate();
    const visitSlot = await createVisitSlot();
    const exam = await createExam();
    const examVersion = await createExamVersion(exam.id, 1);
    const ticketCode = `TICKET-${randomUUID()}`;

    await prisma.ticket.create({
      data: {
        id: randomUUID(),
        ticketCode,
        candidateId: candidate.id,
        examVersionId: examVersion.id,
        visitSlotId: visitSlot.id,
        pinHash: "hashed-pin",
        status: "ACTIVE",
      },
    });

    await expectUniqueViolation(
      prisma.ticket.create({
        data: {
          id: randomUUID(),
          ticketCode,
          candidateId: candidate.id,
          examVersionId: examVersion.id,
          visitSlotId: visitSlot.id,
          pinHash: "hashed-pin",
          status: "ACTIVE",
        },
      }),
    );
  });

  test("exam_versions are unique per exam and version_number", async () => {
    const exam = await createExam();

    await createExamVersion(exam.id, 1);

    await expectUniqueViolation(
      prisma.examVersion.create({
        data: {
          id: randomUUID(),
          examId: exam.id,
          versionNumber: 1,
          status: "DRAFT",
        },
      }),
    );
  });

  test("exam_version_modules enforces module and position uniqueness", async () => {
    const [examModule, examModuleAlt] = await Promise.all([
      prisma.examModule.findUniqueOrThrow({
        where: { code: "VERBAL" },
      }),
      prisma.examModule.findUniqueOrThrow({
        where: { code: "NONVERBAL" },
      }),
    ]);
    const exam = await createExam();
    const examVersion = await createExamVersion(exam.id, 1);

    await prisma.examVersionModule.create({
      data: {
        id: randomUUID(),
        examVersionId: examVersion.id,
        moduleId: examModule.id,
        durationSeconds: 1200,
        position: 1,
      },
    });

    await expectUniqueViolation(
      prisma.examVersionModule.create({
        data: {
          id: randomUUID(),
          examVersionId: examVersion.id,
          moduleId: examModule.id,
          durationSeconds: 1200,
          position: 2,
        },
      }),
    );

    await expectUniqueViolation(
      prisma.examVersionModule.create({
        data: {
          id: randomUUID(),
          examVersionId: examVersion.id,
          moduleId: examModuleAlt.id,
          durationSeconds: 1200,
          position: 1,
        },
      }),
    );
  });

  test("question_options position is unique per question", async () => {
    const question = await createQuestion();

    await createQuestionOption(question.id, 1);

    await expectUniqueViolation(createQuestionOption(question.id, 1));
  });

  test("attempt_answers are unique per attempt_item", async () => {
    const examModule = await prisma.examModule.findUniqueOrThrow({
      where: { code: "VERBAL" },
    });
    const candidate = await createCandidate();
    const visitSlot = await createVisitSlot();
    const exam = await createExam();
    const examVersion = await createExamVersion(exam.id, 1);
    const ticket = await prisma.ticket.create({
      data: {
        id: randomUUID(),
        ticketCode: `TICKET-${randomUUID()}`,
        candidateId: candidate.id,
        examVersionId: examVersion.id,
        visitSlotId: visitSlot.id,
        pinHash: "hashed-pin",
        status: "ACTIVE",
      },
    });
    const question = await createQuestion();
    const option = await createQuestionOption(question.id, 1);
    const attempt = await prisma.attempt.create({
      data: {
        id: randomUUID(),
        candidateId: candidate.id,
        examVersionId: examVersion.id,
        ticketId: ticket.id,
        status: "NOT_STARTED",
      },
    });
    const attemptItem = await prisma.attemptItem.create({
      data: {
        id: randomUUID(),
        attemptId: attempt.id,
        moduleId: examModule.id,
        questionId: question.id,
        position: 1,
        points: 1,
      },
    });

    await prisma.attemptAnswer.create({
      data: {
        id: randomUUID(),
        attemptItemId: attemptItem.id,
        selectedOptionId: option.id,
        answeredAt: new Date(),
      },
    });

    await expectUniqueViolation(
      prisma.attemptAnswer.create({
        data: {
          id: randomUUID(),
          attemptItemId: attemptItem.id,
          selectedOptionId: option.id,
          answeredAt: new Date(),
        },
      }),
    );
  });

  test("attempt_scores are unique per attempt", async () => {
    const candidate = await createCandidate();
    const visitSlot = await createVisitSlot();
    const exam = await createExam();
    const examVersion = await createExamVersion(exam.id, 1);
    const ticket = await prisma.ticket.create({
      data: {
        id: randomUUID(),
        ticketCode: `TICKET-${randomUUID()}`,
        candidateId: candidate.id,
        examVersionId: examVersion.id,
        visitSlotId: visitSlot.id,
        pinHash: "hashed-pin",
        status: "ACTIVE",
      },
    });
    const attempt = await prisma.attempt.create({
      data: {
        id: randomUUID(),
        candidateId: candidate.id,
        examVersionId: examVersion.id,
        ticketId: ticket.id,
        status: "SUBMITTED",
      },
    });

    await prisma.attemptScore.create({
      data: {
        id: randomUUID(),
        attemptId: attempt.id,
        rawScore: 10,
        maxScore: 20,
      },
    });

    await expectUniqueViolation(
      prisma.attemptScore.create({
        data: {
          id: randomUUID(),
          attemptId: attempt.id,
          rawScore: 15,
          maxScore: 20,
        },
      }),
    );
  });
});
