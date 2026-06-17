import { NextResponse } from "next/server";
import { createIdea, listIdeas } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const ideas = await listIdeas();
  return NextResponse.json({ ideas });
}

export async function POST(req: Request) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body?.title || typeof body.title !== "string" || !body.title.trim()) {
    return NextResponse.json({ error: "A product title is required." }, { status: 400 });
  }

  const idea = await createIdea({
    title: body.title,
    description: body.description,
    category: body.category,
    targetMarket: body.targetMarket,
    audience: body.audience,
    priceTarget: body.priceTarget,
    features: body.features,
    imageUrl: body.imageUrl,
    submittedBy: body.submittedBy,
  });

  return NextResponse.json({ idea }, { status: 201 });
}
