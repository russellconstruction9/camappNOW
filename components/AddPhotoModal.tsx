import React, { useState, useRef } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';
import { CameraIcon } from './icons/Icons';

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};

const AddPhotoModal: React.FC<AddPhotoModalProps> = ({ isOpen, onClose, projectId }) => {
    const { addPhoto } = useData();
    const [description, setDescription] = useState('');
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files) {
            const newFiles = Array.from(files);
            const dataUrlPromises = newFiles.map(fileToDataUrl);
            const newDataUrls = await Promise.all(dataUrlPromises);
            setImagePreviews(prev => [...prev, ...newDataUrls]);
        }
    };

    const handleRemoveImage = (indexToRemove: number) => {
        setImagePreviews(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (imagePreviews.length === 0 || !description) {
            alert('Please select at least one image and add a description.');
            return;
        }
        
        await addPhoto(projectId, imagePreviews, description);
        
        // Reset state and close
        setDescription('');
        setImagePreviews([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        onClose();
    };
    
    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Photo to Log">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Photos ({imagePreviews.length})</label>
                     <div className="mt-1 grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-square">
                                <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveImage(index)}
                                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                    aria-label={`Remove image ${index + 1}`}
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        <button 
                            type="button"
                            className="flex flex-col justify-center items-center p-2 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-blue-500 transition-colors aspect-square focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            onClick={triggerFileInput}
                        >
                            <CameraIcon className="mx-auto h-8 w-8 text-gray-400" />
                            <span className="mt-1 text-xs text-center text-gray-600">Add Photo(s)</span>
                        </button>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </div>
                 <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description / Daily Log</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="e.g., 'Completed foundation pour for the east wing.'"
                        required
                    />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                    <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={imagePreviews.length === 0 || !description}>Add to Project</Button>
                </div>
            </form>
        </Modal>
    );
};

export default AddPhotoModal;
