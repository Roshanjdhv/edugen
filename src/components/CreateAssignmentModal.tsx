import React, { useState } from 'react';
import { X, ClipboardList, Upload, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface CreateAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    classroomId: string;
    onSuccess: () => void;
}

export default function CreateAssignmentModal({ isOpen, onClose, classroomId, onSuccess }: CreateAssignmentModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            let fileUrl = '';
            if (file) {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `assignments/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('assignments')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('assignments')
                    .getPublicUrl(filePath);

                fileUrl = publicUrl;
            }

            const { error } = await supabase
                .from('assignments')
                .insert({
                    title,
                    content,
                    classroom_id: classroomId,
                    created_by: user.id,
                    due_date: dueDate || null,
                    file_url: fileUrl || null
                });

            if (error) throw error;

            toast.success('Assignment posted successfully!');
            setTitle('');
            setContent('');
            setDueDate('');
            setFile(null);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to post assignment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-blue-600" />
                        Create Assignment
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                            placeholder="Home Assignment 1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Instructions</label>
                        <textarea
                            required
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                            placeholder="Detailed instructions for the assignment..."
                            rows={4}
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Due Date
                            </label>
                            <input
                                type="datetime-local"
                                value={dueDate}
                                onChange={e => setDueDate(e.target.value)}
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                <Upload className="w-4 h-4" />
                                Attachment (Optional)
                            </label>
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Assignment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
