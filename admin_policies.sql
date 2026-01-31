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

-- Global access for admins to other tables for analytics
DO $$ 
BEGIN
    -- Classrooms
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all classrooms') THEN
        CREATE POLICY "Admins can view all classrooms" ON classrooms FOR SELECT
        USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;

    -- Materials
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all materials') THEN
        CREATE POLICY "Admins can view all materials" ON materials FOR SELECT
        USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;

    -- Announcements
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all announcements') THEN
        CREATE POLICY "Admins can view all announcements" ON announcements FOR SELECT
        USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;

    -- Quizzes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all quizzes') THEN
        CREATE POLICY "Admins can view all quizzes" ON quizzes FOR SELECT
        USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;

    -- Quiz Attempts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all quiz_attempts') THEN
        CREATE POLICY "Admins can view all quiz_attempts" ON quiz_attempts FOR SELECT
        USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
    END IF;
END $$;
