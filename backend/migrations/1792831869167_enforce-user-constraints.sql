-- Up Migration

CREATE UNIQUE INDEX users_email_unique
    ON public.users (LOWER(email));

ALTER TABLE public.users
    ADD CONSTRAINT users_role_check
    CHECK (role IN ('user', 'admin'));

-- Down Migration

ALTER TABLE public.users
    DROP CONSTRAINT users_role_check;

DROP INDEX public.users_email_unique;