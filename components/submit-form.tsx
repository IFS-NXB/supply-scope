"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UploadCloud, X, Sparkles } from "lucide-react";

const categories = [
  "Apparel & Fashion",
  "Drinkware & Kitchen",
  "Home & Living",
  "Baby & Kids",
  "Beauty & Personal Care",
  "Sports & Outdoors",
  "Electronics & Accessories",
  "Pet Products",
];

const MAX_IMAGE_BYTES = 1_500_000;

export function SubmitForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");

  function handleFile(file?: File) {
    setError(null);
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image is too large (max 1.5 MB). Try a smaller file or paste an image URL.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setImageUrl(result);
      setImagePreview(result);
    };
    reader.readAsDataURL(file);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const payload = {
      title: String(form.get("title") || ""),
      description: String(form.get("description") || ""),
      category: String(form.get("category") || ""),
      targetMarket: String(form.get("targetMarket") || ""),
      audience: String(form.get("audience") || ""),
      priceTarget: String(form.get("priceTarget") || ""),
      features: String(form.get("features") || ""),
      submittedBy: String(form.get("submittedBy") || ""),
      imageUrl,
    };

    if (!payload.title.trim()) {
      setError("Please give your product idea a title.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Something went wrong.");
      router.push(`/ideas/${data.idea.id}?run=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Field label="Product idea title" required hint="A short, descriptive name.">
        <input name="title" required placeholder="e.g. Insulated stainless steel kids' water bottle" className="input" />
      </Field>

      <Field label="Describe the idea" required hint="What is it, what problem does it solve, what makes it different?">
        <textarea name="description" required rows={4} placeholder="Describe the product, its purpose and any standout features…" className="input resize-y" />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Category">
          <input name="category" list="category-options" placeholder="Choose or type a category" className="input" />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Target price" hint="Used to position against the market.">
          <input name="priceTarget" placeholder="e.g. $30–45" className="input" />
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Target market">
          <input name="targetMarket" placeholder="e.g. Australia, UK" className="input" />
        </Field>
        <Field label="Target audience">
          <input name="audience" placeholder="e.g. Parents of toddlers" className="input" />
        </Field>
      </div>

      <Field label="Key features" hint="One per line or comma-separated — helps agents benchmark.">
        <textarea name="features" rows={3} placeholder="Leak-proof lid&#10;BPA-free&#10;Holds 500ml" className="input resize-y" />
      </Field>

      <Field label="Reference image" hint="Optional — upload a sketch/photo or paste an image URL.">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4"
        >
          {imagePreview ? (
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImageUrl("");
                  setImagePreview("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-rose-600"
              >
                <X className="h-4 w-4" /> Remove
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 py-4 text-slate-500"
            >
              <UploadCloud className="h-6 w-6" />
              <span className="text-sm font-medium">Click to upload or drag & drop</span>
              <span className="text-xs">PNG/JPG up to 1.5 MB</span>
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          <div className="mt-3">
            <input
              value={imageUrl.startsWith("data:") ? "" : imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setImagePreview(e.target.value);
              }}
              placeholder="…or paste an image URL"
              className="input"
            />
          </div>
        </div>
      </Field>

      <Field label="Your name / team" hint="Optional.">
        <input name="submittedBy" placeholder="e.g. Priya, Product team" className="input" />
      </Field>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" /> Submit & run agents
            </>
          )}
        </button>
        <p className="text-sm text-slate-500">Agents start researching as soon as you submit.</p>
      </div>
    </form>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-900">
        {label}
        {required && <span className="text-brand-600"> *</span>}
      </span>
      {hint && <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}
