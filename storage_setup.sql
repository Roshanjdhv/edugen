-- Create the "materials" bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('materials', 'materials', true)
ON CONFLICT (id) DO NOTHING;

-- Create the "assignments" bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('assignments', 'assignments', true)
ON CONFLICT (id) DO NOTHING;

-- Create the "classrooms" bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('classrooms', 'classrooms', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for "materials" bucket
CREATE POLICY "materials_public_access" ON storage.objects FOR SELECT USING (bucket_id = 'materials');
CREATE POLICY "materials_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'materials' AND auth.role() = 'authenticated');

-- Policies for "assignments" bucket
CREATE POLICY "assignments_public_access" ON storage.objects FOR SELECT USING (bucket_id = 'assignments');
CREATE POLICY "assignments_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'assignments' AND auth.role() = 'authenticated');

-- Policies for "classrooms" bucket
CREATE POLICY "classrooms_public_access" ON storage.objects FOR SELECT USING (bucket_id = 'classrooms');
CREATE POLICY "classrooms_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'classrooms' AND auth.role() = 'authenticated');
