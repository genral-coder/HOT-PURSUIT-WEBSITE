/**
 * Pure Store-domain logic tests (no database): input validation, serializers,
 * authz guards and legacy id allocation — mirroring the pure-logic style of
 * the existing adminLogic / orders test suites.
 */
import { deepStrictEqual, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import type { Permission } from "@hotpursuit/types";
import { ApiError } from "../src/lib/errors.js";
import {
  MAX_AMOUNT_CENTS,
  nextProductId,
  parseProductId,
  requireStoreManage,
  requireStoreView,
  serializeAdminProduct,
  validateProductInput,
  type ProductRow,
} from "../src/services/storeLogic.js";

/** Extract the ApiError code from a thrown error (asserts it IS an ApiError). */
function code(fn: () => unknown): string {
  try {
    fn();
  } catch (e) {
    if (e instanceof ApiError) return e.code;
    throw new Error(`expected ApiError, got ${(e as Error)?.message}`);
  }
  throw new Error("expected a throw");
}

const GOOD_CREATE = {
  category: "mlo",
  name: "Test Business",
  price: "20$ Monthly",
  amountCents: 2000,
  billing: "MONTHLY",
} as const;

function row(): ProductRow {
  return {
    productId: 40,
    categoryId: "mlo",
    name: "Row",
    nameAr: null,
    short: null,
    shortAr: null,
    description: null,
    descriptionAr: null,
    features: ["x"],
    featuresAr: [],
    price: "20$ Monthly",
    image: "images/products/mlo/x.webp",
    type: null,
    class: null,
    sold: false,
    popular: false,
    new: null,
    featured: null,
    likes: 0,
    available: true,
    createdAt: new Date("2026-09-11T00:00:00.000Z"),
    updatedAt: new Date("2026-09-11T00:00:00.000Z"),
    priceReg: { amountCents: 2000, billing: "MONTHLY" },
  };
}

describe("validateProductInput (create)", () => {
  it("accepts a valid full input", () => {
    const v = validateProductInput(GOOD_CREATE, { mode: "create" });
    strictEqual(v.categoryId, "mlo");
    strictEqual(v.name, "Test Business");
    strictEqual(v.amountCents, 2000);
    strictEqual(v.billing, "MONTHLY");
  });

  it("requires category, name, price, amountCents and billing", () => {
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, category: undefined }, { mode: "create" })), "INVALID_CATEGORY");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, category: "boats" }, { mode: "create" })), "INVALID_CATEGORY");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, name: "" }, { mode: "create" })), "invalid_input");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, price: "" }, { mode: "create" })), "INVALID_PRICE");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, amountCents: undefined }, { mode: "create" })), "INVALID_AMOUNT");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, billing: "WEEKLY" }, { mode: "create" })), "INVALID_BILLING");
  });

  it("rejects invalid amounts and billings", () => {
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, amountCents: 0 }, { mode: "create" })), "INVALID_AMOUNT");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, amountCents: -5 }, { mode: "create" })), "INVALID_AMOUNT");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, amountCents: 1.5 }, { mode: "create" })), "INVALID_AMOUNT");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, amountCents: MAX_AMOUNT_CENTS + 1 }, { mode: "create" })), "INVALID_AMOUNT");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, billing: "ONCE" }, { mode: "create" })), "INVALID_BILLING");
  });

  it("rejects external URLs / absolute / traversal image paths", () => {
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, image: "https://evil.example/x.webp" }, { mode: "create" })), "INVALID_IMAGE");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, image: "/abs/path.webp" }, { mode: "create" })), "INVALID_IMAGE");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, image: "../secret.webp" }, { mode: "create" })), "INVALID_IMAGE");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, image: "\\\\server\\share" }, { mode: "create" })), "INVALID_IMAGE");
    const ok = validateProductInput({ ...GOOD_CREATE, image: "images/products/mlo/Bennys LSIA.webp" }, { mode: "create" });
    strictEqual(ok.image, "images/products/mlo/Bennys LSIA.webp");
  });

  it("enforces category-scoped type/class", () => {
    const mlo = validateProductInput({ ...GOOD_CREATE, type: "mechanic" }, { mode: "create" });
    strictEqual(mlo.type, "mechanic");
    const vip = validateProductInput({ ...GOOD_CREATE, category: "vip", type: "mechanic" }, { mode: "create" });
    strictEqual(vip.type, null); // type is cleared on non-mlo
    const vehicle = validateProductInput({ ...GOOD_CREATE, category: "vehicles", class: "S+" }, { mode: "create" });
    strictEqual(vehicle.class, "S+");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, category: "vehicles", class: "ZZZ" }, { mode: "create" })), "invalid_input");
  });

  it("normalizes feature arrays and validates lengths", () => {
    const v = validateProductInput({ ...GOOD_CREATE, features: ["  a  ", "", "b"] }, { mode: "create" });
    deepStrictEqual(v.features, ["a", "b"]);
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, features: "nope" }, { mode: "create" })), "invalid_input");
  });

  it("rejects bad likes and non-boolean flags", () => {
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, likes: -1 }, { mode: "create" })), "invalid_input");
    strictEqual(code(() => validateProductInput({ ...GOOD_CREATE, sold: "yes" }, { mode: "create" })), "invalid_input");
  });
});

describe("validateProductInput (update / patch)", () => {
  it("accepts a partial body and returns only touched fields", () => {
    const v = validateProductInput({ name: "Renamed" }, { mode: "update" });
    deepStrictEqual(v, { name: "Renamed" });
  });

  it("accepts an empty body (no-op patch) in update mode", () => {
    const v = validateProductInput({}, { mode: "update" });
    deepStrictEqual(v, {});
  });

  it("interprets null and empty strings as clears", () => {
    const v = validateProductInput({ nameAr: null, image: "", features: null }, { mode: "update" });
    strictEqual(v.nameAr, null);
    strictEqual(v.image, null);
    deepStrictEqual(v.features, []);
  });

  it("still validates supplied fields in update mode", () => {
    strictEqual(code(() => validateProductInput({ amountCents: 0 }, { mode: "update" })), "INVALID_AMOUNT");
    strictEqual(code(() => validateProductInput({ category: "none" }, { mode: "update" })), "INVALID_CATEGORY");
  });
});

describe("authz guards", () => {
  const withPerm = (p: Permission) => ({ permissions: [p] });

  it("requireStoreView lets store.view through and blocks others", () => {
    requireStoreView(withPerm("store.view"));
    throws(() => requireStoreView(withPerm("store.manage")), ApiError);
    throws(() => requireStoreView({ permissions: [] }), ApiError);
  });

  it("requireStoreManage lets store.manage through and blocks others", () => {
    requireStoreManage(withPerm("store.manage"));
    throws(() => requireStoreManage(withPerm("store.view")), ApiError);
    throws(() => requireStoreManage({ permissions: [] }), ApiError);
  });
});

describe("nextProductId (legacy numeric ids)", () => {
  it("starts at 1 on an empty catalog", () => {
    strictEqual(nextProductId([]), 1);
  });

  it("assigns max + 1", () => {
    strictEqual(nextProductId([{ productId: 5 }]), 6);
    strictEqual(nextProductId([{ productId: 1 }, { productId: 3 }]), 4);
    const many = Array.from({ length: 39 }, (_, i) => ({ productId: i + 1 }));
    strictEqual(nextProductId(many), 40);
  });

  it("never collides with existing ids", () => {
    const existing = Array.from({ length: 39 }, (_, i) => ({ productId: i + 1 }));
    existing.push({ productId: 50 });
    const next = nextProductId(existing);
    strictEqual(existing.some((p) => p.productId === next), false);
  });
});

describe("parseProductId", () => {
  it("parses numeric ids and rejects junk", () => {
    strictEqual(parseProductId("42"), 42);
    strictEqual(parseProductId(42), 42);
    strictEqual(code(() => parseProductId("abc")), "invalid_product_id");
    strictEqual(code(() => parseProductId("-1")), "invalid_product_id");
    strictEqual(code(() => parseProductId("0")), "invalid_product_id");
    strictEqual(code(() => parseProductId(undefined)), "invalid_product_id");
  });
});

describe("serializeAdminProduct", () => {
  it("adds the management fields to the legacy shape", () => {
    const out = serializeAdminProduct(row());
    strictEqual(out.available, true);
    strictEqual(out.amountCents, 2000);
    strictEqual(out.billing, "MONTHLY");
    strictEqual(out.createdAt, "2026-09-11T00:00:00.000Z");
    strictEqual(out.updatedAt, "2026-09-11T00:00:00.000Z");
    strictEqual(out.id, 40);
    strictEqual(out.name, "Row");
    strictEqual(out.price, "20$ Monthly");
  });

  it("reflects archive + sold in the returned available flag", () => {
    const archived: ProductRow = { ...row(), available: false, priceReg: { amountCents: 2000, billing: "MONTHLY" } };
    strictEqual(serializeAdminProduct(archived).available, false);
  });
});