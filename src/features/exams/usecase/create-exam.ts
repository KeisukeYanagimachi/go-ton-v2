import { prisma } from "@/shared/db/prisma";

type CreateExamInput = {
  name: string;
  description?: string | null;
};

type CreateExamResult = {
  examId: string;
};

const createExam = async (
  input: CreateExamInput,
): Promise<CreateExamResult> => {
  const exam = await prisma.exam.create({
    data: {
      name: input.name,
      description: input.description ?? null,
    },
  });

  return { examId: exam.id };
};

export { createExam };
export type { CreateExamInput, CreateExamResult };

