import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import type { NewIdeaInput, ProductIdea } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

type DB = { ideas: ProductIdea[] };

// Serialise writes so concurrent requests don't clobber the file.
let chain: Promise<unknown> = Promise.resolve();
function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.then(
    () => undefined,
    () => undefined
  );
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

export async function listIdeas(): Promise<ProductIdea[]> {
  const db = await readDB();
  return [...db.ideas].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getIdea(id: string): Promise<ProductIdea | undefined> {
  const db = await readDB();
  return db.ideas.find((i) => i.id === id);
}

export async function createIdea(input: NewIdeaInput): Promise<ProductIdea> {
  return withLock(async () => {
    const db = await readDB();
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
    db.ideas.push(idea);
    await writeDB(db);
    return idea;
  });
}

export async function updateIdea(
  id: string,
  patch: Partial<ProductIdea>
): Promise<ProductIdea | undefined> {
  return withLock(async () => {
    const db = await readDB();
    const idx = db.ideas.findIndex((i) => i.id === id);
    if (idx === -1) return undefined;
    db.ideas[idx] = { ...db.ideas[idx], ...patch, id };
    await writeDB(db);
    return db.ideas[idx];
  });
}
