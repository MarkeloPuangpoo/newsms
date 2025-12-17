-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS (for cleaner role management, though strictly roles are text in the prompt, enums are safer)
CREATE TYPE user_role AS ENUM ('superadmin', 'teacher', 'student');

-- 2. PROFILES (Extends auth.users)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'student',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TEACHERS (Extended details)
CREATE TABLE public.teachers (
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    employee_id TEXT UNIQUE NOT NULL,
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. STUDENTS (Extended details)
CREATE TABLE public.students (
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    student_code TEXT UNIQUE NOT NULL,
    grade_level TEXT, -- e.g. "Grade 10"
    class_room TEXT,  -- e.g. "10-A"
    total_behavior_score INTEGER DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. COURSES
CREATE TABLE public.courses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    teacher_id UUID REFERENCES public.teachers(profile_id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ENROLLMENTS (Junction)
CREATE TABLE public.enrollments (
    student_id UUID REFERENCES public.students(profile_id) ON DELETE CASCADE,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (student_id, course_id)
);

-- 7. SCHEDULES
CREATE TABLE public.schedules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    day_of_week TEXT NOT NULL, -- e.g. "Monday"
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BEHAVIOR LOGS
CREATE TABLE public.behavior_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    student_id UUID REFERENCES public.students(profile_id) ON DELETE CASCADE,
    recorded_by_teacher_id UUID REFERENCES public.teachers(profile_id) ON DELETE SET NULL,
    score_change INTEGER NOT NULL, -- can be negative
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. MESSAGES
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- link to raw user to be generic
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Helper to get current user role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role AS $$
BEGIN
  RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLICIES

-- PROFILES
-- Everyone can read basics, but maybe restricted? Let's allow authenticated read for now so people can see names.
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- TEACHERS
CREATE POLICY "Teachers viewable by authenticated" ON public.teachers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Superadmin manages teachers" ON public.teachers FOR ALL USING (public.get_my_role() = 'superadmin');

-- STUDENTS
CREATE POLICY "Students viewable by authenticated" ON public.students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Superadmin manages students" ON public.students FOR ALL USING (public.get_my_role() = 'superadmin');

-- COURSES
CREATE POLICY "Courses viewable by authenticated" ON public.courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Teachers/Admin manage courses" ON public.courses FOR ALL USING (public.get_my_role() IN ('superadmin', 'teacher'));

-- ENROLLMENTS
CREATE POLICY "Enrollments viewable" ON public.enrollments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Teachers/Admin manage enrollments" ON public.enrollments FOR ALL USING (public.get_my_role() IN ('superadmin', 'teacher'));

-- BEHAVIOR LOGS
-- Student can see their own
CREATE POLICY "Student sees own logs" ON public.behavior_logs FOR SELECT USING (auth.uid() = student_id);
-- Teachers can see all and insert
CREATE POLICY "Teachers see all logs" ON public.behavior_logs FOR SELECT USING (public.get_my_role() IN ('teacher', 'superadmin'));
CREATE POLICY "Teachers insert logs" ON public.behavior_logs FOR INSERT WITH CHECK (public.get_my_role() = 'teacher');

-- MESSAGES
CREATE POLICY "Users see their own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);


-- AUTOMATION: Behavior Score Update
CREATE OR REPLACE FUNCTION update_student_behavior_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.students
  SET total_behavior_score = total_behavior_score + NEW.score_change
  WHERE profile_id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_behavior_log_added
AFTER INSERT ON public.behavior_logs
FOR EACH ROW
EXECUTE FUNCTION update_student_behavior_score();

-- HANDLE NEW USER SETUP (Trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', (new.raw_user_meta_data->>'role')::user_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
