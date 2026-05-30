import { useEffect, useRef, useState } from 'react';
import './BoxSelector.css';
import { Icon } from './Icons';
import type { CultureBox } from '../types';

interface BoxSelectorProps {
  boxes: CultureBox[];
  value: string;
  onChange: (id: string) => void;
}

export function BoxSelector({ boxes, value, onChange }: BoxSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = boxes.find((box) => box.id === value) ?? boxes[0];

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const selectBox = (id: string) => {
    onChange(id);
    setOpen(false);
  };

  return (
    <div className="box-selector" ref={ref}>
      <div className="box-selector-label">사육박스</div>
      <div className="box-selector-field">
        <button
          type="button"
          className="box-selector-toggle"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          <span className="box-selector-mark"><Icon name="box" /></span>
          <span className="box-selector-current">
            <strong>{current?.name ?? '사육박스 없음'}</strong>
            {current && (
              <span>
                <span className="mono">{current.id}</span>
                <i>{current.startedAt}</i>
              </span>
            )}
          </span>
          <span className="box-selector-chev"><Icon name="chevron" /></span>
        </button>

        {open && (
          <div className="box-selector-menu">
            {boxes.map((box) => {
              const selected = box.id === current?.id;
              return (
                <button
                  type="button"
                  key={box.id}
                  className={`box-selector-option${selected ? ' active' : ''}`}
                  onClick={() => selectBox(box.id)}
                >
                  <span className="box-option-icon"><Icon name={selected ? 'check' : 'box'} /></span>
                  <span className="box-option-body">
                    <strong>{box.name}</strong>
                    <span>
                      <span className="mono">{box.id}</span>
                      <i>{box.startedAt}</i>
                    </span>
                    {box.memo && <em>{box.memo}</em>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
