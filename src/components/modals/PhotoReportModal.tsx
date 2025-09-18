import React, { useState, useRef, useEffect } from 'react';
import { PhotoReportModalProps } from '../../types';
import { IconClose } from '../common/Icon';
import { useFileStorage } from '../../hooks/useFileStorage';

interface PhotoItem {
    file: File;
    preview: string;
    caption: string;
}

export const PhotoReportModal: React.FC<PhotoReportModalProps> = ({ onClose, onSave, showAlert }) => {
    const [title, setTitle] = useState('');
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const modalRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadFile, createPhotoReport, isUploading } = useFileStorage();

    useEffect(() => {
        if (modalRef.current) {
            const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            const firstElement = focusableElements[0];
            if (firstElement) {
                firstElement.focus();
            }
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        
        files.forEach(file => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const preview = e.target?.result as string;
                    setPhotos(prev => [...prev, {
                        file,
                        preview,
                        caption: ''
                    }]);
                };
                reader.readAsDataURL(file);
            }
        });

        // Очищаем input для возможности повторного выбора тех же файлов
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleCaptionChange = (index: number, caption: string) => {
        setPhotos(prev => prev.map((photo, i) => 
            i === index ? { ...photo, caption } : photo
        ));
    };

    const handleRemovePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!title.trim()) {
            showAlert('Введите заголовок фотоотчета.');
            return;
        }

        if (photos.length === 0) {
            showAlert('Выберите хотя бы одну фотографию.');
            return;
        }

        try {
            // Загружаем все фотографии
            const uploadPromises = photos.map(async (photo) => {
                const uploadResult = await uploadFile('photos', photo.file);
                if (uploadResult.error) {
                    throw new Error(`Ошибка загрузки фото: ${uploadResult.error}`);
                }
                return {
                    url: uploadResult.publicUrl,
                    path: uploadResult.path,
                    caption: photo.caption.trim() || 'Без подписи'
                };
            });

            const uploadedPhotos = await Promise.all(uploadPromises);

            // Создаем фотоотчет в базе данных
            const photoReportRecord = await createPhotoReport({
                title: title.trim(),
                photos: uploadedPhotos,
            });

            // Вызываем callback с данными фотоотчета
            onSave({
                id: photoReportRecord.id,
                title: photoReportRecord.title,
                photos: uploadedPhotos,
                date: photoReportRecord.date
            });
        } catch (error) {
            console.error('Ошибка при сохранении фотоотчета:', error);
            showAlert('Произошла ошибка при сохранении фотоотчета.');
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content card photo-report-modal" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" ref={modalRef}>
                <div className="modal-header">
                    <h2>Создать фотоотчет</h2>
                    <button onClick={onClose} className="close-btn"><IconClose/></button>
                </div>
                <div className="modal-body">
                    <label htmlFor="photo-title">Заголовок фотоотчета</label>
                    <input 
                        id="photo-title" 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        placeholder="Например, 'Завершение отделки ванной комнаты'" 
                    />
                    
                    <label htmlFor="photo-files">Фотографии</label>
                    <input 
                        ref={fileInputRef}
                        id="photo-files" 
                        type="file" 
                        accept="image/*" 
                        multiple 
                        onChange={handleFileChange}
                    />
                    
                    {photos.length > 0 && (
                        <div className="photos-preview-container">
                            <h4>Выбранные фотографии ({photos.length})</h4>
                            <div className="photos-grid">
                                {photos.map((photo, index) => (
                                    <div key={index} className="photo-item">
                                        <div className="photo-preview">
                                            <img src={photo.preview} alt={`Фото ${index + 1}`} />
                                            <button 
                                                onClick={() => handleRemovePhoto(index)} 
                                                className="remove-photo-btn"
                                                type="button"
                                            >
                                                <IconClose />
                                            </button>
                                        </div>
                                        <textarea
                                            value={photo.caption}
                                            onChange={e => handleCaptionChange(index, e.target.value)}
                                            placeholder="Подпись к фото..."
                                            rows={2}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <div className="file-info">
                        <small>Поддерживаемые форматы: JPG, JPEG, PNG</small>
                        <small>Максимальный размер файла: 5 МБ</small>
                        <small>Можно выбрать несколько фотографий одновременно</small>
                    </div>
                </div>
                <div className="modal-footer">
                    <button 
                        onClick={handleSave} 
                        className="btn btn-primary" 
                        disabled={!title.trim() || photos.length === 0 || isUploading}
                    >
                        {isUploading ? 'Загрузка...' : 'Создать фотоотчет'}
                    </button>
                </div>
            </div>
        </div>
    );
};