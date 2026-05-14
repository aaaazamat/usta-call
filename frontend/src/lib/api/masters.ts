import { api } from "@/lib/api/client";
import type {
  Category,
  MasterDetail,
  MasterListItem,
  Paginated,
  Region,
  Skill,
} from "@/lib/api/types";

export interface MasterListParams {
  search?: string;
  category?: number;
  skill?: number;
  region?: number;
  min_rating?: number;
  max_rate?: number;
  is_available?: boolean;
  ordering?: string;
  page?: number;
}

function cleanParams(p: MasterListParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v as string | number | boolean;
  }
  return out;
}

export const mastersApi = {
  list: (params: MasterListParams = {}) =>
    api
      .get<Paginated<MasterListItem>>("/masters/", { params: cleanParams(params) })
      .then((r) => r.data),

  detail: (id: number) =>
    api.get<MasterDetail>(`/masters/${id}/`).then((r) => r.data),

  categories: () =>
    api.get<Category[]>("/masters/categories/").then((r) => r.data),

  regions: () => api.get<Region[]>("/masters/regions/").then((r) => r.data),

  skills: (params: { category?: number; search?: string } = {}) =>
    api
      .get<Paginated<Skill>>("/masters/skills/", { params: cleanParams(params) })
      .then((r) => r.data),
};
