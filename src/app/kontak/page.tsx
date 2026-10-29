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
 * Ini halaman yang paling banyak berisi klaim hardcode di mockup lama, dan
 * sebagian besar dihapus:
 *
 * 1. **Nomor telepon `+62 812-3456-7890` dihapus.** PRD §3.11 menyatakan nomor
 *    CS harus datang dari `app_settings` supaya admin bisa menggantinya tanpa
 *    deploy ulang. Selama `GET /brand` belum mengirimnya, halaman ini
 *    menampilkan placeholder dan TIDAK merender tautan `wa.me` yang kosong.
 * 2. **Lima versi jam operasional dihapus.** OD-05 masih `DITUNDA`;
 *    system_map §4.1.4 melarang jam buka dan pickup diaktifkan sebelum
 *    kebijakan pemilik dikonfirmasi. Yang tampil hanya nilai dari backend, atau
 *    catatan bahwa kebijakan belum dikonfirmasi.
 * 3. **Kebijakan "Ambil di Gerai" dihapus.** OD-05 masih `DITUNDA`. Memajukannya
 *    berarti mengiklankan layanan yang belum diputuskan.
 * 4. **Alamat, koordinat, dan klaim fasilitas dihapus.** "Penimbangan Ransel",
 *    "Air Isi Ulang", "Ruang Istirahat" adalah klaim operasional yang belum
 *    dikonfirmasi. Yang tampil hanya apa yang dikirim panel admin.
 * 5. **Peta ilustratif dihapus.** Peta di mockup adalah gambar Googleusercontent
 *    yang tidak berlaku di produksi dan bukan peta sebenarnya. Tanpa
 *    `store_maps_url` dari admin, halaman ini menampilkan peta sebagai catatan
 *    teks, bukan gambar yang membuat orang percaya lokasi sudah pasti.
 */
export const metadata: Metadata = buildMetadata({
  title: "Toko Senaru & Kontak",
  description:
    "Informasi gerai dan kanal kontak resmi Palo Mountain Goods di Senaru, Lombok Utara. Hubungi kami via WhatsApp, email, atau kunjungi langsung basecamp kami.",
  path: "/kontak",
});

const CS_DEFAULT_MESSAGE = "Halo, saya ingin bertanya tentang merchandise Senaru.";

/**
 * Nomor cadangan milik backend (`getCleanCsWhatsAppNumber()`), dipakai saat
 * `app_settings` kosong. Form inquiry TIDAK boleh dirender selama nomor CS
 * hanya nomor contoh ini — pertanyaannya akan dikirim ke nomor yang salah.
 */
const PLACEHOLDER_CS_NUMBER = "6281234567890";

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
    resolved.email !== null ||
    resolved.instagramUrl !== null ||
    resolved.tiktokUrl !== null ||
    resolved.threadsUrl !== null ||
    resolved.facebookUrl !== null;

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
            <SectionHeading
              eyebrow="Lokasi"
              title="Alamat gerai"
            />

            <div className="mt-4 rounded-lg border border-border-soft bg-surface-white p-5">
              <address className="space-y-3 text-body-md not-italic text-text-secondary">
                <p className="font-semibold text-text-primary">
                  {resolved.brandName}
                </p>
                <p>{resolved.address}</p>
                <p>
                  <span className="font-semibold text-text-primary">
                    Koordinat:{" "}
                  </span>
                  {resolved.coordinates}
                </p>
                <p>
                  <span className="font-semibold text-text-primary">
                    Jam operasional:{" "}
                  </span>
                  {resolved.openingHours}
                </p>
              </address>

              {/*
                OD-05 masih DITUNDA. Blok ini sengaja TIDAK ada, dan memang
                tidak akan ada sampai kebijakan pemilik dikonfirmasi.
              */}

              {resolved.mapsUrl ? (
                <a
                  href={resolved.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass({ variant: "outline", className: "mt-5" })}
                >
                  Buka di peta
                </a>
              ) : (
                <div className="mt-5">
                  <PlaceholderNotice
                    title="Info lokasi peta lagi disiapkan"
                    body="Detail peta digital lagi kami siapkan, ya. Kalau butuh panduan rute ke gerai, kamu bisa langsung hubungi tim kami!"
                  />
                </div>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-border-soft bg-surface-white p-5">
              <h3 className="text-title-md text-text-primary">
                Kunjungi Basecamp Kami
              </h3>
              <p className="mt-2 text-body-sm leading-relaxed text-text-secondary">
                Basecamp kami di Senaru selalu terbuka untuk konsultasi perlengkapan dan persiapan pendakianmu ke Gunung Rinjani.
              </p>
              <p className="mt-3 text-body-sm leading-relaxed text-text-secondary">
                Lokasi resmi:{" "}
                <span className="font-medium text-text-primary">
                  {resolved.brandName} · Senaru, Lombok Utara
                </span>
              </p>
            </div>
          </section>

          {/* ---- Kanal kontak ---- */}
          <section className="tablet:col-span-6">
            <SectionHeading
              eyebrow="Koneksi langsung"
              title="kontak"
              description="Pilih kontak yang paling nyaman buatmu. Tim kami siap membantu menjawab pertanyaan seputar produk dan pesanan."
            />

            <div className="mt-4 space-y-4">
              {/*
                WhatsApp CS. Kalau nomornya belum diisi, kartu ini
                menggantinya dengan penjelasan, BUKAN tautan ke nomor
                hardcode.
              */}
              <div className="rounded-lg border border-border-soft bg-surface-white p-5">
                <h3 className="text-title-md text-brand-deep">
                  WhatsApp Customer Service
                </h3>
                {csLink ? (
                  <>
                    <p className="mt-2 text-title-lg font-semibold text-brand-forest">
                      {resolved.whatsapp}
                    </p>
                    <a
                      href={csLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass({ className: "mt-4" })}
                    >
                      Chat via WhatsApp
                    </a>
                  </>
                ) : (
                  <div className="mt-3">
                    <PlaceholderNotice
                      title="WhatsApp CS segera aktif"
                      body="Layanan chat via WhatsApp lagi kami siapkan. Yuk, hubungi kami via email atau cek kembali nanti, ya!"
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border-soft bg-surface-white p-5">
                <h3 className="text-title-md text-brand-deep">Email</h3>
                {resolved.email ? (
                  <>
                    <p className="mt-2 break-words text-body-md text-text-primary">
                      {resolved.email}
                    </p>
                    <a
                      href={`mailto:${resolved.email}`}
                      className={buttonClass({ variant: "outline", className: "mt-4" })}
                    >
                      Kirim surel
                    </a>
                  </>
                ) : (
                  <div className="mt-3">
                    <PlaceholderNotice
                      title="Email kontak segera hadir"
                      body="Kanal email resmi lagi dipersiapkan untuk melayani pertanyaanmu dengan lebih baik."
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-border-soft bg-surface-white p-5">
                <h3 className="text-title-md text-brand-deep">Instagram</h3>
                {resolved.instagramUrl ? (
                  <>
                    <p className="mt-2 text-body-md text-text-primary">
                      {resolved.instagramHandle ?? resolved.instagramUrl}
                    </p>
                    <a
                      href={resolved.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass({ variant: "outline", className: "mt-4" })}
                    >
                      Buka Instagram
                    </a>
                  </>
                ) : (
                  <div className="mt-3">
                    <PlaceholderNotice
                      title="Instagram segera hadir"
                      body="Keseruan petualangan dan update produk terbaru di Instagram bakal segera hadir buat kamu!"
                    />
                  </div>
                )}
              </div>

              {resolved.tiktokUrl ? (
                <div className="rounded-lg border border-border-soft bg-surface-white p-5">
                  <h3 className="text-title-md text-brand-deep">TikTok</h3>
                  <p className="mt-2 text-body-md text-text-primary">
                    {resolved.tiktokUrl}
                  </p>
                  <a
                    href={resolved.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass({ variant: "outline", className: "mt-4" })}
                  >
                    Buka TikTok
                  </a>
                </div>
              ) : null}

              {resolved.threadsUrl ? (
                <div className="rounded-lg border border-border-soft bg-surface-white p-5">
                  <h3 className="text-title-md text-brand-deep">Threads</h3>
                  <p className="mt-2 text-body-md text-text-primary">
                    {resolved.threadsHandle ?? resolved.threadsUrl}
                  </p>
                  <a
                    href={resolved.threadsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass({ variant: "outline", className: "mt-4" })}
                  >
                    Buka Threads
                  </a>
                </div>
              ) : null}

              {resolved.facebookUrl ? (
                <div className="rounded-lg border border-border-soft bg-surface-white p-5">
                  <h3 className="text-title-md text-brand-deep">Facebook</h3>
                  <p className="mt-2 text-body-md text-text-primary">
                    {resolved.facebookUrl}
                  </p>
                  <a
                    href={resolved.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass({ variant: "outline", className: "mt-4" })}
                  >
                    Buka Facebook
                  </a>
                </div>
              ) : null}
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
