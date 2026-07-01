import type { Category, SaleType } from "@/lib/types/database.types";

export type MapMarker = {
  id: string;
  title: string;
  lat: number;
  lng: number;
  sale_type: SaleType;
  status: string;
  starts_at: string;
  ends_at: string;
  neighborhood: string | null;
  categories: Category[];
  recurring_weekly: boolean;
  is_community: boolean;
  times_unknown: boolean;
  photoUrl: string | null;
};

export type MapApiResponse = { markers: MapMarker[] };
