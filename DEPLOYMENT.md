# V2 deployment

Public application: https://olegmikhc.github.io/development-modeler-v2/

Push main to trigger `.github/workflows/pages.yml`. GitHub Pages uses GitHub Actions and serves the static `out/` build with base path `/development-modeler-v2`.

Cloud configuration uses repository Actions variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key only, never a service-role key). Apply `supabase/migrations/001` through `004` in order to the new Supabase project. Set Supabase Auth Site URL to the application URL and allow its `/login/` redirect. Cloud access is controlled by authenticated ownership/membership and row-level security; a sharing token grants temporary read-only access to one model.

Without these variables, local models and JSON exchange work; cloud sharing is unavailable. Browser-local data does not move between origins: export from the previous application and import into this one.

The original development-modeler repository and database are independent and must not be overwritten.
