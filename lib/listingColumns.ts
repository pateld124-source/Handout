// Column lists for listing queries that also run for signed-out visitors.
//
// contact_phone is left out on purpose: db/hide-listing-phones.sql takes away
// the guests' right to read that column, so a guest query that says select('*')
// would fail once it has run. Signed-in pages (under /student, /vendor, /admin)
// may keep select('*'). If a column is added to one of these tables and guests
// should see it, add it here AND re-run db/hide-listing-phones.sql.

// Each list is ONE string literal on purpose: supabase-js reads the literal's type,
// and joining strings with + would make every result type GenericStringError.
export const ROOMMATE_PUBLIC_COLUMNS = 'id, user_id, listing_type, title, description, location, rent, room_type, gender_preference, available_from, media, occupancy, diet, smoking, pets, university, is_active, created_at, sublet_end_date, rent_min, rent_max, bathroom, furnished, lease_length, amenities, utilities';

export const SERVICE_PUBLIC_COLUMNS = 'id, user_id, title, category, description, rate, rate_type, location, is_active, created_at, details';

export const TIFFIN_PUBLIC_COLUMNS = 'id, user_id, name, cuisine, diet_type, description, price_per_meal, price_per_month, location, is_active, created_at, price_per_week, meals_per_day, weekly_menu';
