-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Publicly readable, only updateable by self)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  role text check (role in ('student', 'teacher', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- CLASSROOMS
create table public.classrooms (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text unique not null,
  description text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.classrooms enable row level security;

create policy "Classrooms are viewable by everyone"
  on classrooms for select
  using ( true );

create policy "Teachers can create classrooms"
  on classrooms for insert
  with check ( exists ( select 1 from profiles where id = auth.uid() and role = 'teacher' ) );

create policy "Teachers can update their own classrooms"
  on classrooms for update
  using ( created_by = auth.uid() );

-- CLASSROOM MEMBERS (Students joining classrooms)
create table public.classroom_students (
  id uuid default uuid_generate_v4() primary key,
  classroom_id uuid references public.classrooms(id) not null,
  student_id uuid references public.profiles(id) not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(classroom_id, student_id)
);

alter table public.classroom_students enable row level security;

create policy "Members viewable by classroom participants"
  on classroom_students for select
  using ( true ); -- Simplified for now, can refine to only members or teachers

create policy "Students can join classrooms"
  on classroom_students for insert
  with check ( auth.uid() = student_id );

-- MATERIALS (Files)
create table public.materials (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text,
  file_url text not null,
  type text check (type in ('pdf', 'ppt', 'docx', 'video', 'exam')),
  classroom_id uuid references public.classrooms(id) not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.materials enable row level security;

create policy "View materials if member of classroom"
  on materials for select
  using (
    exists (
      select 1 from classroom_students
      where classroom_students.classroom_id = materials.classroom_id
      and classroom_students.student_id = auth.uid()
    )
    or
    created_by = auth.uid()
  );

create policy "Teachers can insert materials"
  on materials for insert
  with check ( created_by = auth.uid() );

-- ANNOUNCEMENTS
create table public.announcements (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  classroom_id uuid references public.classrooms(id) not null,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.announcements enable row level security;

create policy "View announcements if member"
  on announcements for select
  using (
    exists (
      select 1 from classroom_students
      where classroom_students.classroom_id = announcements.classroom_id
      and classroom_students.student_id = auth.uid()
    )
    or
    created_by = auth.uid()
  );

create policy "Teachers can create announcements"
  on announcements for insert
  with check ( created_by = auth.uid() );

-- QUIZZES
create table public.quizzes (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  classroom_id uuid references public.classrooms(id) not null,
  time_limit_minutes integer default 30,
  created_by uuid references public.profiles(id) not null,
  is_published boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quizzes enable row level security;

create policy "Teachers can CRUD quizzes"
  on quizzes for all
  using ( created_by = auth.uid() );

create policy "Students can view published quizzes"
  on quizzes for select
  using (
    is_published = true
    and
    exists (
      select 1 from classroom_students
      where classroom_students.classroom_id = quizzes.classroom_id
      and classroom_students.student_id = auth.uid()
    )
  );

-- QUESTIONS
create table public.questions (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  question_text text not null,
  question_type text check (question_type in ('mcq', 'short_answer')) default 'mcq',
  options jsonb, -- Nullable for short_answer
  correct_option integer, -- Nullable for short_answer
  correct_answer text, -- For short_answer
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.questions enable row level security;

create policy "Teachers can CRUD questions"
  on questions for all
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = questions.quiz_id
      and quizzes.created_by = auth.uid()
    )
  );

create policy "Students can view questions of published quizzes"
  on questions for select
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = questions.quiz_id
      and quizzes.is_published = true
      and exists (
         select 1 from classroom_students
         where classroom_students.classroom_id = quizzes.classroom_id
         and classroom_students.student_id = auth.uid()
      )
    )
  );

-- QUIZ ATTEMPTS
create table public.quiz_attempts (
  id uuid default uuid_generate_v4() primary key,
  quiz_id uuid references public.quizzes(id) on delete cascade not null,
  student_id uuid references public.profiles(id) not null,
  score integer,
  completed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quiz_attempts enable row level security;

create policy "Students can view own attempts"
  on quiz_attempts for select
  using ( student_id = auth.uid() );

create policy "Students can insert attempts"
  on quiz_attempts for insert
  with check ( student_id = auth.uid() );

create policy "Teachers can view attempts of their quizzes"
  on quiz_attempts for select
  using (
    exists (
      select 1 from quizzes
      where quizzes.id = quiz_attempts.quiz_id
      and quizzes.created_by = auth.uid()
    )
  );

-- QUIZ ANSWERS
create table public.quiz_answers (
  id uuid default uuid_generate_v4() primary key,
  attempt_id uuid references public.quiz_attempts(id) on delete cascade not null,
  question_id uuid references public.questions(id) on delete cascade not null,
  answer text, -- Index for MCQ or text for short_answer
  is_correct boolean
);

alter table public.quiz_answers enable row level security;

create policy "Teachers can view answers"
  on quiz_answers for select
  using (
    exists (
      select 1 from quiz_attempts
      join quizzes on quizzes.id = quiz_attempts.quiz_id
      where quiz_attempts.id = quiz_answers.attempt_id
      and quizzes.created_by = auth.uid()
    )
  );

create policy "Students can view own answers"
  on quiz_answers for select
  using (
    exists (
      select 1 from quiz_attempts
      where quiz_attempts.id = quiz_answers.attempt_id
      and quiz_attempts.student_id = auth.uid()
    )
  );

-- STUDENT INTERACTIONS (For Heatmap/Activity)
create table public.student_interactions (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade not null,
  interaction_type text not null, -- 'login', 'quiz_start', 'material_view', etc.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.student_interactions enable row level security;

create policy "Users can view own interactions"
  on student_interactions for select
  using ( student_id = auth.uid() );

create policy "Teachers can view interactions of their students"
  on student_interactions for select
  using (
    exists (
      select 1 from classroom_students
      join classrooms on classrooms.id = classroom_students.classroom_id
      where classroom_students.student_id = student_interactions.student_id
      and classrooms.created_by = auth.uid()
    )
  );

-- EXIT TICKETS (For Sentiment Analysis)
create table public.exit_tickets (
  id uuid default uuid_generate_v4() primary key,
  classroom_id uuid references public.classrooms(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  sentiment text check (sentiment in ('happy', 'neutral', 'sad')) not null,
  feedback text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.exit_tickets enable row level security;

create policy "Students can insert exit tickets"
  on exit_tickets for insert
  with check ( student_id = auth.uid() );

create policy "Teachers can view exit tickets for their classrooms"
  on exit_tickets for select
  using (
    exists (
      select 1 from classrooms
      where classrooms.id = exit_tickets.classroom_id
      and classrooms.created_by = auth.uid()
    )
  );
