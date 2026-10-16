import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { Container } from "@/components/layout/Container";
import { PageHeader, SectionHeading } from "@/components/layout/PageHeader";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { buttonClass } from "@/components/ui/Button";
import { getBrand } from "@/lib/api";
import { resolveBrand, whatsappLink } from "@/lib/brand";
import { breadcrumbJsonLd, contactPageJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/metadata";
import { PLACEHOLDER_BRAND } from "@/lib/placeholders";

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
    "Informasi gerai dan kanal kontak resmi Palo Mountain Goods di Senaru, Lombok Utara. Alamat, nomor WhatsApp Customer Service, dan jam operasional dibaca dari panel admin.",
  path: "/kontak",
});

const CS_DEFAULT_MESSAGE = "Halo, saya ingin bertanya tentang merchandise Senaru.";

export default async function ContactPage() {
  const brand = await getBrand();
  const resolved = resolveBrand(brand);
  const csLink = whatsappLink(resolved, CS_DEFAULT_MESSAGE);

  const crumbs = [
    { name: "Beranda", href: "/" },
    { name: "Toko Senaru", href: "/kontak" },
  ];

  const hasAnyContact =
    resolved.whatsapp !== null ||
    resolved.email !== null ||
    resolved.instagramUrl !== null;

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {brand ? <JsonLd data={contactPageJsonLd(brand)} /> : null}

      <PageHeader
        eyebrow="Gerai basecamp Senaru"
        title="Toko & kanal kontak resmi"
        description="Semua data di halaman ini dibaca dari panel admin lewat GET /brand, sehingga dapat diperbarui tanpa deploy ulang. Nilai yang belum diisi ditandai apa adanya."
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
                  <span className="text-caption text-text-secondary">
                    Koordinat:{" "}
                  </span>
                  {resolved.coordinates}
                </p>
                <p>
                  <span className="text-caption text-text-secondary">
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
                    title="Tautan peta belum diisi"
                    body="Alamat lengkap dan tautan peta berasal dari panel admin. Selama belum diisi, halaman ini sengaja tidak menautkan peta mana pun agar tidak mengarahkan orang ke lokasi yang keliru."
                  />
                </div>
              )}
            </div>

            <div className="mt-4 rounded-lg border border-border-soft bg-surface-white p-5">
              <h3 className="text-title-md text-text-primary">
                Status data gerai
              </h3>
              <p className="mt-2 text-caption leading-relaxed text-text-secondary">
                {resolved.isApiBacked
                  ? "Data di atas berhasil dibaca dari server. Nilai yang masih berupa placeholder berarti admin belum mengisinya."
                  : "Server belum dapat dihubungi, jadi seluruh data gerai di halaman ini ditampilkan sebagai placeholder."}
              </p>
              <p className="mt-3 text-caption leading-relaxed text-text-secondary">
                Nama brand resmi:{" "}
                <code className="rounded-sm bg-surface-sage px-1 py-0.5">
                  {PLACEHOLDER_BRAND.brandName}
                </code>
              </p>
            </div>
          </section>

          {/* ---- Kanal kontak ---- */}
          <section className="tablet:col-span-6">
            <SectionHeading
              eyebrow="Koneksi langsung"
              title="Kanal kontak"
              description="Pilih kanal yang paling sesuai. Nomor WhatsApp dan email sengaja tidak ditulis langsung di kode agar bisa diubah dari panel admin."
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
                      title="Nomor belum diisi"
                      body="Nomor CS dikonfigurasi dari panel admin (PRD §3.11). Selama kosong, halaman ini tidak menampilkan nomor telepon dan tidak menautkan ke WhatsApp mana pun."
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
                      title="Alamat email belum diisi"
                      body="Alamat email resmi diisi dari panel admin. Selama kosong, halaman ini tidak menampilkan alamat surel karangan."
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
                      title="Akun belum diisi"
                      body="Tautan Instagram diisi dari panel admin. Mockup lama menuliskan handle langsung di HTML, sehingga tautan itu akan rusak begitu brand mengganti akun."
                    />
                  </div>
                )}
              </div>
            </div>

            {!hasAnyContact ? (
              <div className="mt-4">
                <PlaceholderNotice
                  title="Belum ada kanal kontak aktif"
                  body="Admin belum mengisi nomor WhatsApp, email, maupun Instagram. Sementara itu, pembeli tetap bisa memesan lewat halaman katalog dan menyelesaikan pesanan lewat WhatsApp dari nomor yang diberikan admin secara langsung."
                  variant="paper"
                />
              </div>
            ) : null}
          </section>
        </div>

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
