import "server-only";
import { FkaFetcher } from "./fetcher.ts";

export type ExtractedProduct = {
  title: string;
  imageUrl: string;
};

export type ExtractUrlInput = {
  url: string;
  keywords: string[];
};

export type ExtractUrlResult = {
  products: ExtractedProduct[];
  totalFound: number;
  totalFiltered: number;
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function matchesKeywords(title: string, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  const normalizedTitle = normalizeText(title);
  return keywords.some((keyword) => {
    const normalizedKeyword = normalizeText(keyword);
    return normalizedTitle.includes(normalizedKeyword);
  });
}

export async function extractFromUrl(input: ExtractUrlInput): Promise<ExtractUrlResult> {
  const { url, keywords } = input;

  if (!url || !/^https?:\/\//i.test(url)) {
    throw new Error("La URL no es válida.");
  }

  const fetcher = await FkaFetcher.connect();
  try {
    await fetcher.fetchPage(url);

    const products = await fetcher.evaluateProducts();

    const filtered = products.filter((p) => matchesKeywords(p.title, keywords));

    return {
      products: filtered,
      totalFound: products.length,
      totalFiltered: filtered.length,
    };
  } finally {
    await fetcher.close();
  }
}
