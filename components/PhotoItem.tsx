import React, { useState, useEffect } from 'react';
import { getPhoto } from '../utils/db';
import { CameraIcon } from './icons/Icons';

interface PhotoItemProps {
    projectId: number;
    photo: { id: number; description: string; };
    className?: string;
}

const PhotoItem: React.FC<PhotoItemProps> = ({ projectId, photo, className }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        getPhoto(projectId, photo.id).then(url => {
            if (isMounted) {
                setImageUrl(url);
                setIsLoading(false);
            }
        }).catch(() => {
            if (isMounted) {
                setIsLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, [projectId, photo.id]);

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center bg-gray-200 animate-pulse ${className}`}>
                 <CameraIcon className="w-12 h-12 text-gray-400" />
            </div>
        );
    }
    
    if (!imageUrl) {
        return (
             <div className={`flex items-center justify-center bg-gray-100 text-gray-500 text-sm text-center p-2 ${className}`}>
                <p>Image not found</p>
            </div>
        );
    }

    return <img src={imageUrl} alt={photo.description} className={className} />;
}

export default PhotoItem;
