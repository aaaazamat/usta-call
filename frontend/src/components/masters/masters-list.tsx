"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
import { useRouter } from "@/i18n/navigation";
import {
  useCategories,
  useMasters,
  useRegions,
} from "@/lib/api/masters-hooks";
import type { MasterListParams } from "@/lib/api/masters";
import { useDebounce } from "@/lib/use-debounce";

import { MasterCard, MasterCardSkeleton } from "./master-card";

const NONE = "all";

export function MastersList() {
  const router = useRouter();
  const t = useTranslations("masters");
  const searchParams = useSearchParams();

  const ORDERING_OPTIONS = [
    { value: "-rating_cache", label: t("sortRating") },
    { value: "-reviews_count_cache", label: t("sortMostReviews") },
    { value: "-completed_orders_cache", label: t("sortMostOrders") },
    { value: "-created_at", label: t("sortNewest") },
  ];

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
        <h1 className="text-2xl md:text-3xl font-bold">{t("title")}</h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          {data ? t("found", { count: data.count }) : t("listSubtitle")}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-11 pl-9 text-base"
            />
          </div>

          <div className="flex gap-2">
            <Select
              value={initial.region ? String(initial.region) : NONE}
              onValueChange={(v) =>
                updateParam({ region: !v || v === NONE ? undefined : Number(v) })
              }
            >
              <SelectTrigger className="h-11 flex-1 sm:flex-initial sm:w-[180px]">
                <SelectValue placeholder={t("region")}>
                  {(value) =>
                    !value || value === NONE
                      ? t("allRegions")
                      : viloyatlar.find((r) => String(r.id) === value)?.name ?? t("region")
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>{t("allRegions")}</SelectItem>
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
              <SelectTrigger className="h-11 flex-1 sm:flex-initial sm:w-[200px]">
                <SlidersHorizontal className="h-3.5 w-3.5 mr-2" />
                <SelectValue>
                  {(value) =>
                    ORDERING_OPTIONS.find((o) => o.value === value)?.label ??
                    t("sort")
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
        </div>

        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <CategoryChip
              active={initial.category === undefined}
              onClick={() => updateParam({ category: undefined })}
            >
              {t("all")}
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
              <X className="h-3.5 w-3.5 mr-1" /> {t("clearFilters")}
            </Button>
          </div>
        )}
      </div>

      {isError ? (
        <div className="rounded-lg border bg-destructive/5 p-8 text-center">
          <p className="text-destructive">{t("loadError")}</p>
        </div>
      ) : isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <MasterCardSkeleton key={i} />
          ))}
        </div>
      ) : data && data.results.length === 0 ? (
        <div className="rounded-lg border bg-muted/30 p-12 text-center">
          <p className="text-lg font-medium">{t("notFound")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("tryOtherFilters")}
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
  const t = useTranslations("masters");
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <Button
        variant="outline"
        size="sm"
        disabled={!hasPrev}
        onClick={() => onChange(page <= 2 ? undefined : page - 1)}
      >
        <ChevronLeft className="h-4 w-4" /> {t("prev")}
      </Button>
      <Badge variant="secondary" className="px-3 py-1">
        {t("pageLabel", { page })}
      </Badge>
      <Button
        variant="outline"
        size="sm"
        disabled={!hasNext}
        onClick={() => onChange(page + 1)}
      >
        {t("next")} <ChevronRight className="h-4 w-4" />
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
