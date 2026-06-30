import type { Category, SaleType } from "@/lib/types/database.types";

export const SALE_TYPES: { value: SaleType; label: string }[] = [
  { value: "GARAGE", label: "Garage sale" },
  { value: "STOOP", label: "Stoop sale" },
  { value: "YARD", label: "Yard sale" },
  { value: "MOVING", label: "Moving sale" },
  { value: "ESTATE", label: "Estate sale" },
  { value: "OTHER", label: "Other" },
];

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "FURNITURE", label: "Furniture" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "KIDS_BABY", label: "Kids & baby" },
  { value: "BOOKS", label: "Books" },
  { value: "RECORDS", label: "Records" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "HOME_GOODS", label: "Home goods" },
  { value: "VINTAGE", label: "Vintage" },
  { value: "TOOLS", label: "Tools" },
  { value: "FREE_STUFF", label: "Free stuff" },
  { value: "OTHER", label: "Other" },
];

export const SALE_TYPE_VALUES = SALE_TYPES.map((t) => t.value) as [SaleType, ...SaleType[]];
export const CATEGORY_VALUES = CATEGORIES.map((c) => c.value) as [Category, ...Category[]];

const saleTypeLabels = Object.fromEntries(SALE_TYPES.map((t) => [t.value, t.label]));
const categoryLabels = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]));

export const saleTypeLabel = (v: SaleType) => saleTypeLabels[v] ?? v;
export const categoryLabel = (v: Category) => categoryLabels[v] ?? v;
