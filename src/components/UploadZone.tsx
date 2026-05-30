import { useState } from 'react';
import './UploadZone.css';
import { Icon } from './Icons';

interface UploadZoneProps {
  accept: string;
  kind: 'image' | 'video';
  onPick: () => void;
}

export function UploadZone({ accept, kind, onPick }: UploadZoneProps) {
  const [drag, setDrag] = useState(false);
  const isVideo = kind === 'video';

  return (
    <div
      className={`upload${drag ? ' drag' : ''}`}
      onClick={onPick}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onPick(); }}
    >
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
