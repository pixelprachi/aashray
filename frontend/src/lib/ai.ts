import { API } from "@/lib/api";

export type LawSection = { code: string; act: string; title: string; plain: string };
export type AbuseType = {
  type: string;
  label: string;
  blurb: string;
  confidence: number;
  level: "likely" | "possible";
  sections: LawSection[];
  needs_review: boolean;
};
export type Classified = {
  types: AbuseType[];
  threatens_to_share_images: boolean;
  images_shared: boolean;
  crisis_flag: boolean;
  summary: string;
  disclaimer: string;
};

export async function classifyText(text: string): Promise<Classified> {
  const r = await fetch(API + "/ai/classify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error("classify failed");
  return r.json();
}