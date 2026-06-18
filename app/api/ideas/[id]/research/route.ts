import { NextResponse } from "next/server";
import { getIdea, updateIdea } from "@/lib/store";
import { runResearch } from "@/lib/agents";
import { connectResearch } from "@/lib/integration";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
    // Fan results out into the shared Retail-supply-intel tables (best-effort).
    if (!research.error) {
      await connectResearch(idea, research);
    }
    return NextResponse.json({ idea: updated });
  } catch (err) {
    const updated = await updateIdea(idea.id, { status: "error" });
    return NextResponse.json(
      { idea: updated, error: err instanceof Error ? err.message : "Research failed" },
      { status: 500 }
    );
  }
}
