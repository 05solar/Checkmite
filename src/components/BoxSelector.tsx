import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import './BoxSelector.css';
import { Icon } from './Icons';
import type { CultureBox } from '../types';

interface BoxSelectorProps {
  boxes: CultureBox[];
  value: string;
  onChange: (id: string) => void;
  onCreate?: (box: Omit<CultureBox, 'id'>) => Promise<void> | void;
}

export function BoxSelector({ boxes, value, onChange, onCreate }: BoxSelectorProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

  const resetCreateForm = () => {
    setName('');
    setStartedAt(new Date().toISOString().slice(0, 10));
    setMemo('');
    setError('');
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (!onCreate || submitting) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('박스 이름을 입력해주세요.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await onCreate({
        name: trimmedName,
        startedAt,
        memo: memo.trim() || undefined,
      });
      resetCreateForm();
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '사육박스를 추가하지 못했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="box-selector" ref={ref}>
      <div className="box-selector-head">
        <div className="box-selector-label">사육박스</div>
        {onCreate && (
          <button
            type="button"
            className="box-selector-create-button"
            onClick={() => {
              setOpen(false);
              setCreating((value) => !value);
              setError('');
            }}
          >
            <Icon name={creating ? 'x' : 'plus'} />
            {creating ? '닫기' : '사육박스 추가'}
          </button>
        )}
      </div>
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

      {creating && onCreate && (
        <form className="box-create-form" onSubmit={submitCreate}>
          <div className="box-create-grid">
            <label>
              <span>박스 이름</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="예: C동 1번 사육박스"
                autoFocus
              />
            </label>
            <label>
              <span>시작일</span>
              <input
                type="date"
                value={startedAt}
                onChange={(event) => setStartedAt(event.target.value)}
              />
            </label>
            <label className="box-create-wide">
              <span>메모</span>
              <input
                value={memo}
                onChange={(event) => setMemo(event.target.value)}
                placeholder="조건, 위치, 배지 정보"
              />
            </label>
          </div>
          {error && <div className="box-create-error">{error}</div>}
          <div className="box-create-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                resetCreateForm();
                setCreating(false);
              }}
              disabled={submitting}
            >
              취소
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Icon name="check" />
              {submitting ? '추가 중...' : '추가'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
