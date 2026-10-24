
-- Up Migration

ALTER TABLE public.cars
    ADD COLUMN category TEXT NOT NULL DEFAULT 'other',
    ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.cars
    ADD CONSTRAINT cars_category_not_blank
    CHECK (LENGTH(TRIM(category)) > 0);

ALTER TABLE public.cars
    ADD CONSTRAINT cars_quantity_non_negative
    CHECK (quantity >= 0);

-- Down Migration

ALTER TABLE public.cars
    DROP CONSTRAINT IF EXISTS cars_quantity_non_negative;

ALTER TABLE public.cars
    DROP CONSTRAINT IF EXISTS cars_category_not_blank;

ALTER TABLE public.cars
    DROP COLUMN IF EXISTS quantity;

ALTER TABLE public.cars
    DROP COLUMN IF EXISTS category;
