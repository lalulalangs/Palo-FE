import type { JsonLdObject } from "@/lib/jsonld";

/**
 * Penempel JSON-LD.
 *
 * PRD §4.4 + ARSITEKTUR §9 mensyaratkan structured data untuk produk,
 * kategori, dan organisasi. Audit mockup: 0 dari 15 file punya JSON-LD.
 *
 * Render di server (bukan `dangerouslySetInnerHTML` di client) supaya payload
 * ikut masuk HTML awal — mesin pencari tidak selalu menjalankan JS.
 */
export function JsonLd({ data }: { data: JsonLdObject | null }) {
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      // Isinya dibangun sendiri dari data backend, bukan input pengguna.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
