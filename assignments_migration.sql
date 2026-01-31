-- ASSIGNMENTS TABLE
CREATE TABLE public.assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE NOT NULL,
    created_by UUID REFERENCES public.profiles(id) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "View assignments if member of classroom"
  ON assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classroom_students
      WHERE classroom_students.classroom_id = assignments.classroom_id
      AND classroom_students.student_id = auth.uid()
    )
    OR
    created_by = auth.uid()
  );

CREATE POLICY "Teachers can insert assignments"
  ON assignments FOR INSERT
  WITH CHECK ( created_by = auth.uid() );

CREATE POLICY "Teachers can update their own assignments"
  ON assignments FOR UPDATE
  USING ( created_by = auth.uid() );

CREATE POLICY "Teachers can delete their own assignments"
  ON assignments FOR DELETE
  USING ( created_by = auth.uid() );
