import React, { useState } from 'react';
import { X, Upload, FileText, Video } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface UploadMaterialModalProps {
    isOpen: boolean;
    onClose: () => void;
    classroomId: string;
    onSuccess: () => void;
}

export default function UploadMaterialModal({ isOpen, onClose, classroomId, onSuccess }: UploadMaterialModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('pdf');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    if (!isOpen) return null;

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !file) return;

        setUploading(true);
        try {
            // 1. Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${classroomId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('materials')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('materials')
                .getPublicUrl(filePath);

            // 3. Create Record
            const { error: dbError } = await supabase
                .from('materials')
                .insert({
                    title,
                    description,
                    type,
                    file_url: publicUrl,
                    classroom_id: classroomId,
                    created_by: user.id
                });

            if (dbError) throw dbError;

            toast.success('Material uploaded successfully!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">Upload Material</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleUpload} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                        <input
                            type="text"
                            required
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                            placeholder="Lecture 1 Notes"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg outline-none focus:border-blue-500"
                            placeholder="Brief summary of the material..."
                            rows={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Type</label>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setType('pdf')}
                                className={`flex items-center justify-center gap-2 p-3 border rounded-lg ${type === 'pdf' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200'}`}
                            >
                                <FileText className="w-4 h-4" /> PDF/Doc
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('video')}
                                className={`flex items-center justify-center gap-2 p-3 border rounded-lg ${type === 'video' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200'}`}
                            >
                                <Video className="w-4 h-4" /> Video
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">File</label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative">
                            <input
                                type="file"
                                onChange={e => setFile(e.target.files?.[0] || null)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                accept={type === 'video' ? 'video/*' : '.pdf,.doc,.docx,.ppt,.pptx'}
                                required
                            />
                            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">
                                {file ? file.name : 'Click to select file'}
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={uploading}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </form>
            </div>
        </div>
    );
}
