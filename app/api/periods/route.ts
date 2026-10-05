import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

import { createPeriod, listPeriods } from "@/lib/periods";
import { createPeriodSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const periods = await listPeriods();
  return NextResponse.json(periods);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createPeriodSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const period = await createPeriod(parsed.data);
    return NextResponse.json(period, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "A period already exists for this month." },
        { status: 409 },
      );
    }
    throw error;
  }
}
