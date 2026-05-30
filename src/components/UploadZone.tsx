import { useRef, useState } from 'react';
import './UploadZone.css';
import { Icon } from './Icons';

interface UploadZoneProps {
  accept: string;
  kind: 'image' | 'video';
  onPick: (file: File) => void;
}

export function UploadZone({ accept, kind, onPick }: UploadZoneProps) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isVideo = kind === 'video';
  const inputAccept = isVideo ? 'video/*' : 'image/*';

  const pickFile = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onPick(file);
  };

  return (
    <div
      className={`upload${drag ? ' drag' : ''}`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); pickFile(e.dataTransfer.files); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={inputAccept}
        className="upload-input"
        onChange={(e) => pickFile(e.currentTarget.files)}
      />
      <div className="up-ic"><Icon name={isVideo ? 'video' : 'image'} /></div>
      <div className="up-title">
        {isVideo ? '영상을 끌어다 놓거나 클릭하여 업로드' : '사진을 끌어다 놓거나 클릭하여 업로드'}
      </div>
      <div className="up-desc">
        {isVideo
          ? '응애가 촬영된 영상을 올리면 서버에서 트래킹·분석합니다'
          : '응애가 촬영된 사진을 올리면 서버에서 객체를 탐지합니다'}
      </div>
      <div className="up-formats">{accept}</div>
    </div>
  );
}
