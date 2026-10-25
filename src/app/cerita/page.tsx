import type { Metadata } from "next";
import Link from "next/link";

import { JsonLd } from "@/components/JsonLd";
import { Container } from "@/components/layout/Container";
import { PageHeader, SectionHeading } from "@/components/layout/PageHeader";
import { PlaceholderNotice } from "@/components/PlaceholderNotice";
import { buttonClass } from "@/components/ui/Button";
import { getBrand, getProducts } from "@/lib/api";
import { PER_PAGE } from "@/lib/catalog-query";
import { resolveBrand, whatsappLink } from "@/lib/brand";
import { breadcrumbJsonLd } from "@/lib/jsonld";
import { buildMetadata } from "@/lib/metadata";

/**
 * Cerita Palo.
 *
 * Ini halaman brand story, bukan halaman katalog. Pembedaan itu menentukan apa
 * yang boleh ditulis di sini:
 *
 * 1. **Nilai dan asal brand boleh diceritakan.** Narasi tentang Senaru, Rinjani,
 *    dan hutan Lombok sudah disetujui sebagai positioning (PRD §1.1).
 * 2. **Spesifikasi produk tidak boleh dikarang.** Mockup asli memuat klaim
 *    seperti "katun combed organik 220 GSM", "teknik sablon discharge",
 *    "kemasan berbasis singkong biodegradabel", dan linimasa tahun 2021/2023/2024
 *    yang semuanya tidak terverifikasi dari sumber publik (PRD §1.1A). Semua
 *    klaim itu dibuang; yang tersisa adalah prinsip kerja, bukan angka.
 * 3. **Tidak ada satu pun gambar hardcode.** Mockup memakai URL
 *    `lh3.googleusercontent.com` milik Stitch yang tidak berlaku di produksi dan
 *    tidak punya hak penggunaan yang bisa dipertanggungjawabkan. Halaman ini
 *    hanya memakai tipografi dan warna token.
 */
export const metadata: Metadata = buildMetadata({
  title: "Cerita Palo",
  description:
    "Asal-usul Palo Mountain Goods (PALORINJANI): merchandise penjelajahan yang dirancang di Senaru, kaki Gunung Rinjani, Lombok Utara. Prinsip kerja dan nilai yang dipegang, tanpa klaim produk yang belum terverifikasi.",
  path: "/cerita",
});

const PRINSIP = [
  {
    number: "01",
    title: "Menghormati tempat, bukan mengalahkannya",
    body: "Setiap keputusan desain berangkat dari penghormatan pada lanskap Senaru: udara dingin di sekitar kawah Segara Anak, kabut yang turun cepat di lereng, dan ritme kerja warga yang mengikuti cuaca. Yang kami rancang adalah barang yang dipakai berulang di kondisi nyata, bukan barang yang hanya terlihat rapi di studio foto.",
  },
  {
    number: "02",
    title: "Transparansi tentang apa yang belum diketahui",
    body: "Spesifikasi bahan, berat, metode cetak, dan harga belum dapat dipastikan dari sumber publik yang terakses (PRD §1.1A). Karena itu halaman katalog menampilkan nilai placeholder apa adanya sampai admin mengisi data asli, bukan contoh produk yang terlihat meyakinkan padahal tidak ada.",
  },
  {
    number: "03",
    title: "Dua jalur pemesanan, tanpa memaksa",
    body: "Pembeli yang sudah punya akun bisa membayar lewat payment gateway resmi. Pembeli yang belum punya akun tetap bisa memesan: pesanannya tercatat di sistem dan pembayaran (VA/QRIS) disepakati lewat WhatsApp Customer Service, lalu diverifikasi admin sebelum dikirim.",
  },
] as const;

export default async function StoryPage() {
  const [brand, catalog] = await Promise.all([
    getBrand(),
    getProducts({
      q: null,
      category: null,
      minPrice: null,
      maxPrice: null,
      sort: "latest",
      inStock: false,
      page: 1,
      perPage: PER_PAGE,
    }),
  ]);

  const resolved = resolveBrand(brand);
  const csLink = whatsappLink(
    resolved,
    `Halo ${resolved.brandName}, saya membaca Cerita Palo dan ingin bertanya lebih lanjut.`,
  );

  const crumbs = [
    { name: "Beranda", href: "/" },
    { name: "Cerita Palo", href: "/cerita" },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <PageHeader
        eyebrow="Cerita Palo dari kaki Gunung Rinjani"
        title="Lahir dari hening jalur pendakian Senaru."
        description={resolved.tagline}
        breadcrumbs={crumbs}
      />

      <Container className="py-10 tablet:py-14">
        <div className="grid gap-10 tablet:grid-cols-12">
          <div className="tablet:col-span-7">
            <div className="max-w-2xl space-y-5 text-body-lg leading-relaxed text-text-secondary">
              <p>
                Palo Mountain Goods tidak berdiri di ruang kerja yang steril.
                Namanya diambil dari lembah Senaru, dan seluruh arah
                kerjasanya diarahkan ke satu hal: barang yang dipakai di
                lapangan harus bisa bertahan lebih lama daripada barang yang
                hanya dipakai untuk potret.              </p>
              <p>
                Kami rutin berada di jalur yang sama: naik menuju kawah, lalu
                turun kembali ke warung di basecamp. Keputusan kecil, seperti
                memakai label yang jujur atau menuliskan harga tanpa diskon
                palsu, langsung terasa di lapangan. Itu yang ingin kami bawa ke
                katalog: hal kecil yang terasa saat dipakai.
              </p>
              <p>
                Karena brand ini masih muda, kami memilih tidak pernah
                mengisi kekosongan dengan dugaan. Kalau datanya belum ada,
                halaman ini menuliskannya sebagai belum ada.
              </p>
            </div>

            <blockquote className="mt-8 border-l-2 border-brand-forest pl-5">
              <p className="font-headline text-headline-sm italic text-text-primary">
                &ldquo;Di gunung, kita tidak menaklukkan puncak; kita belajar
                melangkah pelan dan mendengarkan.&rdquo;
              </p>
              <footer className="mt-2 text-caption text-text-secondary">
                Catatan penjelajah, jalur Senaru.
              </footer>
            </blockquote>
          </div>

          <aside className="tablet:col-span-5">
            <div className="rounded-lg border border-border-soft bg-surface-white p-5">
              <h2 className="text-title-lg text-brand-deep">Identitas brand</h2>
              <dl className="mt-3 divide-y divide-border-soft text-caption">
                <div className="flex flex-wrap gap-x-2 py-2">
                  <dt className="text-text-secondary">Nama brand</dt>
                  <dd className="font-medium text-text-primary">
                    {resolved.brandName}
                  </dd>
                </div>
                <div className="flex flex-wrap gap-x-2 py-2">
                  <dt className="text-text-secondary">Badan hukum</dt>
                  <dd className="font-medium text-text-primary">
                    PALORINJANI
                  </dd>
                </div>
                <div className="flex flex-wrap gap-x-2 py-2">
                  <dt className="text-text-secondary">Asal</dt>
                  <dd className="font-medium text-text-primary">
                    Senaru, Lombok Utara, Nusa Tenggara Barat
                  </dd>
                </div>
                {resolved.about ? (
                  <div className="py-2">
                    <dt className="text-text-secondary">Tentang brand</dt>
                    <dd className="mt-1 leading-relaxed text-text-primary">
                      {resolved.about}
                    </dd>
                  </div>
                ) : null}
              </dl>
              <p className="mt-3 text-caption leading-relaxed text-text-secondary">
                Data di atas dibaca dari panel admin lewat{" "}
                <code className="rounded-sm bg-surface-sage px-1 py-0.5">
                  GET /brand
                </code>{" "}
                sehingga dapat diperbarui tanpa deploy ulang.
              </p>
            </div>
          </aside>
        </div>
      </Container>

      <section className="border-y border-border-soft bg-surface-white py-12 tablet:py-16">
        <Container>
          <SectionHeading
            eyebrow="Standar karya"
            title="Etos pembuatan"
            description="Tiga pegangan yang menentukan bagaimana katalog ini dikelola sampai detail teknisnya benar-benar terverifikasi."
          />

          <ul className="mt-8 space-y-6">
            {PRINSIP.map((item) => (
              <li
                key={item.number}
                className="border-l-2 border-brand-forest pl-5"
              >
                <p className="inline-flex items-center rounded-full bg-surface-sage px-2.5 py-0.5 text-caption font-semibold text-brand-forest">
                  {item.number}
                </p>
                <h3 className="mt-2 text-title-lg text-text-primary">
                  {item.title}
                </h3>
                <p className="mt-2 max-w-3xl text-body-md leading-relaxed text-text-secondary">
                  {item.body}
                </p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="py-12 tablet:py-16">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-caption uppercase tracking-widest text-accent-earth">
              Siap menemani tapak Anda
            </p>
            <h2 className="mt-3 text-headline-sm text-text-primary tablet:text-headline-md">
              Jelajahi katalog yang sedang diterbitkan
            </h2>
            <p className="mt-3 text-body-lg text-text-secondary">
              {catalog && catalog.products.length > 0
                ? `${catalog.products.length} produk sudah aktif di katalog.`
                : "Katalog resmi belum dipublikasikan. Admin harus mengisi data produk terlebih dahulu."}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 tablet:flex-row">
              <Link href="/produk" className={buttonClass({ size: "lg" })}>
                Lihat katalog
              </Link>
              {csLink ? (
                <a
                  href={csLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass({ variant: "outline", size: "lg" })}
                >
                  Tanya lewat WhatsApp
                </a>
              ) : null}
            </div>

            {!csLink ? (
              <div className="mt-6 text-left">
                <PlaceholderNotice
                  title="Nomor Customer Service belum diisi"
                  body="Nomor WhatsApp CS dikonfigurasi dari panel admin (PRD §3.11) supaya bisa diganti tanpa deploy ulang. Selama belum diisi, halaman ini tidak menampilkan nomor telepon."
                />
              </div>
            ) : null}
          </div>
        </Container>
      </section>
    </>
  );
}
