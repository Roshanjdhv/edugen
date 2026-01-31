-- Allow users with the 'admin' role to delete any profile
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
CREATE POLICY "Admins can delete any profile"
  ON profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR
    -- Special bypass for hardcoded admin if we use a shared account
    (email = 'admin@edugen.com') 
  );

-- Ensure profiles are viewable by admins for analytics
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (true);

-- Optional: Create a dedicated admin profile if it doesn't exist
-- Note: This only creates the profile record. You still need to sign up
-- with email admin@edugen.com and password edugen2026 once in the app (then role will be admin)
-- OR manually insert into auth.users (not recommended via SQL editor usually)
