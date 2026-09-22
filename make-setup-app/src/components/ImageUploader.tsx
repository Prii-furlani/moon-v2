import React, { useRef } from 'react';
import { UploadCloud, Trash2, Camera } from 'lucide-react';

interface ImageUploaderProps {
  label?: string;
  value?: string;
  onChange: (base64Image: string) => void;
  onFileSelect?: (file: File | null) => void;
  aspectRatio?: 'square' | 'cover' | 'landscape';
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  label = 'Upload da Foto / Imagem',
  value,
  onChange,
  onFileSelect,
  aspectRatio = 'square'
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('⚠️ Por favor, selecione um arquivo de imagem válido (JPG, PNG, WEBP).');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result);
          if (onFileSelect) onFileSelect(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    if (onFileSelect) onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isSquare = aspectRatio === 'square';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
          {label}
        </label>
      )}

      <input 
        ref={fileInputRef}
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {value ? (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '1rem', 
          flexDirection: isSquare ? 'row' : 'column'
        }}>
          <div style={{
            position: 'relative',
            width: isSquare ? '108px' : '100%',
            height: isSquare ? '108px' : '160px',
            borderRadius: isSquare ? '50%' : 'var(--radius-md)',
            overflow: 'hidden',
            border: '2px solid var(--color-primary)',
            backgroundColor: 'var(--bg-input)',
            flexShrink: 0
          }}>
            <img 
              src={value} 
              alt="Preview upload"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />

            <div 
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                opacity: 0,
                transition: 'opacity 0.2s ease',
                cursor: 'pointer'
              }}
              onClick={() => fileInputRef.current?.click()}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
            >
              <Camera size={20} style={{ color: '#fff' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-outline"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
            >
              <UploadCloud size={14} />
              <span>Trocar Foto</span>
            </button>

            <button
              type="button"
              onClick={handleRemove}
              style={{
                backgroundColor: 'var(--status-error-bg)',
                color: 'var(--status-error)',
                border: '1px solid var(--status-error)',
                padding: '0.35rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
              title="Remover Imagem"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--color-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: isSquare ? '1rem' : '1.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-input)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: isSquare ? 'row' : 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-secondary-light)',
            color: 'var(--color-secondary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <UploadCloud size={22} />
          </div>

          <div style={{ textAlign: isSquare ? 'left' : 'center' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary)', display: 'block' }}>
              Clique para selecionar uma foto
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              JPG, PNG ou WEBP do seu dispositivo
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
