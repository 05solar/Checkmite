import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import './CultureBoxesPage.css';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icons';
import type { CultureBox } from '../types';

interface CultureBoxesPageProps {
  boxes: CultureBox[];
  selectedBoxId: string;
  onBoxChange: (id: string) => void;
  onBoxCreate: (box: Omit<CultureBox, 'id'>) => Promise<void> | void;
  onBoxUpdate: (id: string, box: Partial<Omit<CultureBox, 'id'>>) => Promise<void> | void;
  onBoxDelete: (id: string) => Promise<void> | void;
}

type BoxForm = {
  name: string;
  startedAt: string;
  memo: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const blankForm = (): BoxForm => ({
  name: '',
  startedAt: today(),
  memo: '',
});

function formFromBox(box: CultureBox | undefined): BoxForm {
  if (!box) return blankForm();
  return {
    name: box.name,
    startedAt: box.startedAt.slice(0, 10),
    memo: box.memo ?? '',
  };
}

function normalizeForm(form: BoxForm): Omit<CultureBox, 'id'> {
  return {
    name: form.name.trim(),
    startedAt: form.startedAt,
    memo: form.memo.trim() || undefined,
  };
}

export function CultureBoxesPage({
  boxes,
  selectedBoxId,
  onBoxChange,
  onBoxCreate,
  onBoxUpdate,
  onBoxDelete,
}: CultureBoxesPageProps) {
  const selectedBox = boxes.find((box) => box.id === selectedBoxId) ?? boxes[0];
  const sortedBoxes = useMemo(
    () => boxes.slice().sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    [boxes],
  );

  const [createForm, setCreateForm] = useState<BoxForm>(() => blankForm());
  const [editForm, setEditForm] = useState<BoxForm>(() => formFromBox(selectedBox));
  const [deleteTarget, setDeleteTarget] = useState<CultureBox | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState<'create' | 'edit' | 'delete' | null>(null);

  useEffect(() => {
    setEditForm(formFromBox(selectedBox));
    setError('');
  }, [selectedBox?.id]);

  const updateCreateField = (field: keyof BoxForm, value: string) => {
    setCreateForm((form) => ({ ...form, [field]: value }));
  };

  const updateEditField = (field: keyof BoxForm, value: string) => {
    setEditForm((form) => ({ ...form, [field]: value }));
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault();
    const payload = normalizeForm(createForm);
    if (!payload.name) {
      setError('새 사육박스 이름을 입력해주세요.');
      return;
    }

    try {
      setSaving('create');
      setError('');
      await onBoxCreate(payload);
      setCreateForm(blankForm());
    } catch (err) {
      setError(err instanceof Error ? err.message : '사육박스를 추가하지 못했습니다.');
    } finally {
      setSaving(null);
    }
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedBox) return;
    const payload = normalizeForm(editForm);
    if (!payload.name) {
      setError('선택 사육박스 이름을 입력해주세요.');
      return;
    }

    try {
      setSaving('edit');
      setError('');
      await onBoxUpdate(selectedBox.id, payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : '사육박스를 수정하지 못했습니다.');
    } finally {
      setSaving(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || boxes.length <= 1) return;
    try {
      setSaving('delete');
      setError('');
      await onBoxDelete(deleteTarget.id);
      setDeleteTarget(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '사육박스를 삭제하지 못했습니다.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="page">
      <div className="page-head">
        <div className="page-eyebrow"><span className="pe-dot" />사육박스 관리 · CULTURE BOXES</div>
        <h1 className="page-title">사육박스 등록과 운영 정보 관리</h1>
        <p className="page-desc">분석 탭에서 사용하는 사육박스 ID, 시작일, 배양 조건 메모를 한 곳에서 관리합니다.</p>
      </div>

      {error && (
        <div className="box-admin-error">
          <Icon name="info" />
          <span>{error}</span>
        </div>
      )}

      <div className="box-admin-layout">
        <section className="card box-admin-list-card">
          <div className="card-head">
            <div className="card-title">사육박스 목록</div>
            <Badge kind="neutral">{boxes.length}개</Badge>
          </div>
          <div className="box-admin-list">
            {sortedBoxes.map((box) => {
              const selected = box.id === selectedBox?.id;
              return (
                <button
                  type="button"
                  key={box.id}
                  className={`box-admin-item${selected ? ' active' : ''}`}
                  onClick={() => onBoxChange(box.id)}
                >
                  <span className="box-admin-item-icon"><Icon name={selected ? 'check' : 'box'} /></span>
                  <span className="box-admin-item-body">
                    <strong>{box.name}</strong>
                    <span>
                      <span className="mono">{box.id}</span>
                      <i>{box.startedAt.slice(0, 10)}</i>
                    </span>
                    {box.memo && <em>{box.memo}</em>}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card box-admin-form-card">
          <div className="card-head">
            <div className="card-title">새 사육박스 등록</div>
          </div>
          <form className="box-admin-form" onSubmit={submitCreate}>
            <label>
              <span>박스 이름</span>
              <input
                value={createForm.name}
                onChange={(event) => updateCreateField('name', event.target.value)}
                placeholder="예: C동 1번 사육박스"
              />
            </label>
            <label>
              <span>시작일</span>
              <input
                type="date"
                value={createForm.startedAt}
                onChange={(event) => updateCreateField('startedAt', event.target.value)}
              />
            </label>
            <label className="box-admin-wide">
              <span>메모</span>
              <input
                value={createForm.memo}
                onChange={(event) => updateCreateField('memo', event.target.value)}
                placeholder="조건, 위치, 배지 정보"
              />
            </label>
            <div className="box-admin-actions">
              <button type="submit" className="btn btn-primary" disabled={saving === 'create'}>
                <Icon name="check" />
                {saving === 'create' ? '등록 중...' : '등록'}
              </button>
            </div>
          </form>
        </section>

        <section className="card box-admin-edit-card">
          <div className="card-head">
            <div className="card-title">선택 박스 정보</div>
            {selectedBox && <Badge kind="high">선택됨</Badge>}
          </div>
          {selectedBox ? (
            <form className="box-admin-form" onSubmit={submitEdit}>
              <label>
                <span>박스 이름</span>
                <input
                  value={editForm.name}
                  onChange={(event) => updateEditField('name', event.target.value)}
                />
              </label>
              <label>
                <span>시작일</span>
                <input
                  type="date"
                  value={editForm.startedAt}
                  onChange={(event) => updateEditField('startedAt', event.target.value)}
                />
              </label>
              <label className="box-admin-wide">
                <span>메모</span>
                <input
                  value={editForm.memo}
                  onChange={(event) => updateEditField('memo', event.target.value)}
                />
              </label>
              <div className="box-admin-meta">
                <span>ID</span>
                <strong className="mono">{selectedBox.id}</strong>
              </div>
              <div className="box-admin-actions">
                <button type="submit" className="btn btn-primary" disabled={saving === 'edit'}>
                  <Icon name="check" />
                  {saving === 'edit' ? '저장 중...' : '변경 저장'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={boxes.length <= 1 || saving === 'delete'}
                  onClick={() => setDeleteTarget(selectedBox)}
                >
                  <Icon name="trash" />휴지통으로 이동
                </button>
              </div>
            </form>
          ) : (
            <div className="box-admin-empty">등록된 사육박스가 없습니다.</div>
          )}
        </section>
      </div>

      {deleteTarget && (
        <div className="confirm-backdrop" role="presentation">
          <div className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-box-title">
            <div className="card-head">
              <div className="card-title" id="delete-box-title">사육박스 삭제 확인</div>
            </div>
            <p className="confirm-copy">
              <b>{deleteTarget.name}</b> 데이터를 삭제하시겠습니까? 휴지통으로 이동합니다.
            </p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)} disabled={saving === 'delete'}>취소</button>
              <button className="btn btn-primary" onClick={confirmDelete} disabled={saving === 'delete'}>
                {saving === 'delete' ? '이동 중...' : '휴지통으로 이동'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
