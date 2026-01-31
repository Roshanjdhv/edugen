import React, { useState } from 'react';
import { X, Megaphone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface CreateAnnouncementModalProps {
    isOpen: boolean;
    onClose: () => void;
    classroomId: string;
    onSuccess: () => void;
}

export default function CreateAnnouncementModal({ isOpen, onClose, classroomId, onSuccess }: CreateAnnouncementModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            const { error } = await supabase
                .from('announcements')
                .insert({
                    title,
                    content,
                    classroom_id: classroomId,
                    created_by: user.id
                });

            if (error) throw error;

            toast.success('Announcement posted successfully!');
            setTitle('');
            setContent('');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Failed to post announcement');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Megaphone className="w-6 h-6 text-blue-600" />
                        New Announcement
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
                            placeholder="Important Update"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Content</label>
                        <textarea
                            required
                            value={content}
                            onChange={e => setContent(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                            placeholder="Write your announcement here..."
                            rows={4}
                        />
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
                            {loading ? 'Posting...' : 'Post Announcement'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
