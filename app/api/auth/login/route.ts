import { NextResponse } from "next/server";

import { setSessionCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { credentialsSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = credentialsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !verifyPassword(password, user.password)) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  await setSessionCookie(user.id);
  return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
