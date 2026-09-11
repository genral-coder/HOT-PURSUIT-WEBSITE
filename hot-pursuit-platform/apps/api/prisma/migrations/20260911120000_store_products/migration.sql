------ BEGIN: HOT PURSUIT RP - Phase 7 (Store catalog + Admin products) ------

-- Generated deterministically by scripts/generate-store-migration.ts from
-- src/database/catalog.ts (the verified Store catalog source, 39 products).
-- Do not hand-edit the data — re-run the generator instead.

-- Table: ProductCategory
-- Reference data for the catalog categories (vehicles / mlo / vip / bundles).
-- Frontend display metadata continues to live in apps/web/src/data/store.ts;
-- this table anchors category identity for server-side validation.

CREATE TABLE "ProductCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "emoji" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

INSERT INTO "ProductCategory" ("id", "name", "nameAr", "emoji", "color") VALUES
  ('vehicles', 'Vehicles', 'المركبات', '🚗', '#ff2d3f'),
  ('mlo', 'Business', 'بيزنس', '🏢', '#4da6ff'),
  ('vip', 'VIP', 'VIP', '💎', '#ffc24b'),
  ('bundles', 'Bundles', 'الباقات', '🎁', '#b26bff');

-- Table: Product
-- The canonical Store catalog. productId keeps the legacy numeric id.
-- available=false = archived/hidden (soft delete — never a hard delete).
-- Text arrays hold the localized feature bullets.

CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "short" TEXT,
    "shortAr" TEXT,
    "description" TEXT,
    "descriptionAr" TEXT,
    "features" TEXT[] NOT NULL DEFAULT '{}',
    "featuresAr" TEXT[] NOT NULL DEFAULT '{}',
    "price" TEXT NOT NULL,
    "image" TEXT,
    "type" TEXT,
    "class" TEXT,
    "sold" BOOLEAN NOT NULL DEFAULT false,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "new" BOOLEAN DEFAULT false,
    "featured" BOOLEAN DEFAULT false,
    "likes" INTEGER DEFAULT 0,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Product_productId_key" ON "Product"("productId");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_available_idx" ON "Product"("available");
CREATE INDEX "Product_sold_idx" ON "Product"("sold");
CREATE INDEX "Product_name_idx" ON "Product"("name");

-- Reference catalog data (verbatim from the verified Store source).
INSERT INTO "Product" (
    "id", "productId", "categoryId", "name", "nameAr", "short", "shortAr",
    "description", "descriptionAr", "features", "featuresAr", "price",
    "image", "type", "class", "sold", "popular", "likes"
) VALUES
  ('prod_1', 1, 'vip', 'Verified Account', 'توثيق الحساب', 'Get your account verified for only $1/Monthly.', 'احصل على توثيق حسابك مقابل دولار واحد فقط شهرياً.', 'Get your account verified for only 1$/Monthly for each application.', 'احصل على توثيق حسابك مقابل دولار واحد فقط شهريًا لكل حساب.', ARRAY['$1/Monthly per account', 'Instant verification', 'Official verified badge']::TEXT[], ARRAY['دولار واحد شهرياً لكل حساب', 'توثيق فوري', 'شارة توثيق رسمية']::TEXT[], '$1/Monthly', 'images/products/vip/Verified Accounts.webp', NULL, NULL, false, true, 0),
  ('prod_2', 2, 'mlo', 'Bennys LSIA', 'بينيز LSIA', 'A mechanic workshop, ready for business.', 'ورشة ميكانيكا جاهزة للشغل.', 'Bennys LSIA — a mechanic workshop. Costs 20$ Monthly.', 'بينيز LSIA — ورشة ميكانيكا. التكلفة 20$ شهرياً.', ARRAY['20$ Monthly', 'Workshop location', 'In-game ready']::TEXT[], ARRAY['20$ شهرياً', 'موقع ورشة', 'جاهزة داخل اللعبة']::TEXT[], '20$ Monthly', 'images/products/mlo/Bennys LSIA.webp', 'mechanic', NULL, false, false, 0),
  ('prod_3', 3, 'mlo', 'Bennys Docks', 'بينيز دوكس', 'A mechanic workshop, ready for business.', 'ورشة ميكانيكا جاهزة للشغل.', 'Bennys Docks — a mechanic workshop. Costs 20$ Monthly.', 'بينيز دوكس — ورشة ميكانيكا. التكلفة 20$ شهرياً.', ARRAY['20$ Monthly', 'Workshop location', 'In-game ready']::TEXT[], ARRAY['20$ شهرياً', 'موقع ورشة', 'جاهزة داخل اللعبة']::TEXT[], '20$ Monthly', 'images/products/mlo/Bennys Docks.webp', 'mechanic', NULL, false, false, 0),
  ('prod_4', 4, 'mlo', 'Paleto Car Dealer', 'باليتو معرض سيارات', 'A car dealership, ready for business.', 'معرض سيارات جاهز للشغل.', 'Paleto Car Dealer — a car dealership. Costs 30$ Monthly.', 'باليتو معرض سيارات — معرض سيارات. التكلفة 30$ شهرياً.', ARRAY['30$ Monthly', 'Dealership location', 'In-game ready']::TEXT[], ARRAY['30$ شهرياً', 'موقع معرض سيارات', 'جاهز داخل اللعبة']::TEXT[], '30$ Monthly', 'images/products/mlo/Paleto Car Dealer.webp', 'dealership', NULL, false, false, 0),
  ('prod_5', 5, 'mlo', 'Kebab King', 'كباب كينج', 'A restaurant, ready for business.', 'مطعم جاهز للشغل.', 'Kebab King — a restaurant. Costs 15$ Monthly.', 'كباب كينج — مطعم. التكلفة 15$ شهرياً.', ARRAY['15$ Monthly', 'Restaurant location', 'In-game ready']::TEXT[], ARRAY['15$ شهرياً', 'موقع مطعم', 'جاهز داخل اللعبة']::TEXT[], '15$ Monthly', 'images/products/mlo/Kebab King.webp', 'restaurant', NULL, false, false, 0),
  ('prod_6', 6, 'mlo', 'Tropical Heights', 'تروبيكال هايتس', 'A nightclub, ready for business.', 'نادي ليلي جاهز للشغل.', 'Tropical Heights — a nightclub. Costs 10$ Monthly.', 'تروبيكال هايتس — نادي ليلي. التكلفة 10$ شهرياً.', ARRAY['10$ Monthly', 'Nightclub location', 'In-game ready']::TEXT[], ARRAY['10$ شهرياً', 'موقع نادي ليلي', 'جاهز داخل اللعبة']::TEXT[], '10$ Monthly', 'images/products/mlo/Tropical Heights.webp', 'nightclub', NULL, true, false, 0),
  ('prod_7', 7, 'mlo', 'Leapfrog', 'ليفروج', 'A cafe, ready for business.', 'كافيه جاهز للشغل.', 'Leapfrog — a cafe. Costs 15$ Monthly.', 'ليفروج — كافيه. التكلفة 15$ شهرياً.', ARRAY['15$ Monthly', 'Cafe location', 'In-game ready']::TEXT[], ARRAY['15$ شهرياً', 'موقع كافيه', 'جاهز داخل اللعبة']::TEXT[], '15$ Monthly', 'images/products/mlo/Leapfrog.webp', 'cafe', NULL, false, false, 0),
  ('prod_8', 8, 'mlo', 'Opium Nights', 'أوبيوم نايتس', 'A hotel, ready for business.', 'فندق جاهز للشغل.', 'Opium Nights — a hotel. Costs 20$ Monthly.', 'أوبيوم نايتس — فندق. التكلفة 20$ شهرياً.', ARRAY['20$ Monthly', 'Hotel location', 'In-game ready']::TEXT[], ARRAY['20$ شهرياً', 'موقع فندق', 'جاهز داخل اللعبة']::TEXT[], '20$ Monthly', 'images/products/mlo/Opium Nights.webp', 'hotel', NULL, false, false, 0),
  ('prod_9', 9, 'mlo', 'Red''s', 'ريدز', 'A mechanic workshop, ready for business.', 'ورشة ميكانيكا جاهزة للشغل.', 'Red''s — a mechanic workshop. Costs 20$ Monthly.', 'ريدز — ورشة ميكانيكا. التكلفة 20$ شهرياً.', ARRAY['20$ Monthly', 'Workshop location', 'In-game ready']::TEXT[], ARRAY['20$ شهرياً', 'موقع ورشة', 'جاهزة داخل اللعبة']::TEXT[], '20$ Monthly', 'images/products/mlo/Red''s.webp', 'mechanic', NULL, false, false, 0),
  ('prod_10', 10, 'mlo', 'Vespucci PDM', 'فيسوتشي معرض سيارات', 'A car dealership, ready for business.', 'معرض سيارات جاهز للشغل.', 'Vespucci PDM — a car dealership. Costs 30$ Monthly.', 'فيسوتشي معرض سيارات — معرض سيارات. التكلفة 30$ شهرياً.', ARRAY['30$ Monthly', 'Dealership location', 'In-game ready']::TEXT[], ARRAY['30$ شهرياً', 'موقع معرض سيارات', 'جاهز داخل اللعبة']::TEXT[], '30$ Monthly', 'images/products/mlo/Vespucci PDM.webp', 'dealership', NULL, true, false, 0),
  ('prod_11', 11, 'mlo', 'Pier 76', 'بير 76', 'A car dealership, ready for business.', 'معرض سيارات جاهز للشغل.', 'Pier 76 — a car dealership. Costs 30$ Monthly.', 'بير 76 — معرض سيارات. التكلفة 30$ شهرياً.', ARRAY['30$ Monthly', 'Dealership location', 'In-game ready']::TEXT[], ARRAY['30$ شهرياً', 'موقع معرض سيارات', 'جاهز داخل اللعبة']::TEXT[], '30$ Monthly', 'images/products/mlo/Pier 76.webp', 'dealership', NULL, true, false, 0),
  ('prod_12', 12, 'mlo', 'Pearls', 'بيرلز', 'A hotel business, ready for business.', 'فندق جاهز للشغل.', 'Pearls — a hotel business. Costs 20$ Monthly.', 'بيرلز — فندق. التكلفة 20$ شهرياً.', ARRAY['20$ Monthly', 'Hotel location', 'In-game ready']::TEXT[], ARRAY['20$ شهرياً', 'موقع فندق', 'جاهز داخل اللعبة']::TEXT[], '20$ Monthly', 'images/products/mlo/Pearls.webp', 'hotel', NULL, true, false, 0),
  ('prod_13', 13, 'mlo', 'LaMesa Mechanic', 'لاميسا ميكانيكا', 'A mechanic workshop, ready for business.', 'ورشة ميكانيكا جاهزة للشغل.', 'LaMesa Mechanic — a mechanic workshop. Costs 20$ Monthly.', 'لاميسا ميكانيكا — ورشة ميكانيكا. التكلفة 20$ شهرياً.', ARRAY['20$ Monthly', 'Workshop location', 'In-game ready']::TEXT[], ARRAY['20$ شهرياً', 'موقع ورشة', 'جاهزة داخل اللعبة']::TEXT[], '20$ Monthly', 'images/products/mlo/LaMesa Mechanic.webp', 'mechanic', NULL, false, false, 0),
  ('prod_14', 14, 'mlo', 'Koi', 'كوي', 'A restaurant, ready for business.', 'مطعم جاهز للشغل.', 'Koi — a restaurant. Costs 15$ Monthly.', 'كوي — مطعم. التكلفة 15$ شهرياً.', ARRAY['15$ Monthly', 'Restaurant location', 'In-game ready']::TEXT[], ARRAY['15$ شهرياً', 'موقع مطعم', 'جاهز داخل اللعبة']::TEXT[], '15$ Monthly', 'images/products/mlo/Koi.webp', 'restaurant', NULL, false, false, 0),
  ('prod_15', 15, 'mlo', 'Horny''s', 'هورنيز', 'A restaurant, ready for business.', 'مطعم جاهز للشغل.', 'Horny''s — a restaurant. Costs 15$ Monthly.', 'هورنيز — مطعم. التكلفة 15$ شهرياً.', ARRAY['15$ Monthly', 'Restaurant location', 'In-game ready']::TEXT[], ARRAY['15$ شهرياً', 'موقع مطعم', 'جاهز داخل اللعبة']::TEXT[], '15$ Monthly', 'images/products/mlo/Horny''s.webp', 'restaurant', NULL, false, false, 0),
  ('prod_16', 16, 'mlo', 'Up n Atom', 'أب أند أتوم', 'A restaurant, ready for business.', 'مطعم جاهز للشغل.', 'Up n Atom — a restaurant. Costs 15$ Monthly.', 'أب أند أتوم — مطعم. التكلفة 15$ شهرياً.', ARRAY['15$ Monthly', 'Restaurant location', 'In-game ready']::TEXT[], ARRAY['15$ شهرياً', 'موقع مطعم', 'جاهز داخل اللعبة']::TEXT[], '15$ Monthly', 'images/products/mlo/Up n Atom.webp', 'restaurant', NULL, false, false, 0),
  ('prod_17', 17, 'mlo', 'Vanilla Unicorn', 'فانيلا يونيكورن', 'A nightclub, ready for business.', 'نادي ليلي جاهز للشغل.', 'Vanilla Unicorn — a nightclub. Costs 10$ Monthly.', 'فانيلا يونيكورن — نادي ليلي. التكلفة 10$ شهرياً.', ARRAY['10$ Monthly', 'Nightclub location', 'In-game ready']::TEXT[], ARRAY['10$ شهرياً', 'موقع نادي ليلي', 'جاهز داخل اللعبة']::TEXT[], '10$ Monthly', 'images/products/mlo/Vanilla Unicorn.webp', 'nightclub', NULL, false, false, 0),
  ('prod_18', 18, 'mlo', 'Exotic Dealership', 'إكزوتيك معرض سيارات', 'A car dealership, ready for business.', 'معرض سيارات جاهز للشغل.', 'Exotic Dealership — a car dealership. Costs 20$ Monthly.', 'إكزوتيك معرض سيارات — معرض سيارات. التكلفة 20$ شهرياً.', ARRAY['20$ Monthly', 'Dealership location', 'In-game ready']::TEXT[], ARRAY['20$ شهرياً', 'موقع معرض سيارات', 'جاهز داخل اللعبة']::TEXT[], '20$ Monthly', 'images/products/mlo/Exotic Dealership.webp', 'dealership', NULL, true, false, 0),
  ('prod_19', 19, 'mlo', 'Pizzeria', 'بيتزيريا', 'A restaurant, ready for business.', 'مطعم جاهز للشغل.', 'Pizzeria — a restaurant. Costs 15$ Monthly.', 'بيتزيريا — مطعم. التكلفة 15$ شهرياً.', ARRAY['15$ Monthly', 'Restaurant location', 'In-game ready']::TEXT[], ARRAY['15$ شهرياً', 'موقع مطعم', 'جاهز داخل اللعبة']::TEXT[], '15$ Monthly', 'images/products/mlo/Pizzeria.webp', 'restaurant', NULL, false, false, 0),
  ('prod_20', 20, 'mlo', 'Ottos Auto', 'أوتوز أوتو', 'A mechanic workshop, ready for business.', 'ورشة ميكانيكا جاهزة للشغل.', 'Ottos Auto — a mechanic workshop. Costs 20$ Monthly.', 'أوتوز أوتو — ورشة ميكانيكا. التكلفة 20$ شهرياً.', ARRAY['20$ Monthly', 'Workshop location', 'In-game ready']::TEXT[], ARRAY['20$ شهرياً', 'موقع ورشة', 'جاهز داخل اللعبة']::TEXT[], '20$ Monthly', 'images/products/mlo/Ottos Auto.webp', 'mechanic', NULL, false, false, 0),
  ('prod_21', 21, 'mlo', 'Bennys', 'بينيز', 'A mechanic workshop, ready for business.', 'ورشة ميكانيكا جاهزة للشغل.', 'Bennys — a mechanic workshop. Costs 20$ Monthly.', 'بينيز — ورشة ميكانيكا. التكلفة 20$ شهرياً.', ARRAY['20$ Monthly', 'Workshop location', 'In-game ready']::TEXT[], ARRAY['20$ شهرياً', 'موقع ورشة', 'جاهزة داخل اللعبة']::TEXT[], '20$ Monthly', 'images/products/mlo/Bennys.webp', 'mechanic', NULL, false, false, 0),
  ('prod_22', 22, 'mlo', 'Hayes', 'هايز', 'A mechanic workshop, ready for business.', 'ورشة ميكانيكا جاهزة للشغل.', 'Hayes — a mechanic workshop. Costs 20$ Monthly.', 'هايز — ورشة ميكانيكا. التكلفة 20$ شهرياً.', ARRAY['20$ Monthly', 'Workshop location', 'In-game ready']::TEXT[], ARRAY['20$ شهرياً', 'موقع ورشة', 'جاهزة داخل اللعبة']::TEXT[], '20$ Monthly', 'images/products/mlo/Hayes.webp', 'mechanic', NULL, true, false, 0),
  ('prod_23', 23, 'mlo', 'Pops Dinner', 'بوبز دينر', 'A restaurant, ready for business.', 'مطعم جاهز للشغل.', 'Pops Dinner — a restaurant. Costs 15$ Monthly.', 'بوبز دينر — مطعم. التكلفة 15$ شهرياً.', ARRAY['15$ Monthly', 'Restaurant location', 'In-game ready']::TEXT[], ARRAY['15$ شهرياً', 'موقع مطعم', 'جاهز داخل اللعبة']::TEXT[], '15$ Monthly', 'images/products/mlo/Pops Dinner.webp', 'restaurant', NULL, false, false, 0),
  ('prod_24', 24, 'mlo', 'Bean Machine', 'بين ماشين', 'A cafe, ready for business.', 'كافيه جاهز للشغل.', 'Bean Machine — a cafe. Costs 15$ Monthly.', 'بين ماشين — كافيه. التكلفة 15$ شهرياً.', ARRAY['15$ Monthly', 'Cafe location', 'In-game ready']::TEXT[], ARRAY['15$ شهرياً', 'موقع كافيه', 'جاهز داخل اللعبة']::TEXT[], '15$ Monthly', 'images/products/mlo/Bean Machine.webp', 'cafe', NULL, false, false, 0),
  ('prod_25', 25, 'mlo', 'Bahamas', 'بهامس', 'A nightclub, ready for business.', 'نادي ليلي جاهز للشغل.', 'Bahamas — a nightclub. Costs 10$ Monthly.', 'بهامس — نادي ليلي. التكلفة 10$ شهرياً.', ARRAY['10$ Monthly', 'Nightclub location', 'In-game ready']::TEXT[], ARRAY['10$ شهرياً', 'موقع نادي ليلي', 'جاهز داخل اللعبة']::TEXT[], '10$ Monthly', 'images/products/mlo/Bahamas.webp', 'nightclub', NULL, false, false, 0),
  ('prod_26', 26, 'mlo', 'Cat Cafe', 'كات كافيه', 'A restaurant, ready for business.', 'مطعم جاهز للشغل.', 'Cat Cafe — a restaurant. Costs 15$ Monthly.', 'كات كافيه — مطعم. التكلفة 15$ شهرياً.', ARRAY['15$ Monthly', 'Restaurant location', 'In-game ready']::TEXT[], ARRAY['15$ شهرياً', 'موقع مطعم', 'جاهز داخل اللعبة']::TEXT[], '15$ Monthly', 'images/products/mlo/Cat Cafe.webp', 'restaurant', NULL, true, false, 0),
  ('prod_27', 27, 'mlo', 'Burgershot', 'برغرشوت', 'A restaurant, ready for business.', 'مطعم جاهز للشغل.', 'Burgershot — a restaurant. Costs 15$ Monthly.', 'برغرشوت — مطعم. التكلفة 15$ شهرياً.', ARRAY['15$ Monthly', 'Restaurant location', 'In-game ready']::TEXT[], ARRAY['15$ شهرياً', 'موقع مطعم', 'جاهز داخل اللعبة']::TEXT[], '15$ Monthly', 'images/products/mlo/Burgershot.webp', 'restaurant', NULL, false, false, 0),
  ('prod_28', 28, 'vip', 'Car Radio', 'راديو السيارة', 'A VIP car radio, ready for use.', 'راديو سيارة VIP جاهز للاستخدام.', 'Car Radio — a VIP feature. Costs 10$ Monthly.', 'راديو السيارة — ميزة VIP. التكلفة 10$ شهرياً.', ARRAY['10$ Monthly', 'VIP feature', 'In-game ready']::TEXT[], ARRAY['10$ شهرياً', 'ميزة VIP', 'جاهز داخل اللعبة']::TEXT[], '10$ Monthly', 'images/products/vip/car radio.webp', NULL, NULL, false, true, 0),
  ('prod_29', 29, 'mlo', 'Pearls Restaurant', 'مطعم بيرلز', 'A restaurant, ready for business.', 'مطعم جاهز للشغل.', 'Pearls Restaurant — a restaurant. Costs 15$ Monthly.', 'مطعم بيرلز — مطعم. التكلفة 15$ شهرياً.', ARRAY['15$ Monthly', 'Restaurant location', 'In-game ready']::TEXT[], ARRAY['15$ شهرياً', 'موقع مطعم', 'جاهز داخل اللعبة']::TEXT[], '15$ Monthly', 'images/products/mlo/Pearls.webp', 'restaurant', NULL, false, false, 0),
  ('prod_30', 30, 'bundles', 'Pearls Combo', 'كومبو بيرلز', 'Hotel business & restaurant combo, costs 30$ instead of 35$.', 'كومبو الفندق والمطعم، بـ30$ بدل 35$.', 'Pearls Combo — Hotel Business & Restaurant. Costs 30$ instead of 35$.', 'كومبو بيرلز — الفندق والمطعم. التكلفة 30$ بدل 35$.', ARRAY['30$ Monthly (instead of 35$)', 'Hotel Business + Restaurant', 'In-game ready']::TEXT[], ARRAY['30$ شهرياً (بدل 35$)', 'الفندق + المطعم', 'جاهز داخل اللعبة']::TEXT[], '30$ Monthly', 'images/products/mlo/Pearls.webp', NULL, NULL, true, false, 0),
  ('prod_31', 31, 'mlo', 'Ottos Auto Used Car Dealer', 'أوتوز أوتو معرض سيارات مستعملة', 'A used car dealer, ready for business.', 'معرض سيارات مستعملة جاهز للشغل.', 'Ottos Auto Used Car Dealer — a used car dealer. Costs 20$ Monthly.', 'أوتوز أوتو معرض سيارات مستعملة — معرض سيارات مستعملة. التكلفة 20$ شهرياً.', ARRAY['20$ Monthly', 'Dealership location', 'In-game ready']::TEXT[], ARRAY['20$ شهرياً', 'موقع معرض سيارات', 'جاهز داخل اللعبة']::TEXT[], '20$ Monthly', 'images/products/mlo/Ottos Auto.webp', 'dealership', NULL, false, false, 0),
  ('prod_32', 32, 'bundles', 'Ottos Auto Combo', 'كومبو أوتوز أوتو', 'Mechanic & used car dealer combo, costs 35$ instead of 40$.', 'كومبو الميكانيكا ومعرض السيارات، بـ35$ بدل 40$.', 'Ottos Auto Combo — Mechanic & Used Car Dealer. Costs 35$ instead of 40$.', 'كومبو أوتوز أوتو — الميكانيكا ومعرض السيارات المستعملة. التكلفة 35$ بدل 40$.', ARRAY['35$ Monthly (instead of 40$)', 'Mechanic + Used Car Dealer', 'In-game ready']::TEXT[], ARRAY['35$ شهرياً (بدل 40$)', 'الميكانيكا + معرض السيارات المستعملة', 'جاهز داخل اللعبة']::TEXT[], '35$ Monthly', 'images/products/mlo/Ottos Auto.webp', NULL, NULL, false, false, 0),
  ('prod_33', 33, 'vehicles', 'Preview Class S', 'عرض كلاس S', 'Vehicle preview for Class S.', 'عربية بريفيو لكلاس S.', 'Preview vehicle — Class S. Replace with the real one.', 'عربية بريفيو — كلاس S. هتتستبدل بالحقيقية.', ARRAY['20$ Monthly', '100$ Per Season', 'In-game ready']::TEXT[], ARRAY['20$ شهرياً', '100$ للموسم', 'جاهزة داخل اللعبة']::TEXT[], '20$ Monthly', NULL, NULL, 'S', false, false, 0),
  ('prod_34', 34, 'vehicles', 'Preview Class S+', 'عرض كلاس S+', 'Vehicle preview for Class S+.', 'عربية بريفيو لكلاس S+.', 'Preview vehicle — Class S+. Replace with the real one.', 'عربية بريفيو — كلاس S+. هتتستبدل بالحقيقية.', ARRAY['25$ Monthly', '150$ Per Season', 'In-game ready']::TEXT[], ARRAY['25$ شهرياً', '150$ للموسم', 'جاهزة داخل اللعبة']::TEXT[], '25$ Monthly', NULL, NULL, 'S+', false, false, 0),
  ('prod_35', 35, 'vehicles', 'Preview Class S++', 'عرض كلاس S++', 'Vehicle preview for Class S++.', 'عربية بريفيو لكلاس S++.', 'Preview vehicle — Class S++. Replace with the real one.', 'عربية بريفيو — كلاس S++. هتتستبدل بالحقيقية.', ARRAY['30$ Monthly', '200$ Per Season', 'In-game ready']::TEXT[], ARRAY['30$ شهرياً', '200$ للموسم', 'جاهزة داخل اللعبة']::TEXT[], '30$ Monthly', NULL, NULL, 'S++', false, false, 0),
  ('prod_36', 36, 'vehicles', 'Preview Class X', 'عرض كلاس X', 'Vehicle preview for Class X.', 'عربية بريفيو لكلاس X.', 'Preview vehicle — Class X. Replace with the real one.', 'عربية بريفيو — كلاس X. هتتستبدل بالحقيقية.', ARRAY['40$ Monthly', '250$ Per Season', 'In-game ready']::TEXT[], ARRAY['40$ شهرياً', '250$ للموسم', 'جاهزة داخل اللعبة']::TEXT[], '40$ Monthly', NULL, NULL, 'X', false, false, 0),
  ('prod_37', 37, 'vip', 'Custom Car Plate', 'لوحة سيارة مخصصة', 'A custom car plate, one-time purchase.', 'لوحة سيارة مخصصة، شراء لمرة واحدة.', 'Custom Car Plate — get your own custom plate. Costs 5$ One Time.', 'لوحة سيارة مخصصة — احصل على لوحتك الخاصة. التكلفة 5$ لمرة واحدة.', ARRAY['5$ One Time', 'Custom plate text', 'In-game ready']::TEXT[], ARRAY['5$ لمرة واحدة', 'نص مخصص للوحة', 'جاهز داخل اللعبة']::TEXT[], '5$ One Time', 'images/products/vip/plat.webp', NULL, NULL, false, true, 0),
  ('prod_38', 38, 'vip', 'Custom Phone Number', 'رقم تليفون مخصص', 'A custom phone number, one-time purchase.', 'رقم تليفون مخصص، شراء لمرة واحدة.', 'Custom Phone Number — get your own custom number. Costs 5$ One Time.', 'رقم تليفون مخصص — احصل على رقمك الخاص. التكلفة 5$ لمرة واحدة.', ARRAY['5$ One Time', 'Custom number', 'In-game ready']::TEXT[], ARRAY['5$ لمرة واحدة', 'رقم مخصص', 'جاهز داخل اللعبة']::TEXT[], '5$ One Time', 'images/products/vip/custom phone numbers.webp', NULL, NULL, false, true, 0),
  ('prod_39', 39, 'mlo', 'Al Dente''s', 'أل دينتيز', 'A restaurant, ready for business.', 'مطعم جاهز للشغل.', 'Al Dente''s restaurant — a restaurant. Costs 15$ Monthly.', 'أل دينتيز — مطعم. التكلفة 15$ شهرياً.', ARRAY['15$ Monthly', 'Restaurant location', 'In-game ready']::TEXT[], ARRAY['15$ شهرياً', 'موقع مطعم', 'جاهزة داخل اللعبة']::TEXT[], '15$ Monthly', 'images/products/mlo/prod-1785937000094.webp', 'restaurant', NULL, false, false, 0);

-- Foreign keys. ProductPrice (the trusted pricing registry) is linked to the
-- canonical catalog by the legacy numeric productId — one price row per product.

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("productId") ON DELETE RESTRICT ON UPDATE CASCADE;

------ END: HOT PURSUIT RP - Phase 7 (Store catalog + Admin products) ------
