-- The (day, band) index already serves every read; this one only competed with
-- the tagging UPDATE's own "villagePcode IS NULL" predicate.
DROP INDEX IF EXISTS "FireHotspot_villagePcode_idx";
