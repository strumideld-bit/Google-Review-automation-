"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/clients";

export async function createClientAction(formData: FormData) {
  const slug = String(formData.get("slug") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const googleReviewUrl = String(formData.get("googleReviewUrl") || "").trim();
  const ownerEmail = String(formData.get("ownerEmail") || "").trim();
  const accentColor = String(formData.get("accentColor") || "#1F5C43").trim();

  if (!slug || !name || !googleReviewUrl || !ownerEmail) {
    throw new Error("Wypełnij wszystkie wymagane pola.");
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error("Slug może zawierać tylko małe litery, cyfry i myślniki.");
  }

  await createClient({ slug, name, googleReviewUrl, ownerEmail, accentColor });
  revalidatePath("/admin");
}
