import type { Metadata } from "next";
import { getBrand } from "@/lib/api";
import { resolveBrand } from "@/lib/brand";
import { MaintenanceScreen } from "@/components/maintenance/MaintenanceScreen";

export const metadata: Metadata = {
  title: "Sedang Dalam Pemeliharaan — Palo Mountain Goods",
  description:
    "Etalase digital Palo Mountain Goods sedang dalam persiapan peningkatan sistem. Koleksi pakaian dan merchandise lereng Gunung Rinjani.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MaintenancePage() {
  const brand = await getBrand();

  return <MaintenanceScreen brand={resolveBrand(brand)} />;
}
