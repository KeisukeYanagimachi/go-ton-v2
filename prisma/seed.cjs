const { createHash } = require("crypto");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const hashPin = (pin) => createHash("sha256").update(pin).digest("hex");
const seedTicketCodes = [
  "TICKET-CAND-001",
  "TICKET-CAND-002",
  "TICKET-CAND-003",
  "TICKET-CAND-004",
  "TICKET-CAND-005",
  "TICKET-CAND-006",
  "TICKET-REISSUE-001",
];

const resetSeedAttempts = async () => {
  const attempts = await prisma.attempt.findMany({
    where: { ticket: { ticketCode: { in: seedTicketCodes } } },
    select: { id: true },
  });

  if (attempts.length === 0) {
    return;
  }

  const attemptIds = attempts.map((attempt) => attempt.id);
  const attemptItems = await prisma.attemptItem.findMany({
    where: { attemptId: { in: attemptIds } },
    select: { id: true },
  });
  const attemptItemIds = attemptItems.map((item) => item.id);

  await prisma.attemptItemEvent.deleteMany({
    where: { attemptId: { in: attemptIds } },
  });

  if (attemptItemIds.length > 0) {
    await prisma.attemptItemMetric.deleteMany({
      where: { attemptItemId: { in: attemptItemIds } },
    });
    await prisma.attemptAnswerScore.deleteMany({
      where: { attemptItemId: { in: attemptItemIds } },
    });
    await prisma.attemptAnswer.deleteMany({
      where: { attemptItemId: { in: attemptItemIds } },
    });
  }

  await prisma.attemptItem.deleteMany({
    where: { attemptId: { in: attemptIds } },
  });
  await prisma.attemptModuleTimer.deleteMany({
    where: { attemptId: { in: attemptIds } },
  });
  await prisma.attemptModuleScore.deleteMany({
    where: { attemptId: { in: attemptIds } },
  });
  await prisma.attemptScore.deleteMany({
    where: { attemptId: { in: attemptIds } },
  });
  await prisma.attemptSession.deleteMany({
    where: { attemptId: { in: attemptIds } },
  });
  await prisma.attempt.deleteMany({
    where: { id: { in: attemptIds } },
  });
};

const resetReissueTicket = async () => {
  const ticket = await prisma.ticket.findUnique({
    where: { ticketCode: "TICKET-REISSUE-001" },
    select: { id: true, replacedByTicketId: true },
  });

  if (!ticket) {
    return;
  }

  if (ticket.replacedByTicketId) {
    await prisma.ticket.delete({
      where: { id: ticket.replacedByTicketId },
    });
  }

  await prisma.ticket.update({
    where: { id: ticket.id },
    data: {
      status: "ACTIVE",
      replacedByTicketId: null,
    },
  });
};

async function main() {
  await resetSeedAttempts();
  await prisma.staffRole.createMany({
    data: [
      {
        id: "00000000-0000-0000-0000-000000000001",
        code: "ADMIN",
        name: "Administrator",
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        code: "AUTHOR",
        name: "Question Author",
      },
      {
        id: "00000000-0000-0000-0000-000000000003",
        code: "PROCTOR",
        name: "Proctor",
      },
      {
        id: "00000000-0000-0000-0000-000000000004",
        code: "REPORT_VIEWER",
        name: "Report Viewer",
      },
    ],
    skipDuplicates: true,
  });

  const staffUsers = [
    {
      id: "10000000-0000-0000-0000-000000000001",
      email: "admin@example.com",
      displayName: "Admin User",
      isActive: true,
    },
    {
      id: "10000000-0000-0000-0000-000000000002",
      email: "author@example.com",
      displayName: "Author User",
      isActive: true,
    },
    {
      id: "10000000-0000-0000-0000-000000000003",
      email: "proctor@example.com",
      displayName: "Proctor User",
      isActive: true,
    },
    {
      id: "10000000-0000-0000-0000-000000000004",
      email: "viewer@example.com",
      displayName: "Viewer User",
      isActive: true,
    },
  ];

  await Promise.all(
    staffUsers.map((user) =>
      prisma.staffUser.upsert({
        where: { id: user.id },
        update: {
          email: user.email,
          displayName: user.displayName,
          isActive: user.isActive,
        },
        create: user,
      }),
    ),
  );

  await prisma.staffUserRole.createMany({
    data: [
      {
        staffUserId: "10000000-0000-0000-0000-000000000001",
        staffRoleId: "00000000-0000-0000-0000-000000000001",
      },
      {
        staffUserId: "10000000-0000-0000-0000-000000000002",
        staffRoleId: "00000000-0000-0000-0000-000000000002",
      },
      {
        staffUserId: "10000000-0000-0000-0000-000000000003",
        staffRoleId: "00000000-0000-0000-0000-000000000003",
      },
      {
        staffUserId: "10000000-0000-0000-0000-000000000004",
        staffRoleId: "00000000-0000-0000-0000-000000000004",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.examModule.createMany({
    data: [
      {
        id: "20000000-0000-0000-0000-000000000001",
        code: "VERBAL",
        name: "Verbal",
      },
      {
        id: "20000000-0000-0000-0000-000000000002",
        code: "NONVERBAL",
        name: "Nonverbal",
      },
      {
        id: "20000000-0000-0000-0000-000000000003",
        code: "ENGLISH",
        name: "English",
      },
      {
        id: "20000000-0000-0000-0000-000000000004",
        code: "STRUCTURAL",
        name: "Structural",
      },
      {
        id: "20000000-0000-0000-0000-000000000005",
        code: "PERSONALITY",
        name: "Personality (Future)",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.candidate.createMany({
    data: [
      {
        id: "40000000-0000-0000-0000-000000000001",
        fullName: "Candidate One",
        email: "candidate.one@example.com",
        education: "大学卒",
        birthDate: new Date("1999-01-01"),
      },
      {
        id: "40000000-0000-0000-0000-000000000002",
        fullName: "Candidate Two",
        email: "candidate.two@example.com",
        education: "大学院卒",
        birthDate: new Date("2000-02-02"),
      },
    ],
    skipDuplicates: true,
  });

  await prisma.device.createMany({
    data: [
      {
        id: "60000000-0000-0000-0000-000000000001",
        deviceCode: "PC-A-001",
        description: "Interview room PC A",
      },
      {
        id: "60000000-0000-0000-0000-000000000002",
        deviceCode: "PC-B-001",
        description: "Interview room PC B",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.exam.upsert({
    where: { id: "70000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "70000000-0000-0000-0000-000000000001",
      name: "Company SPI Exam",
      description: "Internal SPI-like assessment aligned with SPI3 modules",
    },
  });

  await prisma.examVersion.createMany({
    data: [
      {
        id: "71000000-0000-0000-0000-000000000001",
        examId: "70000000-0000-0000-0000-000000000001",
        versionNumber: 1,
        status: "DRAFT",
        publishedAt: null,
      },
      {
        id: "71000000-0000-0000-0000-000000000002",
        examId: "70000000-0000-0000-0000-000000000001",
        versionNumber: 2,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    ],
    skipDuplicates: true,
  });

  const tickets = [
    {
      id: "50000000-0000-0000-0000-000000000001",
      ticketCode: "TICKET-CAND-001",
      candidateId: "40000000-0000-0000-0000-000000000001",
      examVersionId: "71000000-0000-0000-0000-000000000002",
      pinHash: hashPin("19990101"),
      status: "ACTIVE",
      createdByStaffUserId: "10000000-0000-0000-0000-000000000003",
    },
    {
      id: "50000000-0000-0000-0000-000000000002",
      ticketCode: "TICKET-CAND-002",
      candidateId: "40000000-0000-0000-0000-000000000002",
      examVersionId: "71000000-0000-0000-0000-000000000002",
      pinHash: hashPin("20000202"),
      status: "ACTIVE",
      createdByStaffUserId: "10000000-0000-0000-0000-000000000003",
    },
    {
      id: "50000000-0000-0000-0000-000000000004",
      ticketCode: "TICKET-CAND-003",
      candidateId: "40000000-0000-0000-0000-000000000002",
      examVersionId: "71000000-0000-0000-0000-000000000002",
      pinHash: hashPin("20000202"),
      status: "ACTIVE",
      createdByStaffUserId: "10000000-0000-0000-0000-000000000003",
    },
    {
      id: "50000000-0000-0000-0000-000000000005",
      ticketCode: "TICKET-CAND-004",
      candidateId: "40000000-0000-0000-0000-000000000001",
      examVersionId: "71000000-0000-0000-0000-000000000002",
      pinHash: hashPin("19990101"),
      status: "ACTIVE",
      createdByStaffUserId: "10000000-0000-0000-0000-000000000003",
    },
    {
      id: "50000000-0000-0000-0000-000000000006",
      ticketCode: "TICKET-CAND-005",
      candidateId: "40000000-0000-0000-0000-000000000002",
      examVersionId: "71000000-0000-0000-0000-000000000002",
      pinHash: hashPin("20000202"),
      status: "ACTIVE",
      createdByStaffUserId: "10000000-0000-0000-0000-000000000003",
    },
    {
      id: "50000000-0000-0000-0000-000000000007",
      ticketCode: "TICKET-CAND-006",
      candidateId: "40000000-0000-0000-0000-000000000002",
      examVersionId: "71000000-0000-0000-0000-000000000002",
      pinHash: hashPin("20000202"),
      status: "ACTIVE",
      createdByStaffUserId: "10000000-0000-0000-0000-000000000003",
    },
    {
      id: "50000000-0000-0000-0000-000000000003",
      ticketCode: "TICKET-REISSUE-001",
      candidateId: "40000000-0000-0000-0000-000000000001",
      examVersionId: "71000000-0000-0000-0000-000000000002",
      pinHash: hashPin("19990101"),
      status: "ACTIVE",
      createdByStaffUserId: "10000000-0000-0000-0000-000000000003",
    },
  ];

  await Promise.all(
    tickets.map((ticket) =>
      prisma.ticket.upsert({
        where: { ticketCode: ticket.ticketCode },
        update: {
          candidateId: ticket.candidateId,
          examVersionId: ticket.examVersionId,
          pinHash: ticket.pinHash,
          status: ticket.status,
          createdByStaffUserId: ticket.createdByStaffUserId,
        },
        create: ticket,
      }),
    ),
  );

  await resetReissueTicket();

  await prisma.examVersionModule.createMany({
    data: [
      {
        id: "72000000-0000-0000-0000-000000000001",
        examVersionId: "71000000-0000-0000-0000-000000000002",
        moduleId: "20000000-0000-0000-0000-000000000001",
        durationSeconds: 1800,
        position: 1,
      },
      {
        id: "72000000-0000-0000-0000-000000000002",
        examVersionId: "71000000-0000-0000-0000-000000000002",
        moduleId: "20000000-0000-0000-0000-000000000002",
        durationSeconds: 1800,
        position: 2,
      },
      {
        id: "72000000-0000-0000-0000-000000000003",
        examVersionId: "71000000-0000-0000-0000-000000000002",
        moduleId: "20000000-0000-0000-0000-000000000003",
        durationSeconds: 1200,
        position: 3,
      },
      {
        id: "72000000-0000-0000-0000-000000000004",
        examVersionId: "71000000-0000-0000-0000-000000000002",
        moduleId: "20000000-0000-0000-0000-000000000004",
        durationSeconds: 1200,
        position: 4,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.questionCategory.createMany({
    data: [
      { id: "80000000-0000-0000-0000-000000000001", name: "VERBAL" },
      { id: "80000000-0000-0000-0000-000000000002", name: "NONVERBAL" },
      { id: "80000000-0000-0000-0000-000000000003", name: "ENGLISH" },
      { id: "80000000-0000-0000-0000-000000000004", name: "STRUCTURAL" },
      {
        id: "80000000-0000-0000-0000-000000000011",
        name: "VERBAL:Synonyms",
        parentId: "80000000-0000-0000-0000-000000000001",
      },
      {
        id: "80000000-0000-0000-0000-000000000021",
        name: "NONVERBAL:Ratio",
        parentId: "80000000-0000-0000-0000-000000000002",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.question.createMany({
    data: [
      {
        id: "90000000-0000-0000-0000-000000000001",
        stem: 'Choose the synonym of "rapid".',
        explanation: "Rapid means fast.",
        isActive: true,
      },
      {
        id: "90000000-0000-0000-0000-000000000002",
        stem: 'Choose the best meaning of "assist".',
        explanation: "Assist means help.",
        isActive: true,
      },
      {
        id: "90000000-0000-0000-0000-000000000003",
        stem: "If 2:3 = x:12, what is x?",
        explanation: "2/3 = x/12 => x=8",
        isActive: true,
      },
      {
        id: "90000000-0000-0000-0000-000000000004",
        stem: "What is 7 + 5?",
        explanation: "7 + 5 = 12",
        isActive: true,
      },
      {
        id: "90000000-0000-0000-0000-000000000005",
        stem: 'Select the correct article: "__ apple"',
        explanation: "An apple",
        isActive: true,
      },
      {
        id: "90000000-0000-0000-0000-000000000006",
        stem: 'Choose the past tense of "go".',
        explanation: "Went",
        isActive: true,
      },
      {
        id: "90000000-0000-0000-0000-000000000007",
        stem: "Which pair is most similar? (cat : kitten)",
        explanation: "adult:young",
        isActive: true,
      },
      {
        id: "90000000-0000-0000-0000-000000000008",
        stem: "Find the odd one out: square, circle, triangle, apple",
        explanation: "apple is not a shape",
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.questionOption.createMany({
    data: [
      {
        id: "91000000-0000-0000-0000-000000000001",
        questionId: "90000000-0000-0000-0000-000000000001",
        optionText: "fast",
        isCorrect: true,
        position: 1,
      },
      {
        id: "91000000-0000-0000-0000-000000000002",
        questionId: "90000000-0000-0000-0000-000000000001",
        optionText: "slow",
        isCorrect: false,
        position: 2,
      },
      {
        id: "91000000-0000-0000-0000-000000000003",
        questionId: "90000000-0000-0000-0000-000000000001",
        optionText: "heavy",
        isCorrect: false,
        position: 3,
      },
      {
        id: "91000000-0000-0000-0000-000000000004",
        questionId: "90000000-0000-0000-0000-000000000001",
        optionText: "late",
        isCorrect: false,
        position: 4,
      },
      {
        id: "91000000-0000-0000-0000-000000000005",
        questionId: "90000000-0000-0000-0000-000000000002",
        optionText: "help",
        isCorrect: true,
        position: 1,
      },
      {
        id: "91000000-0000-0000-0000-000000000006",
        questionId: "90000000-0000-0000-0000-000000000002",
        optionText: "hinder",
        isCorrect: false,
        position: 2,
      },
      {
        id: "91000000-0000-0000-0000-000000000007",
        questionId: "90000000-0000-0000-0000-000000000002",
        optionText: "ignore",
        isCorrect: false,
        position: 3,
      },
      {
        id: "91000000-0000-0000-0000-000000000008",
        questionId: "90000000-0000-0000-0000-000000000002",
        optionText: "delay",
        isCorrect: false,
        position: 4,
      },
      {
        id: "91000000-0000-0000-0000-000000000009",
        questionId: "90000000-0000-0000-0000-000000000003",
        optionText: "6",
        isCorrect: false,
        position: 1,
      },
      {
        id: "91000000-0000-0000-0000-000000000010",
        questionId: "90000000-0000-0000-0000-000000000003",
        optionText: "8",
        isCorrect: true,
        position: 2,
      },
      {
        id: "91000000-0000-0000-0000-000000000011",
        questionId: "90000000-0000-0000-0000-000000000003",
        optionText: "9",
        isCorrect: false,
        position: 3,
      },
      {
        id: "91000000-0000-0000-0000-000000000012",
        questionId: "90000000-0000-0000-0000-000000000003",
        optionText: "10",
        isCorrect: false,
        position: 4,
      },
      {
        id: "91000000-0000-0000-0000-000000000013",
        questionId: "90000000-0000-0000-0000-000000000004",
        optionText: "11",
        isCorrect: false,
        position: 1,
      },
      {
        id: "91000000-0000-0000-0000-000000000014",
        questionId: "90000000-0000-0000-0000-000000000004",
        optionText: "12",
        isCorrect: true,
        position: 2,
      },
      {
        id: "91000000-0000-0000-0000-000000000015",
        questionId: "90000000-0000-0000-0000-000000000004",
        optionText: "13",
        isCorrect: false,
        position: 3,
      },
      {
        id: "91000000-0000-0000-0000-000000000016",
        questionId: "90000000-0000-0000-0000-000000000004",
        optionText: "14",
        isCorrect: false,
        position: 4,
      },
      {
        id: "91000000-0000-0000-0000-000000000017",
        questionId: "90000000-0000-0000-0000-000000000005",
        optionText: "a",
        isCorrect: false,
        position: 1,
      },
      {
        id: "91000000-0000-0000-0000-000000000018",
        questionId: "90000000-0000-0000-0000-000000000005",
        optionText: "an",
        isCorrect: true,
        position: 2,
      },
      {
        id: "91000000-0000-0000-0000-000000000019",
        questionId: "90000000-0000-0000-0000-000000000005",
        optionText: "the",
        isCorrect: false,
        position: 3,
      },
      {
        id: "91000000-0000-0000-0000-000000000020",
        questionId: "90000000-0000-0000-0000-000000000005",
        optionText: "no article",
        isCorrect: false,
        position: 4,
      },
      {
        id: "91000000-0000-0000-0000-000000000021",
        questionId: "90000000-0000-0000-0000-000000000006",
        optionText: "goed",
        isCorrect: false,
        position: 1,
      },
      {
        id: "91000000-0000-0000-0000-000000000022",
        questionId: "90000000-0000-0000-0000-000000000006",
        optionText: "went",
        isCorrect: true,
        position: 2,
      },
      {
        id: "91000000-0000-0000-0000-000000000023",
        questionId: "90000000-0000-0000-0000-000000000006",
        optionText: "gone",
        isCorrect: false,
        position: 3,
      },
      {
        id: "91000000-0000-0000-0000-000000000024",
        questionId: "90000000-0000-0000-0000-000000000006",
        optionText: "goes",
        isCorrect: false,
        position: 4,
      },
      {
        id: "91000000-0000-0000-0000-000000000025",
        questionId: "90000000-0000-0000-0000-000000000007",
        optionText: "dog : puppy",
        isCorrect: true,
        position: 1,
      },
      {
        id: "91000000-0000-0000-0000-000000000026",
        questionId: "90000000-0000-0000-0000-000000000007",
        optionText: "car : wheel",
        isCorrect: false,
        position: 2,
      },
      {
        id: "91000000-0000-0000-0000-000000000027",
        questionId: "90000000-0000-0000-0000-000000000007",
        optionText: "tree : leaf",
        isCorrect: false,
        position: 3,
      },
      {
        id: "91000000-0000-0000-0000-000000000028",
        questionId: "90000000-0000-0000-0000-000000000007",
        optionText: "book : page",
        isCorrect: false,
        position: 4,
      },
      {
        id: "91000000-0000-0000-0000-000000000029",
        questionId: "90000000-0000-0000-0000-000000000008",
        optionText: "square",
        isCorrect: false,
        position: 1,
      },
      {
        id: "91000000-0000-0000-0000-000000000030",
        questionId: "90000000-0000-0000-0000-000000000008",
        optionText: "circle",
        isCorrect: false,
        position: 2,
      },
      {
        id: "91000000-0000-0000-0000-000000000031",
        questionId: "90000000-0000-0000-0000-000000000008",
        optionText: "triangle",
        isCorrect: false,
        position: 3,
      },
      {
        id: "91000000-0000-0000-0000-000000000032",
        questionId: "90000000-0000-0000-0000-000000000008",
        optionText: "apple",
        isCorrect: true,
        position: 4,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.questionCategoryAssignment.createMany({
    data: [
      {
        questionId: "90000000-0000-0000-0000-000000000001",
        categoryId: "80000000-0000-0000-0000-000000000001",
      },
      {
        questionId: "90000000-0000-0000-0000-000000000001",
        categoryId: "80000000-0000-0000-0000-000000000011",
      },
      {
        questionId: "90000000-0000-0000-0000-000000000002",
        categoryId: "80000000-0000-0000-0000-000000000001",
      },
      {
        questionId: "90000000-0000-0000-0000-000000000003",
        categoryId: "80000000-0000-0000-0000-000000000002",
      },
      {
        questionId: "90000000-0000-0000-0000-000000000003",
        categoryId: "80000000-0000-0000-0000-000000000021",
      },
      {
        questionId: "90000000-0000-0000-0000-000000000004",
        categoryId: "80000000-0000-0000-0000-000000000002",
      },
      {
        questionId: "90000000-0000-0000-0000-000000000005",
        categoryId: "80000000-0000-0000-0000-000000000003",
      },
      {
        questionId: "90000000-0000-0000-0000-000000000006",
        categoryId: "80000000-0000-0000-0000-000000000003",
      },
      {
        questionId: "90000000-0000-0000-0000-000000000007",
        categoryId: "80000000-0000-0000-0000-000000000004",
      },
      {
        questionId: "90000000-0000-0000-0000-000000000008",
        categoryId: "80000000-0000-0000-0000-000000000004",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.examVersionQuestion.createMany({
    data: [
      {
        id: "A1000000-0000-0000-0000-000000000001",
        examVersionId: "71000000-0000-0000-0000-000000000002",
        moduleId: "20000000-0000-0000-0000-000000000001",
        questionId: "90000000-0000-0000-0000-000000000001",
        position: 1,
        points: 1,
      },
      {
        id: "A1000000-0000-0000-0000-000000000002",
        examVersionId: "71000000-0000-0000-0000-000000000002",
        moduleId: "20000000-0000-0000-0000-000000000001",
        questionId: "90000000-0000-0000-0000-000000000002",
        position: 2,
        points: 1,
      },
      {
        id: "A1000000-0000-0000-0000-000000000003",
        examVersionId: "71000000-0000-0000-0000-000000000002",
        moduleId: "20000000-0000-0000-0000-000000000002",
        questionId: "90000000-0000-0000-0000-000000000003",
        position: 1,
        points: 1,
      },
      {
        id: "A1000000-0000-0000-0000-000000000004",
        examVersionId: "71000000-0000-0000-0000-000000000002",
        moduleId: "20000000-0000-0000-0000-000000000002",
        questionId: "90000000-0000-0000-0000-000000000004",
        position: 2,
        points: 1,
      },
      {
        id: "A1000000-0000-0000-0000-000000000005",
        examVersionId: "71000000-0000-0000-0000-000000000002",
        moduleId: "20000000-0000-0000-0000-000000000003",
        questionId: "90000000-0000-0000-0000-000000000005",
        position: 1,
        points: 1,
      },
      {
        id: "A1000000-0000-0000-0000-000000000006",
        examVersionId: "71000000-0000-0000-0000-000000000002",
        moduleId: "20000000-0000-0000-0000-000000000003",
        questionId: "90000000-0000-0000-0000-000000000006",
        position: 2,
        points: 1,
      },
      {
        id: "A1000000-0000-0000-0000-000000000007",
        examVersionId: "71000000-0000-0000-0000-000000000002",
        moduleId: "20000000-0000-0000-0000-000000000004",
        questionId: "90000000-0000-0000-0000-000000000007",
        position: 1,
        points: 1,
      },
      {
        id: "A1000000-0000-0000-0000-000000000008",
        examVersionId: "71000000-0000-0000-0000-000000000002",
        moduleId: "20000000-0000-0000-0000-000000000004",
        questionId: "90000000-0000-0000-0000-000000000008",
        position: 2,
        points: 1,
      },
    ],
    skipDuplicates: true,
  });

  await prisma.examVersion.update({
    where: { id: "71000000-0000-0000-0000-000000000001" },
    data: { status: "PUBLISHED", publishedAt: new Date() },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
