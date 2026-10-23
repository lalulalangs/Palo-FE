import type { ResolvedBrand } from "@/lib/brand";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";

interface MaintenanceScreenProps {
  brand: ResolvedBrand;
}

export function MaintenanceScreen({ brand }: MaintenanceScreenProps) {
  return (
    <div className="flex min-h-[calc(100vh-2rem)] flex-col justify-between py-12 tablet:py-24">
      <Container width="reading" className="flex flex-col items-center text-center">
        {/* Brand Logo Container */}
        <div className="mb-8 inline-flex rounded-xl bg-surface-white p-3.5 shadow-editorial border border-border-soft">
          <BrandLogo size={64} />
        </div>

        {/* Status Pill Badge */}
        <div className="mb-5">
          <Badge tone="brand" className="px-3 py-1 font-mono text-label-sm uppercase tracking-wider">
            System Status: Under Active Development
          </Badge>
        </div>

        {/* Technical & Explicit Headline */}
        <h1 className="font-headline text-display-mobile tablet:text-display-lg text-text-primary tracking-tight">
          Sistem Sedang Dalam Pengembangan
        </h1>

        {/* Technical & To-the-point Copywriting */}
        <div className="mt-6 max-w-xl text-left border border-border-soft bg-surface-white p-6 rounded-lg shadow-editorial">
          <p className="text-body-md text-text-primary leading-relaxed">
            Platform e-commerce dan integrasi layanan transaksi publik Palo Mountain Goods saat ini sedang dalam fase finalisasi sistem, konfigurasi payment gateway, dan sinkronisasi basis data inventaris.
          </p>
          <div className="mt-4 pt-4 border-t border-border-soft flex flex-col gap-2 font-mono text-caption text-text-secondary">
            <div>
              <span className="text-brand-forest font-semibold">● ENVIRONMENT:</span> PRODUCTION STABLE
            </div>
            <div>
              <span className="text-brand-forest font-semibold">● ACCESS RESTRICTION:</span> PUBLIC STOREFRONT DISABLED
            </div>
            <div>
              <span className="text-brand-forest font-semibold">● CORE SERVICES:</span> API V1 & ADMIN PANEL ONLINE
            </div>
          </div>
        </div>

        {/* Informasi Kontak Ringkas */}
        <p className="mt-8 text-body-sm text-text-secondary">
          Untuk keperluan mendesak atau verifikasi sistem, hubungi administrator via{" "}
          <span className="text-text-primary font-medium">
            {brand.email ?? "admin@palorinjani.com"}
          </span>
        </p>
      </Container>

      {/* Ground Note / Footer */}
      <footer className="mt-12 text-center font-mono text-caption text-text-secondary">
        <p>
          &copy; {new Date().getFullYear()} Palo Mountain Goods. All rights reserved.
        </p>
        <p className="mt-1 text-text-secondary/70">
          Senaru, Lombok Utara, Nusa Tenggara Barat
        </p>
      </footer>
    </div>
  );
}
