import { NextResponse } from "next/server";

import { deletePeriod } from "@/lib/periods";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const deleted = await deletePeriod(id);

  if (!deleted) {
    return NextResponse.json({ error: "Period not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
