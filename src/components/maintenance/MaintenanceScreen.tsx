import type { ResolvedBrand } from "@/lib/brand";
import { whatsappLink } from "@/lib/brand";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { LineIcon } from "@/components/ui/LineIcon";
import { SocialIcon } from "@/components/layout/SocialIcon";

interface MaintenanceScreenProps {
  brand: ResolvedBrand;
}

export function MaintenanceScreen({ brand }: MaintenanceScreenProps) {
  // Pesan default yang ramah jika pengunjung menghubungi via WhatsApp
  const waUrl = whatsappLink(
    brand,
    "Halo Palo Mountain Goods, saya ingin menanyakan informasi produk / pemesanan manual.",
  );

  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col justify-between py-8 tablet:py-16">
      <Container width="reading" className="flex flex-col items-center text-center">
        {/* Topographic location stamp */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border-soft bg-surface-white px-3.5 py-1.5 text-caption tracking-widest text-text-secondary uppercase">
          <LineIcon name="mountain" className="size-3.5 text-brand-forest" />
          <span>Senaru / 601 MDPL — Lombok Utara</span>
        </div>

        {/* Brand Logo Container */}
        <div className="mt-8 mb-6 inline-flex rounded-xl bg-surface-white p-3 shadow-editorial">
          <BrandLogo size={64} />
        </div>

        {/* Status Pill Badge */}
        <div className="mb-4">
          <Badge tone="brand" className="px-3.5 py-1 text-label-sm">
            Tahap Pengembangan — Segera Hadir
          </Badge>
        </div>

        {/* Editorial Headline */}
        <h1 className="font-headline text-display-mobile tablet:text-display-lg text-text-primary tracking-tight">
          Etalase Digital Sedang Disiapkan
        </h1>

        {/* Editorial Subtitle */}
        <p className="mt-4 max-w-xl text-body-md tablet:text-body-lg text-text-secondary leading-relaxed">
          Kami sedang meracik perlengkapan luar ruang berstandar ketahanan tinggi,
          pakaian teknis gunung, dan komoditas kopi khas lereng Gunung Rinjani
          untuk memberikan pengalaman belanja terbaik bagi petualangan Anda.
        </p>

        {/* 3 Pillar Feature Cards */}
        <div className="mt-10 grid w-full gap-4 text-left tablet:grid-cols-3">
          <div className="rounded-lg border border-border-soft bg-surface-white p-5 shadow-editorial">
            <div className="mb-3 inline-flex size-9 items-center justify-center rounded-md bg-surface-sage text-brand-forest">
              <LineIcon name="compass" className="size-5" />
            </div>
            <h2 className="font-headline text-title-sm text-text-primary">
              Perlengkapan Gunung
            </h2>
            <p className="mt-1.5 text-body-sm text-text-secondary leading-normal">
              Apparel teknis dan ransel penjelajahan yang diuji ketangguhannya di medan Rinjani.
            </p>
          </div>

          <div className="rounded-lg border border-border-soft bg-surface-white p-5 shadow-editorial">
            <div className="mb-3 inline-flex size-9 items-center justify-center rounded-md bg-surface-sage text-brand-forest">
              <LineIcon name="leaf" className="size-5" />
            </div>
            <h2 className="font-headline text-title-sm text-text-primary">
              Kopi Lereng Rinjani
            </h2>
            <p className="mt-1.5 text-body-sm text-text-secondary leading-normal">
              Biji kopi arabika & robusta pilihan yang dipetik langsung dari kebun Sembalun dan Senaru.
            </p>
          </div>

          <div className="rounded-lg border border-border-soft bg-surface-white p-5 shadow-editorial">
            <div className="mb-3 inline-flex size-9 items-center justify-center rounded-md bg-surface-sage text-brand-forest">
              <LineIcon name="chat" className="size-5" />
            </div>
            <h2 className="font-headline text-title-sm text-text-primary">
              Pemesanan Manual
            </h2>
            <p className="mt-1.5 text-body-sm text-text-secondary leading-normal">
              Tetap melayani pertanyaan, kolaborasi, dan pesanan manual via WhatsApp Customer Service.
            </p>
          </div>
        </div>

        {/* Direct Action Call to Action */}
        <div className="mt-10 flex flex-col items-center gap-3 w-full tablet:w-auto tablet:flex-row">
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({
                variant: "primary",
                size: "lg",
                className: "w-full tablet:w-auto shadow-editorial",
              })}
            >
              <SocialIcon network="whatsapp" className="size-5" />
              <span>Hubungi CS via WhatsApp</span>
            </a>
          ) : (
            <span
              className={buttonClass({
                variant: "primary",
                size: "lg",
                className: "w-full tablet:w-auto opacity-75 cursor-not-allowed",
              })}
            >
              <SocialIcon network="whatsapp" className="size-5" />
              <span>WhatsApp Menunggu Konfirmasi</span>
            </span>
          )}

          {brand.instagramUrl && (
            <a
              href={brand.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass({
                variant: "outline",
                size: "lg",
                className: "w-full tablet:w-auto",
              })}
            >
              <SocialIcon network="instagram" className="size-5" />
              <span>Ikuti Instagram Kami</span>
            </a>
          )}
        </div>
      </Container>

      {/* Ground Note / Footer */}
      <footer className="mt-12 text-center text-caption text-text-secondary">
        <p>
          &copy; {new Date().getFullYear()} Palo Mountain Goods. All rights reserved.
        </p>
        <p className="mt-1 text-text-secondary/80">
          Senaru, Bayan, Kabupaten Lombok Utara, Nusa Tenggara Barat
        </p>
      </footer>
    </div>
  );
}
