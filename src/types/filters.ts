export interface SizeRange {
  min: number;
  max: number;
}

export type SortOption = "default" | "name_asc" | "name_desc" | "size_asc" | "size_desc";

export interface FilterState {
  genres: string[];
  repackSizeRange: SizeRange | null;
  originalSizeRange: SizeRange | null;
  search: string;
  sort: SortOption;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  genres: [],
  originalSizeRange: null,
  repackSizeRange: null,
  search: "",
  sort: "default",
};
