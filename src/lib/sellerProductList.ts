export type SellerProductApprovalFilter = "all" | "pending" | "approved";

export interface SellerProductListFilters<T> {
  search: string;
  category: string;
  sellerId: string;
  approval: SellerProductApprovalFilter;
  grocery: "all" | "grocery" | "non_grocery" | "unassigned_grocery";
  page: number;
  pageSize: number;
  isUnassignedGrocery: (product: T) => boolean;
}

export function getSellerProductPage<T extends {
  name: string;
  category: string | null;
  seller_id: string;
  is_approved: boolean;
  is_grocery?: boolean;
}>(products: T[], filters: SellerProductListFilters<T>) {
  const query = filters.search.trim().toLowerCase();
  const filtered = products.filter((product) => {
    if (filters.category && product.category !== filters.category) return false;
    if (filters.sellerId && product.seller_id !== filters.sellerId) return false;
    if (query && !product.name.toLowerCase().includes(query)) return false;
    if (filters.approval === "approved" && !product.is_approved) return false;
    if (filters.approval === "pending" && product.is_approved) return false;
    if (filters.grocery === "grocery" && !product.is_grocery) return false;
    if (filters.grocery === "non_grocery" && product.is_grocery) return false;
    if (filters.grocery === "unassigned_grocery" && !filters.isUnassignedGrocery(product)) return false;
    return true;
  }).sort((a, b) => Number(filters.isUnassignedGrocery(b)) - Number(filters.isUnassignedGrocery(a)));

  const pageSize = Math.max(1, filters.pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const page = Math.min(Math.max(1, filters.page), pageCount);
  const startIndex = (page - 1) * pageSize;

  return {
    filtered,
    pageItems: filtered.slice(startIndex, startIndex + pageSize),
    page,
    pageCount,
    startIndex,
    endIndex: Math.min(startIndex + pageSize, filtered.length),
  };
}