import Link from "next/link";

import { Container } from "./Container";
import { BrandLogo } from "./BrandLogo";
import { SocialIcon, socialLinks } from "./SocialIcon";
import type { ResolvedBrand } from "@/lib/brand";

/**
 * Footer.
 *
 * ===================================================================
 *  DATA
 * ===================================================================
 * Semua data kontak dan kanal media sosial berasal dari `GET /brand`
 * (`app_settings`) — bukan hardcode. PRD §3.11: nomor CS dan tautan resmi
 * diambil dari panel admin supaya bisa diganti tanpa redeploy.
 *
 * Catatan: mockup lama menulis `+62 812-3456-7890` di 6 file dan
 * `halo@palorinjani.com` + `@palomountaingoods` di 2 file. Semua sudah dihapus;
 * kalau suatu hari ada nomor telepon literal di repo ini, itu regresi.
 *
 * ===================================================================
 *  IKON MEDIA SOSIAL
 * ===================================================================
 * Kanal yang `null` (admin belum mengisi) TIDAK dirender sama sekali.
 * Alasannya ada di `socialLinks()`: ikon yang menuju tautan kosong membuat
 * pengunjung mengira akun brand-nya hilang, dan `href="#"` hanya memuat
 * ulang halaman.
 *
 * ===================================================================
 *  AKSESIBILITAS
 * ===================================================================
 * - Ikon SVG `aria-hidden`; nama kanal ada di `sr-only` pada tiap tautan.
 * - Section diberi `aria-labelledby`, bukan hanya heading visual, supaya
 *   pembaca layar bisa melompat antarbagian.
 * - Tautan luar selalu `rel="noopener noreferrer"`.
 */
export function SiteFooter({ brand }: { brand: ResolvedBrand | null }) {
  const links = brand
    ? socialLinks({
        instagramUrl: brand.instagramUrl,
        facebookUrl: brand.facebookUrl,
        tiktokUrl: brand.tiktokUrl,
        whatsappLink: brand.whatsappLink,
      })
    : [];

  return (
    <footer className="mt-16 bg-brand-deep text-surface-paper">
      <Container>
        {/*
          Blok atas. Padding vertikal lebih longgar dari versi lama supaya
          footer terasa sebagai penutup halaman, bukan sekadar strip info
          yang menempel di bawah.
        */}
        <div className="grid gap-12 py-14 tablet:grid-cols-12 tablet:gap-8 desktop:py-16">
          {/* ---------- Identitas brand + kanal sosial ---------- */}
          <div className="tablet:col-span-4">
            <div className="flex items-center gap-3">
              <BrandLogo className="h-10 w-10" />
              <span className="font-headline text-headline-sm font-semibold text-surface-paper">
                Palo Mountain Goods
              </span>
            </div>

            <p className="mt-5 max-w-sm text-body-sm leading-relaxed text-surface-paper/70">
              {brand?.tagline ??
                "Merchandise penjelajahan berakar di Senaru, kaki Gunung Rinjani, Lombok Utara."}
            </p>

            <p className="mt-5 font-mono text-caption uppercase tracking-widest text-accent-earth">
              Senaru • Lombok Utara • NTB
            </p>

            {/*
              Kanal media sosial.

              Hanya dirender kalau `links` tidak kosong — kalau semua tautan
              masih `null`, blok kosong lebih buruk daripada tidak ada sama
              sekali (tinggal ruang kosong di bawah tagline).
            */}
            {links.length > 0 ? (
              <nav aria-label="Media sosial" className="mt-7">
                <h2 className="text-caption font-semibold uppercase tracking-widest text-surface-paper/60">
                  Ikuti Kami
                </h2>

                <ul className="mt-3 flex items-center gap-2.5">
                  {links.map((link) => (
                    <li key={link.network}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={[
                          "flex h-10 w-10 items-center justify-center rounded-full border",
                          "border-surface-white/25 bg-surface-white/5 text-surface-white",
                          "transition-colors duration-150",
                          "hover:border-surface-white/60 hover:bg-surface-white/15",
                        ].join(" ")}
                      >
                        <SocialIcon network={link.network} />
                        <span className="sr-only">
                          {link.label}
                          {link.network === "whatsapp" && brand?.whatsapp
                            ? ` — ${brand.whatsapp}`
                            : ""}
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </div>

          {/* ---------- Tautan navigasi ---------- */}
          <nav
            aria-labelledby="footer-jelajahi"
            className="tablet:col-span-5 grid grid-cols-2 gap-8 tablet:gap-10"
          >
            <FooterLinkGroup
              headingId="footer-jelajahi"
              heading="Jelajahi"
              links={[
                { href: "/koleksi", label: "Koleksi" },
                { href: "/produk", label: "Katalog" },
                { href: "/cerita", label: "Cerita Palo" },
                { href: "/kontak", label: "Toko Senaru" },
                { href: "/lacak", label: "Lacak Pesanan" },
              ]}
            />
            <FooterLinkGroup
              headingId="footer-akun"
              heading="Akun"
              links={[
                { href: "/keranjang", label: "Keranjang" },
                { href: "/masuk", label: "Masuk" },
                { href: "/daftar", label: "Buat Akun" },
                { href: "/checkout", label: "Checkout" },
              ]}
            />
          </nav>

          {/* ---------- Toko & kontak ---------- */}
          <div className="tablet:col-span-3">
            <h2
              id="footer-toko"
              className="text-label-md font-semibold uppercase tracking-wider text-surface-white"
            >
              Toko &amp; Kontak
            </h2>

            <address className="mt-4 space-y-3 text-body-sm not-italic leading-relaxed text-surface-paper/85">
              <p>{brand?.address ?? "Jl. Pariwisata Senaru, Bayan, Lombok Utara, Nusa Tenggara Barat"}</p>

              <p>
                Jam operasional:{" "}
                {brand?.openingHours ?? "Senin – Minggu: 08.00 – 21.00 WITA"}
              </p>

              {brand?.whatsapp ? (
                <p>
                  WhatsApp CS:{" "}
                  <span className="text-surface-paper">{brand.whatsapp}</span>
                </p>
              ) : null}

              {brand?.email ? (
                <p>
                  <a
                    href={`mailto:${brand.email}`}
                    className="underline decoration-accent-earth/60 underline-offset-4 transition-colors hover:text-surface-white"
                  >
                    {brand.email}
                  </a>
                </p>
              ) : null}
            </address>
          </div>
        </div>

        {/* ---------- Garis pemisah + hak cipta ---------- */}
        <div className="flex flex-col gap-3 border-t border-line-inverse py-7 text-caption text-surface-paper/55 tablet:flex-row tablet:items-center tablet:justify-between">
          <p>
            © {new Date().getFullYear()} Palo Mountain Goods (PALORINJANI).
            Senaru, Lombok Utara.
          </p>
          <p className="font-mono uppercase tracking-widest text-accent-earth/80">
            Rinjani — Nusa Tenggara Barat
          </p>
        </div>
      </Container>
    </footer>
  );
}

/**
 * Satu kelompok tautan footer.
 *
 * Dipisah supaya `SiteFooter` tidak mengulang markup yang sama dua kali —
 * dua salinan dari blok yang sama persis adalah tempat paling umum bug
 * aksesibilitas (mis. `aria-labelledby` yang tidak sengaja kembar) muncul.
 */
function FooterLinkGroup({
  headingId,
  heading,
  links,
}: {
  headingId: string;
  heading: string;
  links: Array<{ href: string; label: string }>;
}) {
  return (
    <div>
      <h2
        id={headingId}
        className="text-label-md font-semibold uppercase tracking-wider text-surface-white"
      >
        {heading}
      </h2>
      <ul className="mt-4 space-y-1 text-body-sm font-medium">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-11 items-center text-surface-paper/85 transition-colors hover:text-surface-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
