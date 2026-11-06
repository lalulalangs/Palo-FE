import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { InquiryForm } from "@/components/checkout/InquiryForm";
import { Container } from "@/components/layout/Container";
import { PageHeader, SectionHeading } from "@/components/layout/PageHeader";
import { SocialIcon, type SocialNetwork } from "@/components/layout/SocialIcon";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { buttonClass } from "@/components/ui/Button";
import { getBrand, getCurrentUser } from "@/lib/api";
import { resolveBrand, whatsappLink } from "@/lib/brand";
import {
  breadcrumbJsonLd,
  contactPageJsonLd,
  storeJsonLd,
} from "@/lib/jsonld";
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

  const socialChannels: Array<{
    name: string;
    network: SocialNetwork;
    href: string;
    colorClass: string;
  }> = [
    {
      name: "WhatsApp",
      network: "whatsapp",
      href:
        csLink ??
        (resolved.whatsappLink
          ? `https://wa.me/${resolved.whatsappLink}`
          : "https://wa.me/6281234567890"),
      colorClass:
        "bg-[#25D366] hover:bg-[#20ba59] shadow-[#25D366]/25 focus-visible:ring-[#25D366]",
    },
    {
      name: "Instagram",
      network: "instagram",
      href: resolved.instagramUrl ?? "https://instagram.com/palorinjani",
      colorClass:
        "bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] hover:opacity-95 shadow-[#DD2A7B]/30 focus-visible:ring-[#DD2A7B]",
    },
    {
      name: "TikTok",
      network: "tiktok",
      href: resolved.tiktokUrl ?? "https://tiktok.com/@palorinjani",
      colorClass:
        "bg-[#000000] hover:bg-[#1a1a1a] shadow-black/20 focus-visible:ring-black",
    },
    {
      name: "Threads",
      network: "threads",
      href: resolved.threadsUrl ?? "https://threads.net/@palorinjani",
      colorClass:
        "bg-[#000000] hover:bg-[#1a1a1a] shadow-black/20 focus-visible:ring-black",
    },
    {
      name: "Facebook",
      network: "facebook",
      href: resolved.facebookUrl ?? "https://facebook.com/palorinjani",
      colorClass:
        "bg-[#1877F2] hover:bg-[#166fe5] shadow-[#1877F2]/25 focus-visible:ring-[#1877F2]",
    },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {brand ? <JsonLd data={contactPageJsonLd(brand)} /> : null}
      {brand ? <JsonLd data={storeJsonLd(brand)} /> : null}

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

            <div className="mt-4 border border-border-soft bg-surface-white p-5">
              {/* Google Maps Embed Interaktif */}
              <iframe
                src={OFFICIAL_MAPS_EMBED_URL}
                title="Peta Lokasi PALO RINJANI Senaru"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-[280px] w-full border border-border-soft tablet:h-[340px]"
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

            <div className="mt-4 border border-border-soft bg-surface-white p-5">
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
              <div className="border border-border-soft bg-surface-white p-5">
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
                      <SocialIcon network="whatsapp" className="h-5 w-5" />
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
              <div className="border border-border-soft bg-surface-white p-5">
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
                      <SocialIcon network={item.network} className="h-6 w-6" />
                      <span className="sr-only">{item.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
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
