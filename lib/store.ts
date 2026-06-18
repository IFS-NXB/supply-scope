import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { NewIdeaInput, ProductIdea } from "./types";
import { supabase, supabaseEnabled } from "./supabase";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const TABLE = "product_ideas";

type DB = { ideas: ProductIdea[] };

/* ---------- Supabase row mapping ---------- */

function rowToIdea(row: any): ProductIdea {
  return {
    id: row.id,
    createdAt: row.created_at,
    title: row.title,
    description: row.description ?? "",
    category: row.category ?? "",
    targetMarket: row.target_market ?? "",
    audience: row.audience ?? "",
    priceTarget: row.price_target ?? "",
    features: row.features ?? "",
    imageUrl: row.image_url ?? "",
    submittedBy: row.submitted_by ?? "",
    status: row.status,
    research: row.research ?? undefined,
  };
}

function patchToRow(patch: Partial<ProductIdea>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (patch.title !== undefined) row.title = patch.title;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.targetMarket !== undefined) row.target_market = patch.targetMarket;
  if (patch.audience !== undefined) row.audience = patch.audience;
  if (patch.priceTarget !== undefined) row.price_target = patch.priceTarget;
  if (patch.features !== undefined) row.features = patch.features;
  if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl;
  if (patch.submittedBy !== undefined) row.submitted_by = patch.submittedBy;
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.research !== undefined) row.research = patch.research;
  return row;
}

/* ---------- File fallback (local dev / no keys) ---------- */

let chain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(() => undefined, () => undefined);
  return run;
}

async function readDB(): Promise<DB> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as DB;
    if (!parsed.ideas) return { ideas: [] };
    return parsed;
  } catch {
    return { ideas: [] };
  }
}

async function writeDB(db: DB): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

/* ---------- Public API ---------- */

export async function listIdeas(): Promise<ProductIdea[]> {
  if (supabaseEnabled()) {
    const { data, error } = await supabase()!
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToIdea);
  }
  const db = await readDB();
  return [...db.ideas].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getIdea(id: string): Promise<ProductIdea | undefined> {
  if (supabaseEnabled()) {
    const { data, error } = await supabase()!.from(TABLE).select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? rowToIdea(data) : undefined;
  }
  const db = await readDB();
  return db.ideas.find((i) => i.id === id);
}

export async function createIdea(input: NewIdeaInput): Promise<ProductIdea> {
  const idea: ProductIdea = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    title: input.title.trim(),
    description: (input.description || "").trim(),
    category: (input.category || "").trim(),
    targetMarket: (input.targetMarket || "").trim(),
    audience: (input.audience || "").trim(),
    priceTarget: (input.priceTarget || "").trim(),
    features: (input.features || "").trim(),
    imageUrl: (input.imageUrl || "").trim(),
    submittedBy: (input.submittedBy || "").trim(),
    status: "queued",
  };

  if (supabaseEnabled()) {
    const { data, error } = await supabase()!
      .from(TABLE)
      .insert({
        id: idea.id,
        title: idea.title,
        description: idea.description,
        category: idea.category,
        target_market: idea.targetMarket,
        audience: idea.audience,
        price_target: idea.priceTarget,
        features: idea.features,
        image_url: idea.imageUrl,
        submitted_by: idea.submittedBy,
        status: idea.status,
      })
      .select("*")
      .single();
    if (error) throw error;
    return rowToIdea(data);
  }

  return withLock(async () => {
    const db = await readDB();
    db.ideas.push(idea);
    await writeDB(db);
    return idea;
  });
}

export async function updateIdea(
  id: string,
  patch: Partial<ProductIdea>
): Promise<ProductIdea | undefined> {
  if (supabaseEnabled()) {
    const { data, error } = await supabase()!
      .from(TABLE)
      .update(patchToRow(patch))
      .eq("id", id)
      .select("*")
      .maybeSingle();
    if (error) throw error;
    return data ? rowToIdea(data) : undefined;
  }

  return withLock(async () => {
    const db = await readDB();
    const idx = db.ideas.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    db.ideas[idx] = { ...db.ideas[idx], ...patch, id };
    await writeDB(db);
    return db.ideas[idx];
  });
}
