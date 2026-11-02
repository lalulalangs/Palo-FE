import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { InquiryForm } from "@/components/checkout/InquiryForm";
import { Container } from "@/components/layout/Container";
import { PageHeader, SectionHeading } from "@/components/layout/PageHeader";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { buttonClass } from "@/components/ui/Button";
import { getBrand, getCurrentUser } from "@/lib/api";
import { resolveBrand, whatsappLink } from "@/lib/brand";
import { breadcrumbJsonLd, contactPageJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/metadata";

/**
 * Toko Senaru & kontak.
 *
 * Halaman informasi gerai fisik PALO RINJANI di Senaru, peta lokasi Google Maps,
 * kanal WhatsApp Customer Service, media sosial resmi berbentuk circular horizontal,
 * serta form inquiry grosir/ekspedisi.
 */
export const metadata: Metadata = buildMetadata({
  title: "Toko Senaru & Kontak",
  description:
    "Informasi gerai dan kanal kontak resmi Palo Mountain Goods di Senaru, Lombok Utara. Hubungi kami via WhatsApp, media sosial resmi, atau kunjungi langsung basecamp kami.",
  path: "/kontak",
});

const CS_DEFAULT_MESSAGE = "Halo, saya ingin bertanya tentang merchandise Senaru.";

/**
 * Nomor cadangan milik backend (`getCleanCsWhatsAppNumber()`), dipakai saat
 * `app_settings` kosong. Form inquiry TIDAK boleh dirender selama nomor CS
 * hanya nomor contoh ini — pertanyaannya akan dikirim ke nomor yang salah.
 */
const PLACEHOLDER_CS_NUMBER = "6281234567890";

const OFFICIAL_MAPS_URL = "https://maps.app.goo.gl/E5vjb4TYu3x9obSR9";
const OFFICIAL_MAPS_EMBED_URL =
  "https://maps.google.com/maps?q=-8.3013169,116.4080834&hl=id&z=16&output=embed";
const OFFICIAL_COORDINATES = "-8.3013169, 116.4080834";

export default async function ContactPage() {
  const [brand, user] = await Promise.all([getBrand(), getCurrentUser()]);
  const resolved = resolveBrand(brand);
  const csLink = whatsappLink(resolved, CS_DEFAULT_MESSAGE);
  const hasRealCsNumber =
    resolved.whatsappLink !== null &&
    resolved.whatsappLink !== PLACEHOLDER_CS_NUMBER;

  const crumbs = [
    { name: "Beranda", href: "/" },
    { name: "Toko Senaru", href: "/kontak" },
  ];

  const hasAnyContact =
    resolved.whatsapp !== null ||
    resolved.instagramUrl !== null ||
    resolved.tiktokUrl !== null ||
    resolved.threadsUrl !== null ||
    resolved.facebookUrl !== null;

  const socialChannels = [
    {
      name: "WhatsApp",
      href:
        csLink ??
        (resolved.whatsappLink
          ? `https://wa.me/${resolved.whatsappLink}`
          : "https://wa.me/6281234567890"),
      colorClass:
        "bg-[#25D366] hover:bg-[#20ba59] shadow-[#25D366]/25 focus-visible:ring-[#25D366]",
      icon: (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-6 w-6 fill-current"
        >
          <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01zm-7.01 15.24c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.06 0 1.21.89 2.39 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.48-.29z" />
        </svg>
      ),
    },
    {
      name: "Instagram",
      href: resolved.instagramUrl ?? "https://instagram.com/palorinjani",
      colorClass:
        "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-95 shadow-[#DD2A7B]/30 focus-visible:ring-[#DD2A7B]",
      icon: (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-6 w-6 fill-current"
        >
          <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.71-2.13 1.38A5.9 5.9 0 0 0 .63 4.14c-.3.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.71 1.46 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0Z" />
          <path d="M12 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
          <circle cx="18.41" cy="5.59" r="1.44" />
        </svg>
      ),
    },
    {
      name: "TikTok",
      href: resolved.tiktokUrl ?? "https://tiktok.com/@palorinjani",
      colorClass:
        "bg-[#000000] hover:bg-[#1a1a1a] shadow-black/20 focus-visible:ring-black",
      icon: (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-6 w-6 fill-current"
        >
          <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07Z" />
        </svg>
      ),
    },
    {
      name: "Threads",
      href: resolved.threadsUrl ?? "https://threads.net/@palorinjani",
      colorClass:
        "bg-[#000000] hover:bg-[#1a1a1a] shadow-black/20 focus-visible:ring-black",
      icon: (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-6 w-6 fill-current"
        >
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098c1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015c-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 9.166 3.59 12c.026 2.833.717 5.494 2.071 7.168c1.43 1.782 3.63 2.695 6.54 2.717c3.955-.028 6.471-1.465 7.427-4.485c.348-1.087.525-2.31.525-3.643v-1.399c-1.044.33-2.221.503-3.51.517c-4.455.048-7.575-1.507-7.575-4.757c0-2.483 1.956-4.14 5.06-4.14c2.148 0 3.754.764 4.636 2.208c.801 1.306 1.135 3.109 1.135 5.568v1.46c0 1.637-.258 3.098-.788 4.347c-1.218 2.87-4.095 4.368-8.146 4.398m-.104-14.502c1.783-.012 2.923.957 2.923 2.502c0 1.492-1.222 2.455-2.986 2.441c-1.745-.013-2.909-.972-2.909-2.454c0-1.528 1.185-2.476 2.972-2.489" />
        </svg>
      ),
    },
    {
      name: "Facebook",
      href: resolved.facebookUrl ?? "https://facebook.com/palorinjani",
      colorClass:
        "bg-[#1877F2] hover:bg-[#166fe5] shadow-[#1877F2]/25 focus-visible:ring-[#1877F2]",
      icon: (
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-6 w-6 fill-current"
        >
          <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.96h-1.51c-1.49 0-1.95.93-1.95 1.89v2.26h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07Z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {brand ? <JsonLd data={contactPageJsonLd(brand)} /> : null}

      <PageHeader
        eyebrow="Gerai basecamp Senaru"
        title="Toko & kanal kontak resmi"
        description="Ada pertanyaan soal produk atau pesananmu? Yuk, ngobrol langsung dengan tim kami!"
        breadcrumbs={crumbs}
      />

      <Container className="py-10 tablet:py-14">
        <div className="grid gap-8 tablet:grid-cols-12">
          {/* ---- Lokasi ---- */}
          <section className="tablet:col-span-6">
            <SectionHeading eyebrow="Lokasi" title="Alamat gerai" />

            <div className="mt-4 rounded-xl border border-border-soft bg-surface-white p-5">
              {/* Google Maps Embed Interaktif */}
              <iframe
                src={OFFICIAL_MAPS_EMBED_URL}
                title="Peta Lokasi PALO RINJANI Senaru"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[280px] w-full rounded-xl border border-border-soft tablet:h-[340px]"
              />

              <address className="mt-5 space-y-3 text-body-md not-italic text-text-secondary">
                <p className="font-semibold text-text-primary">
                  PALO RINJANI
                </p>
                <p>Senaru, Bayan, Lombok Utara, Nusa Tenggara Barat</p>
                <p>
                  <span className="font-semibold text-text-primary">
                    Koordinat:{" "}
                  </span>
                  {OFFICIAL_COORDINATES}
                </p>
                <p>
                  <span className="font-semibold text-text-primary">
                    Jam operasional:{" "}
                  </span>
                  {resolved.openingHours}
                </p>
              </address>

              <a
                href={OFFICIAL_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClass({
                  variant: "outline",
                  className: "mt-5 inline-flex items-center gap-2",
                })}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
                Buka di Google Maps
              </a>
            </div>

            <div className="mt-4 rounded-xl border border-border-soft bg-surface-white p-5">
              <h3 className="text-title-md text-text-primary">
                Kunjungi Basecamp Kami
              </h3>
              <p className="mt-2 text-body-sm leading-relaxed text-text-secondary">
                Basecamp kami di Senaru selalu terbuka untuk konsultasi perlengkapan dan persiapan pendakianmu ke Gunung Rinjani.
              </p>
              <p className="mt-3 text-body-sm leading-relaxed text-text-secondary">
                Lokasi resmi:{" "}
                <span className="font-medium text-text-primary">
                  PALO RINJANI · Senaru, Lombok Utara
                </span>
              </p>
            </div>
          </section>

          {/* ---- Kanal kontak ---- */}
          <section className="tablet:col-span-6">
            <SectionHeading
              eyebrow="Koneksi langsung"
              title="Kontak & Media Sosial"
              description="Pilih kontak yang paling nyaman buatmu. Tim kami siap membantu menjawab pertanyaan seputar produk dan pesanan."
            />

            <div className="mt-4 space-y-4">
              {/* WhatsApp CS Utama */}
              <div className="rounded-xl border border-border-soft bg-surface-white p-5">
                <h3 className="text-title-md text-brand-deep">
                  WhatsApp Customer Service
                </h3>
                {csLink ? (
                  <>
                    <p className="mt-2 text-title-lg font-semibold text-brand-forest">
                      {resolved.whatsapp}
                    </p>
                    <p className="mt-1 text-body-sm text-text-secondary">
                      Layanan chat responsif untuk konsultasi produk, ketersediaan stok, dan panduan pemesanan.
                    </p>
                    <a
                      href={csLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass({
                        className: "mt-4 inline-flex items-center gap-2",
                      })}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-5 w-5 fill-current"
                      >
                        <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01zm-7.01 15.24c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.196 8.196 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.83c.02 4.54-3.68 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.17-.25.25-.42.08-.17.04-.31-.02-.43s-.56-1.34-.76-1.84c-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.22.25-.86.84-.86 2.06 0 1.21.89 2.39 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.23-.17-.48-.29z" />
                      </svg>
                      Chat via WhatsApp
                    </a>
                  </>
                ) : (
                  <div className="mt-3">
                    <PlaceholderNotice
                      title="WhatsApp CS segera aktif"
                      body="Layanan chat via WhatsApp lagi kami siapkan. Yuk, ikuti media sosial kami atau cek kembali nanti, ya!"
                    />
                  </div>
                )}
              </div>

              {/* Media Sosial Resmi (Circular Horizontal, No Horizontal Scroll) */}
              <div className="rounded-xl border border-border-soft bg-surface-white p-5">
                <h3 className="text-title-md text-brand-deep">
                  Media Sosial Resmi
                </h3>
                <p className="mt-1 text-body-sm leading-relaxed text-text-secondary">
                  Ikuti kanal media sosial kami untuk kabar terbaru, rilis produk, dan informasi kegiatan di Senaru.
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-4">
                  {socialChannels.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`h-12 w-12 rounded-full flex items-center justify-center text-white transition-all duration-200 hover:scale-105 active:scale-95 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${item.colorClass}`}
                    >
                      {item.icon}
                      <span className="sr-only">{item.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {!hasAnyContact ? (
              <div className="mt-4">
                <PlaceholderNotice
                  title="Kanal kontak sedang dipersiapkan"
                  body="Informasi kontak resmi lagi kami persiapkan. Kamu tetap bisa menjelajahi katalog produk dan memesan perlengkapan favoritmu!"
                  variant="paper"
                />
              </div>
            ) : null}
          </section>
        </div>

        {/* ---- Inquiry grosir / ekspedisi (PRD §6A, audit baris 27) ---- */}
        <section id="inquiry" className="mt-10 scroll-mt-24">
          <div className="grid gap-8 desktop:grid-cols-12">
            <div className="desktop:col-span-5">
              <SectionHeading
                eyebrow="Pesanan partai"
                title="Ajukan pertanyaan grosir atau ekspedisi"
                description="Untuk pembelian dalam jumlah besar, kebutuhan ekspedisi, atau kerja sama reseller. Isi form ini, lalu lanjutkan ke WhatsApp Customer Service dengan pesan yang sudah tersusun."
              />
              <p className="mt-4 text-body-sm leading-relaxed text-text-secondary">
                Halaman ini tidak menjanjikan harga, ketersediaan, maupun
                tenggat. Semuanya dibicarakan langsung dengan Customer Service.
              </p>
            </div>

            <div className="desktop:col-span-7">
              {hasRealCsNumber ? (
                <InquiryForm defaultName={user?.name ?? ""} />
              ) : (
                <PlaceholderNotice
                  title="Layanan tanya jawab segera siap"
                  body="Fitur tanya jawab grosir dan ekspedisi lagi kami persiapkan. Hubungi tim kami langsung untuk info lebih lanjut ya!"
                  variant="paper"
                />
              )}
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 tablet:flex-row">
          <Link href="/produk" className={buttonClass({ size: "lg" })}>
            Lihat katalog
          </Link>
          <Link
            href="/lacak"
            className={buttonClass({ variant: "outline", size: "lg" })}
          >
            Lacak pesanan
          </Link>
        </div>
      </Container>
    </>
  );
}
