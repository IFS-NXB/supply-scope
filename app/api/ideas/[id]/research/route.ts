import { NextResponse } from "next/server";
import { getIdea, updateIdea } from "@/lib/store";
import { runResearch } from "@/lib/agents";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const idea = await getIdea(params.id);
  if (!idea) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  await updateIdea(idea.id, { status: "researching" });

  try {
    const research = await runResearch(idea);
    const updated = await updateIdea(idea.id, {
      status: research.error ? "error" : "complete",
      research,
    });
    return NextResponse.json({ idea: updated });
  } catch (err) {
    const updated = await updateIdea(idea.id, { status: "error" });
    return NextResponse.json(
      { idea: updated, error: err instanceof Error ? err.message : "Research failed" },
      { status: 500 }
    );
  }
}
