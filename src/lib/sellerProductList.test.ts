import { describe, expect, it } from "vitest";
import { getSellerProductPage } from "./sellerProductList";

const products = Array.from({ length: 21 }, (_, index) => ({
  id: `product-${index + 1}`,
  name: `Product ${index + 1}`,
  category: index % 2 === 0 ? "Grocery" : "General",
  seller_id: index < 11 ? "seller-a" : "seller-b",
  is_approved: index % 2 === 0,
  is_grocery: index % 2 === 0,
}));

const list = (overrides: Partial<Parameters<typeof getSellerProductPage<typeof products[number]>>[1]> = {}) =>
  getSellerProductPage(products, {
    search: "",
    category: "",
    sellerId: "",
    approval: "all",
    grocery: "all",
    page: 1,
    pageSize: 20,
    isUnassignedGrocery: () => false,
    ...overrides,
  });

describe("Seller Products list", () => {
  it("filters to pending products only", () => {
    const result = list({ approval: "pending" });
    expect(result.filtered.length).toBe(10);
    expect(result.filtered.every((product) => !product.is_approved)).toBe(true);
  });

  it("filters to approved products only", () => {
    const result = list({ approval: "approved" });
    expect(result.filtered.length).toBe(11);
    expect(result.filtered.every((product) => product.is_approved)).toBe(true);
  });

  it("shows the next page and clamps navigation to available pages", () => {
    const secondPage = list({ page: 2 });
    expect(secondPage.pageItems.map((product) => product.id)).toEqual(["product-21"]);
    expect(secondPage.page).toBe(2);
    expect(list({ page: 9 }).page).toBe(2);
  });
});