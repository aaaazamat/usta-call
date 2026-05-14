"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCategories,
  useMasters,
  useRegions,
} from "@/lib/api/masters-hooks";
import type { MasterListParams } from "@/lib/api/masters";
import { useDebounce } from "@/lib/use-debounce";

import { MasterCard, MasterCardSkeleton } from "./master-card";

const ORDERING_OPTIONS = [
  { value: "-rating_cache", label: "Reyting bo'yicha" },
  { value: "-reviews_count_cache", label: "Ko'p sharhli" },
  { value: "-completed_orders_cache", label: "Ko'p ish bajargan" },
  { value: "-created_at", label: "Yangi qo'shilgan" },
];

const NONE = "all";

export function MastersList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initial = useMemo(() => parseParams(searchParams), [searchParams]);

  const [search, setSearch] = useState(initial.search ?? "");
  const debouncedSearch = useDebounce(search, 300);

  const params: MasterListParams = useMemo(
    () => ({
      ...initial,
      search: debouncedSearch || undefined,
    }),
    [initial, debouncedSearch],
  );

  useEffect(() => {
    const next = buildQuery({ ...initial, search: debouncedSearch || undefined });
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(`/masters${next ? "?" + next : ""}`, { scroll: false });
    }
  }, [debouncedSearch, initial, router, searchParams]);

  const updateParam = useCallback(
    (patch: Partial<MasterListParams>) => {
      const merged = { ...initial, ...patch };
      if ("category" in patch || "region" in patch) merged.page = undefined;
      const qs = buildQuery(merged);
      router.replace(`/masters${qs ? "?" + qs : ""}`, { scroll: false });
    },
    [initial, router],
  );

  const { data, isLoading, isFetching, isError } = useMasters(params);
  const { data: categories } = useCategories();
  const { data: regions } = useRegions();

  const viloyatlar = useMemo(
    () => regions?.filter((r) => r.kind === "viloyat") ?? [],
    [regions],
  );

  const hasFilters =
    initial.category !== undefined ||
    initial.region !== undefined ||
    initial.is_available !== undefined ||
    (initial.search?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ustalar</h1>
        <p className="text-muted-foreground mt-1">
          {data ? `${data.count} ta usta topildi` : "Ustalar ro'yxati"}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ism, kategoriya yoki ko'nikma bo'yicha qidirish..."
              className="h-10 pl-9 text-sm"
            />
          </div>

          <Select
            value={initial.region ? String(initial.region) : NONE}
            onValueChange={(v) =>
              updateParam({ region: !v || v === NONE ? undefined : Number(v) })
            }
          >
            <SelectTrigger className="h-10 w-[180px]">
              <SelectValue placeholder="Hudud">
                {(value) =>
                  !value || value === NONE
                    ? "Barcha hududlar"
                    : viloyatlar.find((r) => String(r.id) === value)?.name ?? "Hudud"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Barcha hududlar</SelectItem>
              {viloyatlar.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={initial.ordering ?? "-rating_cache"}
            onValueChange={(v) => updateParam({ ordering: v ?? undefined })}
          >
            <SelectTrigger className="h-10 w-[200px]">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
              <SelectValue>
                {(value) =>
                  ORDERING_OPTIONS.find((o) => o.value === value)?.label ??
                  "Saralash"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ORDERING_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <CategoryChip
              active={initial.category === undefined}
              onClick={() => updateParam({ category: undefined })}
            >
              Barchasi
            </CategoryChip>
            {categories
              .filter((c) => !c.parent)
              .map((c) => (
                <CategoryChip
                  key={c.id}
                  active={initial.category === c.id}
                  onClick={() => updateParam({ category: c.id })}
                >
                  {c.name}
                </CategoryChip>
              ))}
          </div>
        )}

        {hasFilters && (
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                router.replace("/masters", { scroll: false });
              }}
            >
              <X className="h-3.5 w-3.5 mr-1" /> Filterlarni tozalash
            </Button>
          </div>
        )}
      </div>

      {isError ? (
        <div className="rounded-lg border bg-destructive/5 p-8 text-center">
          <p className="text-destructive">Ustalarni yuklashda xatolik yuz berdi</p>
        </div>
      ) : isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MasterCardSkeleton key={i} />
          ))}
        </div>
      ) : data && data.results.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-12 text-center">
          <p className="text-lg font-medium">Ustalar topilmadi</p>
          <p className="text-sm text-muted-foreground mt-1">
            Boshqa filterlarni sinab ko&apos;ring
          </p>
        </div>
      ) : (
        <div
          className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-4 transition-opacity ${
            isFetching ? "opacity-60" : ""
          }`}
        >
          {data?.results.map((m) => (
            <MasterCard key={m.id} master={m} />
          ))}
        </div>
      )}

      {data && (data.previous || data.next) && (
        <Pagination
          hasPrev={Boolean(data.previous)}
          hasNext={Boolean(data.next)}
          page={initial.page ?? 1}
          onChange={(page) => updateParam({ page })}
        />
      )}
    </div>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "px-3 py-1.5 rounded-full text-sm border transition " +
        (active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-background hover:bg-muted border-border")
      }
    >
      {children}
    </button>
  );
}

function Pagination({
  hasPrev,
  hasNext,
  page,
  onChange,
}: {
  hasPrev: boolean;
  hasNext: boolean;
  page: number;
  onChange: (page: number | undefined) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={!hasPrev}
        onClick={() => onChange(page <= 2 ? undefined : page - 1)}
      >
        <ChevronLeft className="h-4 w-4" /> Oldingi
      </Button>
      <Badge variant="secondary" className="px-3 py-1">
        {page}-sahifa
      </Badge>
      <Button
        variant="outline"
        size="sm"
        disabled={!hasNext}
        onClick={() => onChange(page + 1)}
      >
        Keyingi <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function parseParams(sp: URLSearchParams): MasterListParams {
  const num = (k: string) => {
    const v = sp.get(k);
    if (!v) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    search: sp.get("search") ?? undefined,
    category: num("category"),
    skill: num("skill"),
    region: num("region"),
    min_rating: num("min_rating"),
    max_rate: num("max_rate"),
    ordering: sp.get("ordering") ?? undefined,
    page: num("page"),
  };
}

function buildQuery(params: MasterListParams): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    usp.set(k, String(v));
  }
  return usp.toString();
}
