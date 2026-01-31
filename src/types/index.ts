export type Role = 'student' | 'teacher' | 'admin';

export interface Profile {
    id: string;
    email: string;
    full_name: string;
    role: Role;
    created_at: string;
}
