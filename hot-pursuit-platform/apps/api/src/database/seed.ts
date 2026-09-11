import type { Permission } from "@hotpursuit/types";
import {
  ALL_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  ROLE_DEFAULT_PERMISSIONS,
  ROLE_DESCRIPTIONS,
  ROLES,
} from "../config/rbac.js";
import { prisma } from "./client.js";

/**
 * Seeds the role/permission foundation tables. This creates ONLY real system
 * roles (OWNER, ADMIN, MODERATOR, CONTENT_MANAGER) and their permission set.
 *
 * It deliberately does NOT create fake player/admin accounts and does NOT
 * assign any User a role — ownership is resolved server-side via
 * OWNER_DISCORD_IDS until Admin Management lands.
 *
 * Idempotent: safe to run repeatedly.
 */
export async function seed() {
  // Upsert permissions
  for (const permission of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: permission },
      update: { description: PERMISSION_DESCRIPTIONS[permission] },
      create: {
        name: permission,
        description: PERMISSION_DESCRIPTIONS[permission],
      },
    });
  }

  // Upsert roles and link their default permissions
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role },
      update: { description: ROLE_DESCRIPTIONS[role] },
      create: {
        name: role,
        description: ROLE_DESCRIPTIONS[role],
        permissions: {
          connect: ROLE_DEFAULT_PERMISSIONS[role].map((p) => ({ name: p })),
        },
      },
    });
  }

  // Ensure each role's permission links match the defaults (idempotent sync)
  for (const role of ROLES) {
    const roleRow = await prisma.role.findUnique({
      where: { name: role },
      include: { permissions: true },
    });
    if (!roleRow) continue;
    const want = new Set<string>(ROLE_DEFAULT_PERMISSIONS[role]);
    const have = new Set(roleRow.permissions.map((p) => p.name));
    const toAdd = [...want].filter((p) => !have.has(p));
    const toRemove = roleRow.permissions
      .map((p) => p.name)
      .filter((p) => !want.has(p));
    if (toAdd.length) {
      await prisma.role.update({
        where: { name: role },
        data: {
          permissions: { connect: toAdd.map((p) => ({ name: p as Permission })) },
        },
      });
    }
    if (toRemove.length) {
      await prisma.role.update({
        where: { name: role },
        data: {
          permissions: {
            disconnect: toRemove.map((p) => ({ name: p as Permission })),
          },
        },
      });
    }
  }

  // Sync the trusted server-side pricing/snapshot registry from the static
  // frontend catalog (39 products).
  await seedProductPrices();
}

/**
 * Server-side ProductPrice rows derived from the static frontend catalog
 * (39 products). Amounts are integer cents; `available` mirrors the catalog's
 * `sold` field so sold-out products cannot be ordered. Prices here are the
 * ONLY source the orders API trusts.
 *
 * Idempotent: upserts by productId (never deletes).
 */
const CATALOG_PRICES: Array<{
  productId: number;
  name: string;
  nameAr: string | null;
  image: string | null;
  amountCents: number;
  billing: "MONTHLY" | "ONE_TIME";
  available: boolean;
}> = [
  // prettier-ignore
  { productId: 1,  name: "Verified Account",              nameAr: "توثيق الحساب",               image: "images/products/vip/Verified Accounts.webp",           amountCents: 100,  billing: "MONTHLY",  available: true  },
  { productId: 2,  name: "Bennys LSIA",                   nameAr: "بينيز LSIA",                  image: "images/products/mlo/Bennys LSIA.webp",                 amountCents: 2000, billing: "MONTHLY",  available: true  },
  { productId: 3,  name: "Bennys Docks",                  nameAr: "بينيز دوكس",                  image: "images/products/mlo/Bennys Docks.webp",                amountCents: 2000, billing: "MONTHLY",  available: true  },
  { productId: 4,  name: "Paleto Car Dealer",             nameAr: "باليتو معرض سيارات",          image: "images/products/mlo/Paleto Car Dealer.webp",            amountCents: 3000, billing: "MONTHLY",  available: true  },
  { productId: 5,  name: "Kebab King",                    nameAr: "كباب كينج",                   image: "images/products/mlo/Kebab King.webp",                  amountCents: 1500, billing: "MONTHLY",  available: true  },
  { productId: 6,  name: "Tropical Heights",              nameAr: null,                          image: "images/products/mlo/Tropical Heights.webp",            amountCents: 1000, billing: "MONTHLY",  available: false },
  { productId: 7,  name: "Leapfrog",                      nameAr: null,                          image: "images/products/mlo/Leapfrog.webp",                    amountCents: 1500, billing: "MONTHLY",  available: true  },
  { productId: 8,  name: "Opium Nights",                  nameAr: null,                          image: "images/products/mlo/Opium Nights.webp",                amountCents: 2000, billing: "MONTHLY",  available: true  },
  { productId: 9,  name: "Red's",                         nameAr: null,                          image: "images/products/mlo/Red's.webp",                       amountCents: 2000, billing: "MONTHLY",  available: true  },
  { productId: 10, name: "Vespucci PDM",                  nameAr: null,                          image: "images/products/mlo/Vespucci PDM.webp",                amountCents: 3000, billing: "MONTHLY",  available: false },
  { productId: 11, name: "Pier 76",                       nameAr: null,                          image: "images/products/mlo/Pier 76.webp",                     amountCents: 3000, billing: "MONTHLY",  available: false },
  { productId: 12, name: "Pearls",                        nameAr: null,                          image: "images/products/mlo/Pearls.webp",                      amountCents: 2000, billing: "MONTHLY",  available: false },
  { productId: 13, name: "LaMesa Mechanic",               nameAr: null,                          image: "images/products/mlo/LaMesa Mechanic.webp",             amountCents: 2000, billing: "MONTHLY",  available: true  },
  { productId: 14, name: "Koi",                           nameAr: null,                          image: "images/products/mlo/Koi.webp",                         amountCents: 1500, billing: "MONTHLY",  available: true  },
  { productId: 15, name: "Horny's",                       nameAr: null,                          image: "images/products/mlo/Horny's.webp",                     amountCents: 1500, billing: "MONTHLY",  available: true  },
  { productId: 16, name: "Up n Atom",                     nameAr: null,                          image: "images/products/mlo/Up n Atom.webp",                   amountCents: 1500, billing: "MONTHLY",  available: true  },
  { productId: 17, name: "Vanilla Unicorn",               nameAr: null,                          image: "images/products/mlo/Vanilla Unicorn.webp",             amountCents: 1000, billing: "MONTHLY",  available: true  },
  { productId: 18, name: "Exotic Dealership",             nameAr: null,                          image: "images/products/mlo/Exotic Dealership.webp",           amountCents: 2000, billing: "MONTHLY",  available: false },
  { productId: 19, name: "Pizzeria",                      nameAr: null,                          image: "images/products/mlo/Pizzeria.webp",                    amountCents: 1500, billing: "MONTHLY",  available: true  },
  { productId: 20, name: "Ottos Auto",                    nameAr: null,                          image: "images/products/mlo/Ottos Auto.webp",                  amountCents: 2000, billing: "MONTHLY",  available: true  },
  { productId: 21, name: "Bennys",                        nameAr: null,                          image: "images/products/mlo/Bennys.webp",                      amountCents: 2000, billing: "MONTHLY",  available: true  },
  { productId: 22, name: "Hayes",                         nameAr: null,                          image: "images/products/mlo/Hayes.webp",                       amountCents: 2000, billing: "MONTHLY",  available: false },
  { productId: 23, name: "Pops Dinner",                   nameAr: null,                          image: "images/products/mlo/Pops Dinner.webp",                 amountCents: 1500, billing: "MONTHLY",  available: true  },
  { productId: 24, name: "Bean Machine",                  nameAr: null,                          image: "images/products/mlo/Bean Machine.webp",                amountCents: 1500, billing: "MONTHLY",  available: true  },
  { productId: 25, name: "Bahamas",                       nameAr: null,                          image: "images/products/mlo/Bahamas.webp",                     amountCents: 1000, billing: "MONTHLY",  available: true  },
  { productId: 26, name: "Cat Cafe",                      nameAr: null,                          image: "images/products/mlo/Cat Cafe.webp",                    amountCents: 1500, billing: "MONTHLY",  available: false },
  { productId: 27, name: "Burgershot",                    nameAr: null,                          image: "images/products/mlo/Burgershot.webp",                  amountCents: 1500, billing: "MONTHLY",  available: true  },
  { productId: 28, name: "Car Radio",                     nameAr: null,                          image: "images/products/vip/car radio.webp",                   amountCents: 1000, billing: "MONTHLY",  available: true  },
  { productId: 29, name: "Pearls Restaurant",             nameAr: null,                          image: "images/products/mlo/Pearls.webp",                      amountCents: 1500, billing: "MONTHLY",  available: true  },
  { productId: 30, name: "Pearls Combo",                  nameAr: null,                          image: "images/products/mlo/Pearls.webp",                      amountCents: 3000, billing: "MONTHLY",  available: false },
  { productId: 31, name: "Ottos Auto Used Car Dealer",    nameAr: null,                          image: "images/products/mlo/Ottos Auto.webp",                  amountCents: 2000, billing: "MONTHLY",  available: true  },
  { productId: 32, name: "Ottos Auto Combo",              nameAr: null,                          image: "images/products/mlo/Ottos Auto.webp",                  amountCents: 3500, billing: "MONTHLY",  available: true  },
  { productId: 33, name: "Preview Class S",               nameAr: null,                          image: null,                                                   amountCents: 2000, billing: "MONTHLY",  available: true  },
  { productId: 34, name: "Preview Class S+",              nameAr: null,                          image: null,                                                   amountCents: 2500, billing: "MONTHLY",  available: true  },
  { productId: 35, name: "Preview Class S++",             nameAr: null,                          image: null,                                                   amountCents: 3000, billing: "MONTHLY",  available: true  },
  { productId: 36, name: "Preview Class X",               nameAr: null,                          image: null,                                                   amountCents: 4000, billing: "MONTHLY",  available: true  },
  { productId: 37, name: "Custom Car Plate",              nameAr: "لوحة أرقام مخصصة",           image: "images/products/vip/plat.webp",                        amountCents: 500,  billing: "ONE_TIME", available: true  },
  { productId: 38, name: "Custom Phone Number",           nameAr: "رقم هاتف مخصص",              image: "images/products/vip/custom phone numbers.webp",        amountCents: 500,  billing: "ONE_TIME", available: true  },
  { productId: 39, name: "Al Dente's",                    nameAr: null,                          image: "images/products/mlo/prod-1785937000094.webp",          amountCents: 1500, billing: "MONTHLY",  available: true  },
];

export async function seedProductPrices(): Promise<void> {
  for (const p of CATALOG_PRICES) {
    await prisma.productPrice.upsert({
      where: { productId: p.productId },
      update: {
        name: p.name,
        nameAr: p.nameAr,
        image: p.image,
        amountCents: p.amountCents,
        billing: p.billing,
        available: p.available,
      },
      create: {
        productId: p.productId,
        name: p.name,
        nameAr: p.nameAr,
        image: p.image,
        amountCents: p.amountCents,
        billing: p.billing,
        available: p.available,
      },
    });
  }
}

// Allow running directly: `npm run db:seed` / `npx tsx src/database/seed.ts`
if (process.argv[1].endsWith("seed.ts") || process.argv[1].endsWith("seed.js")) {
  seed()
    .then(() => {
      console.log("[seed] roles, permissions and product prices synced.");
      return prisma.$disconnect();
    })
    .catch(async (e) => {
      console.error("[seed] failed:", e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
