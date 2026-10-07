# AAP Trade Fair Vendor Registration
Static site (HTML/CSS/vanilla JS) + Supabase (database & admin auth). Deploy the folder to Netlify, Vercel or GitHub Pages.

## Setup
1. Create a Supabase project. In **SQL Editor**, run `supabase-schema.sql`.
2. **Authentication → Providers → Email**: turn OFF "Allow new users to sign up" (any authenticated user is treated as admin). Then **Authentication → Users → Add user** to create admin accounts.
3. Edit `config.js` with your Project URL and **anon/public** key (Settings → API).
   **Only the anon key belongs here. NEVER put the service-role key in the website.**
4. Replace `assets/aap-logo.png` with the official logo (a crop from the supplied flyer is included).
5. Deploy. Vendors use `index.html`; admins use `admin.html`.

## Security notes
- RLS is on: anonymous users can only INSERT (via `register_vendor`); they cannot SELECT/UPDATE/DELETE.
- Registration number (sequence-based, unique), stall rate and total are set by a database trigger; browser-supplied totals are ignored.
- "Edit information" re-opens the form; resubmitting creates a new record/number (vendors cannot update records). Admin can delete duplicates in Supabase.
- Printing uses `window.print()`; choose "Save as PDF" in the print dialog.
