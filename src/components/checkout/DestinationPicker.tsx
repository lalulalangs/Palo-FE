"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { searchDestinationsAction } from "@/actions/checkout";
import { buttonClass } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LineIcon } from "@/components/ui/LineIcon";
import { isActionError, type ActionError } from "@/lib/action-result";
import { titleCase } from "@/lib/checkout-form";
import type { ShippingDestination } from "@/lib/types";

/**
 * Pemilih wilayah tujuan (`docs/SPEC-ALAMAT-25102026.md` §3).
 *
 * Mengakomodasi arsitektur Master Cache Database Lokal (Zero-HIT, < 15ms).
 *
 * Optimasi performa & UX:
 * 1. Debounce responsif 300 ms (kecepatan database lokal tanpa jitter),
 * 2. Quick suggestion chips untuk destinasi populer (Senaru, Bayan, Mataram, dll.),
 * 3. Cache sesi di memori — kata kunci yang sama tidak pernah diulang,
 * 4. Batas kueri minimal 3 karakter untuk akurasi pencarian,
 * 5. Respons usang dibuang lewat penanda `requestId`.
 */

const MIN_CHARS = 3;
const DEBOUNCE_MS = 300;

const SEARCH_ID = "destination_search";
const RESULT_ID = "destination_search-result";

const HINT =
  "Ketik minimal 3 karakter kecamatan, kota, atau kode pos (misal: Senaru, Gambir, atau 83354).";
const SHORT_HINT = "Ketik 1 karakter lagi untuk mulai mencari.";
const EMPTY_HINT = "Coba nama kecamatan lain, kota terdekat, atau kode pos.";
const NETWORK_COPY =
  "Pencarian wilayah belum bisa dilakukan karena layanan sedang tidak dapat dihubungi.";
const UNAVAILABLE_COPY =
  "Coba lagi beberapa menit lagi. Kalau tetap gagal, hubungi Customer Service.";

const POPULAR_DESTINATIONS = [
  "Senaru",
  "Bayan",
  "Mataram",
  "Jakarta Pusat",
  "Denpasar",
  "Surabaya",
] as const;

type Status = "idle" | "loading" | "results" | "empty" | "error";

/** Nilai wilayah yang tersimpan di form — sumber kebenaran tunggal pilihan. */
export interface PickedDestination {
  destination_id: number;
  district: string | null;
  subdistrict: string | null;
  city: string;
  province: string;
  postal_code: string | null;
}

export function DestinationPicker({
  picked,
  error,
  disabled = false,
  onSelect,
}: {
  picked: PickedDestination;
  /** Galat validasi `readAddress` atau 422 alamat dari server. */
  error?: string | null;
  disabled?: boolean;
  /** `null` = pilihan dilepas ("Ganti wilayah"). */
  onSelect: (destination: ShippingDestination | null) => void;
}) {
  const hasSelection = picked.destination_id > 0;

  const [showSearch, setShowSearch] = useState(!hasSelection);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [results, setResults] = useState<ShippingDestination[]>([]);
  const [searched, setSearched] = useState("");
  const [failure, setFailure] = useState<ActionError | null>(null);

  const cache = useRef(new Map<string, ShippingDestination[]>());
  // Penanda respons usang: dinaikkan setiap kueri berubah.
  const latest = useRef(0);
  const pendingFocus = useRef<"search" | "change" | null>(null);
  const changeRef = useRef<HTMLButtonElement | null>(null);

  const runSearch = useCallback(async (raw: string) => {
    const keyword = raw.trim();
    if (keyword.length < MIN_CHARS) return;

    const key = keyword.toLowerCase();
    const cached = cache.current.get(key);
    if (cached) {
      setSearched(keyword);
      setFailure(null);
      setResults(cached);
      setStatus(cached.length > 0 ? "results" : "empty");
      return;
    }

    const requestId = latest.current;
    setSearched(keyword);
    setFailure(null);
    // Hasil lama dikosongkan: tidak boleh ada baris kueri lama di bawah kueri baru.
    setResults([]);
    setStatus("loading");

    const result = await searchDestinationsAction(keyword);
    if (requestId !== latest.current) return;

    if (isActionError(result)) {
      setFailure(result);
      setStatus("error");
      return;
    }

    cache.current.set(key, result.destinations);
    setResults(result.destinations);
    setStatus(result.destinations.length > 0 ? "results" : "empty");
  }, []);

  // Jeda setelah ketukan terakhir; kueri yang sudah punya cache tampil seketika (0 HIT).
  useEffect(() => {
    if (!showSearch) return;

    latest.current += 1;
    const keyword = query.trim();

    // Di bawah 3 karakter: tidak ada request dan tidak ada state yang diubah.
    // Status "idle" diturunkan saat render (`visibleStatus`), bukan di-set di sini.
    if (keyword.length < MIN_CHARS) return;

    const run = () => {
      void runSearch(keyword);
    };

    if (cache.current.has(keyword.toLowerCase())) {
      run();
      return;
    }

    const timer = setTimeout(run, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query, showSearch, runSearch]);

  // Tombol/field yang baru saja ditekan bisa hilang dari DOM; fokus dipindahkan
  // ke elemen penggantinya — TANPA mencuri fokus saat komponen pertama dirender.
  useEffect(() => {
    const target = pendingFocus.current;
    if (!target) return;
    pendingFocus.current = null;

    if (target === "search") document.getElementById(SEARCH_ID)?.focus();
    else changeRef.current?.focus();
  }, [showSearch]);

  function choose(destination: ShippingDestination) {
    pendingFocus.current = "change";
    onSelect(destination);
    setShowSearch(false);
  }

  function edit() {
    pendingFocus.current = "search";
    // Pilihan dilepas supaya tidak ada `destination_id` lama yang tak terlihat
    // di layar: submit tanpa memilih akan ditolak validasi, bukan memakai
    // wilayah yang sudah diganti.
    onSelect(null);
    setShowSearch(true);
  }

  function retry() {
    latest.current += 1;
    void runSearch(searched);
  }

  function handleQuickSelect(name: string) {
    setQuery(name);
    latest.current += 1;
    void runSearch(name);
  }

  const keyword = query.trim();
  const hint =
    keyword.length > 0 && keyword.length < MIN_CHARS ? SHORT_HINT : HINT;
  // Kueri di bawah 3 karakter = keadaan idle. Diturunkan saat render supaya
  // tidak ada setState di dalam effect dan tidak ada hasil kueri lama tertinggal.
  const visibleStatus: Status = keyword.length < MIN_CHARS ? "idle" : status;

  if (!showSearch) {
    const area = [picked.subdistrict, picked.district].filter(Boolean).join(", ");
    const detail = [picked.city, picked.province, picked.postal_code]
      .filter(Boolean)
      .join(", ");

    return (
      <div className="space-y-1.5">
        <p className="block text-label-md font-semibold text-text-primary">
          Wilayah pengiriman
        </p>
        <div className="rounded-md border border-brand-forest bg-surface-sage p-3">
          <div className="flex items-start gap-2">
            <LineIcon name="pin" className="mt-0.5 text-brand-forest" />
            <div className="min-w-0">
              <p className="text-body-md font-semibold text-brand-forest">
                {area || picked.city}
              </p>
              {detail ? (
                <p className="text-caption text-text-secondary">{detail}</p>
              ) : null}
            </div>
          </div>
          <button
            ref={changeRef}
            type="button"
            disabled={disabled}
            onClick={edit}
            className={buttonClass({
              variant: "outline",
              size: "sm",
              fullWidth: true,
              className: "mt-3",
            })}
          >
            Ganti wilayah
          </button>
        </div>
        {error ? (
          <p className="text-caption font-semibold text-feedback-error">
            {error}
          </p>
        ) : null}
        <p role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          Wilayah dipilih: {[area, detail].filter(Boolean).join(". ")}. Kode pos
          terisi, boleh diubah.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Input
        id={SEARCH_ID}
        name="destination_search"
        label="Wilayah pengiriman"
        placeholder="Cari kecamatan, kota, atau kode pos"
        hint={hint}
        autoComplete="off"
        spellCheck={false}
        maxLength={100}
        disabled={disabled}
        value={query}
        error={error}
        // Hint DAN region hasil: setelah hasil berganti, pembaca layar harus
        // mendengar keduanya saat fokus kembali ke field.
        aria-describedby={`${SEARCH_ID}-hint ${RESULT_ID}${
          error ? ` ${SEARCH_ID}-error` : ""
        }`}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          // Enter = cari sekarang, TANPA men-submit form alamat di sekitarnya.
          event.preventDefault();
          if (keyword.length < MIN_CHARS) return;
          latest.current += 1;
          void runSearch(keyword);
        }}
      />

      {/* Quick Suggestion Chips untuk destinasi populer saat input kosong */}
      {visibleStatus === "idle" && query.trim().length === 0 ? (
        <div className="space-y-2 pt-1">
          <p className="text-caption font-medium text-text-secondary">
            Destinasi populer:
          </p>
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Saran destinasi populer"
          >
            {POPULAR_DESTINATIONS.map((name) => (
              <button
                key={name}
                type="button"
                disabled={disabled}
                onClick={() => handleQuickSelect(name)}
                className="rounded-full border border-border-soft bg-surface-paper px-3 py-1 text-label-sm font-medium text-text-primary transition-colors hover:border-brand-forest hover:bg-surface-sage hover:text-brand-forest focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-forest disabled:cursor-not-allowed disabled:opacity-60"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/*
        Satu region hidup: role/aria-live berganti menurut keadaan, isinya
        DIGANTI (bukan ditumpuk) supaya pembaca layar tidak membaca dua pesan
        dari dua percobaan.
      */}
      <div
        id={RESULT_ID}
        role={visibleStatus === "error" ? "alert" : "status"}
        aria-live={visibleStatus === "error" ? "assertive" : "polite"}
        aria-atomic="true"
      >
        {visibleStatus === "loading" ? (
          <p className="text-caption text-text-secondary">Mencari wilayah…</p>
        ) : null}

        {visibleStatus === "empty" ? (
          <p className="text-caption text-text-secondary">
            Tidak ada wilayah yang cocok dengan &ldquo;{searched}&rdquo;.{" "}
            {EMPTY_HINT}
          </p>
        ) : null}

        {visibleStatus === "results" ? (
          <>
            <p className="text-caption text-text-secondary">
              {results.length} wilayah ditemukan.
            </p>
            <ul className="mt-2 divide-y divide-border-soft rounded-md border border-border-soft">
              {results.map((destination) => (
                <li key={destination.id}>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => choose(destination)}
                    className="flex min-h-11 w-full flex-col justify-center gap-0.5 px-3 py-2 text-left transition-colors hover:bg-surface-paper disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="text-body-md font-semibold text-text-primary">
                      {[
                        titleCase(destination.subdistrict_name),
                        titleCase(destination.city_name),
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                    <span className="text-caption text-text-secondary">
                      {[
                        titleCase(destination.district_name),
                        titleCase(destination.province_name),
                        destination.zip_code,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : null}

        {visibleStatus === "error" && failure ? (
          <div className="space-y-2">
            <p className="text-label-md font-semibold text-feedback-error">
              {failure.kind === "network"
                ? "Pencarian wilayah belum bisa dilakukan"
                : "Pencarian wilayah sedang tidak tersedia"}
            </p>
            <p className="text-caption leading-relaxed text-text-secondary">
              {failure.kind === "network" ? NETWORK_COPY : UNAVAILABLE_COPY}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={retry}
                className={buttonClass({ variant: "outline", size: "sm" })}
              >
                Coba cari lagi
              </button>
              {failure.kind === "network" ? null : (
                <Link
                  href="/kontak"
                  className="inline-flex min-h-11 items-center text-label-sm font-semibold text-brand-forest underline underline-offset-4"
                >
                  Hubungi Customer Service
                </Link>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
