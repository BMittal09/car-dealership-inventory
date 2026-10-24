
-- Up Migration

CREATE TABLE public.cars (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INTEGER NOT NULL,

    price NUMERIC(12, 2) NOT NULL,
    mileage INTEGER NOT NULL,

    fuel_type TEXT NOT NULL,
    transmission TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'available',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT cars_make_not_blank
        CHECK (LENGTH(TRIM(make)) > 0),

    CONSTRAINT cars_model_not_blank
        CHECK (LENGTH(TRIM(model)) > 0),

    CONSTRAINT cars_year_check
        CHECK (year BETWEEN 1886 AND 2100),

    CONSTRAINT cars_price_check
        CHECK (price >= 0),

    CONSTRAINT cars_mileage_check
        CHECK (mileage >= 0),

    CONSTRAINT cars_fuel_type_check
        CHECK (
            fuel_type IN (
                'petrol',
                'diesel',
                'electric',
                'hybrid',
                'cng'
            )
        ),

    CONSTRAINT cars_transmission_check
        CHECK (
            transmission IN (
                'manual',
                'automatic'
            )
        ),

    CONSTRAINT cars_status_check
        CHECK (
            status IN (
                'available',
                'reserved',
                'sold'
            )
        )
);

-- Down Migration

DROP TABLE public.cars;
