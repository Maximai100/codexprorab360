import React, { useState, useRef, useCallback } from 'react';
import { RoomImage } from '../../types';
import { IconImage, IconClose } from './Icon';

interface ImageUploadProps {
    images: RoomImage[];
    onImagesChange: (images: RoomImage[]) => void;
    roomName: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ 
    images, 
    onImagesChange, 
    roomName 
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const newImages: RoomImage[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Validate file type
            if (!file.type.startsWith('image/')) {
                alert(`Файл "${file.name}" не является изображением`);
                continue;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert(`Файл "${file.name}" слишком большой (максимум 5MB)`);
                continue;
            }

            try {
                const url = await convertFileToUrl(file);
                const roomImage: RoomImage = {
                    id: `img_${Date.now()}_${i}`,
                    url,
                    name: file.name,
                    size: file.size,
                    uploadedAt: new Date().toISOString()
                };
                newImages.push(roomImage);
            } catch (error) {
                console.error('Error processing file:', error);
                alert(`Ошибка при обработке файла "${file.name}"`);
            }
        }

        if (newImages.length > 0) {
            onImagesChange([...images, ...newImages]);
        }

        setIsUploading(false);
    }, [images, onImagesChange]);

    const convertFileToUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        handleFileSelect(files);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const handleRemoveImage = (imageId: string) => {
        onImagesChange(images.filter(img => img.id !== imageId));
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="image-upload-block">
            <div 
                className="image-upload-header" 
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="image-upload-icon">
                    <IconImage />
                </div>
                <div className="image-upload-title">
                    <h4>Изображения "{roomName}"</h4>
                    <span className="images-count">
                        {images.length} {images.length === 1 ? 'изображение' : 'изображений'}
                    </span>
                </div>
                <div className="image-upload-arrow">
                    {isExpanded ? '▲' : '▼'}
                </div>
            </div>

            {isExpanded && (
                <div className="image-upload-content">
                    {/* Upload Area */}
                    <div 
                        className="image-upload-area"
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <div className="image-upload-placeholder">
                            <IconImage />
                            <p>Перетащите изображения сюда или нажмите для выбора</p>
                            <small>Поддерживаются: JPG, PNG, GIF (максимум 5MB)</small>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e.target.files)}
                            style={{ display: 'none' }}
                        />
                    </div>

                    {/* Upload Progress */}
                    {isUploading && (
                        <div className="image-upload-progress">
                            <div className="spinner"></div>
                            <span>Загрузка изображений...</span>
                        </div>
                    )}

                    {/* Images Grid */}
                    {images.length > 0 && (
                        <div className="images-grid">
                            {images.map((image) => (
                                <div key={image.id} className="image-item">
                                    <div className="image-preview">
                                        <img src={image.url} alt={image.name} />
                                        <button 
                                            className="image-remove-btn"
                                            onClick={() => handleRemoveImage(image.id)}
                                            aria-label={`Удалить ${image.name}`}
                                        >
                                            <IconClose />
                                        </button>
                                    </div>
                                    <div className="image-info">
                                        <div className="image-name" title={image.name}>
                                            {image.name.length > 20 
                                                ? `${image.name.substring(0, 20)}...` 
                                                : image.name
                                            }
                                        </div>
                                        <div className="image-size">
                                            {formatFileSize(image.size)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State */}
                    {images.length === 0 && !isUploading && (
                        <div className="images-empty">
                            <p>Изображения не добавлены</p>
                            <small>Добавьте фотографии комнаты для лучшего планирования</small>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


