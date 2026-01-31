export type Role = 'student' | 'teacher' | 'admin';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: Role;
    created_at: string;
}

export type QuestionType = 'mcq' | 'short_answer';

export interface Question {
    id?: string;
    quiz_id?: string;
    question_text: string;
    question_type: QuestionType;
    options?: string[]; // jsonb in DB
    correct_option?: number; // Index for MCQ
    correct_answer?: string; // For short_answer
    created_at?: string;
}

export interface Quiz {
    id: string;
    title: string;
    classroom_id: string;
    time_limit_minutes: number;
    created_by: string;
    is_published: boolean;
    created_at: string;
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    classroom_id: string;
    created_at: string;
    created_by: string;
    profiles?: {
        full_name: string;
    }
}
