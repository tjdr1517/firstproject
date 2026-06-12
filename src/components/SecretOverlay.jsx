import React, { useState, useEffect } from 'react';

export default function SecretOverlay({ isOpen, onClose, secretQueue, setSecretQueue }) {
  const [inputText, setInputText] = useState('');

  // ESC 키 클릭 시 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddSecret = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    // 엔터나 쉼표로 구분하여 여러 명 추가 가능하게 함
    const names = inputText
      .split(/[\n,]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    setSecretQueue([...secretQueue, ...names]);
    setInputText('');
  };

  const handleRemoveItem = (indexToRemove) => {
    setSecretQueue(secretQueue.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearQueue = () => {
    setSecretQueue([]);
  };

  return (
    <div className="secret-overlay" onClick={onClose}>
      <div className="secret-modal" onClick={(e) => e.stopPropagation()}>
        <div className="secret-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="secret-badge">Teacher Secret Panel</span>
          </div>
          <button className="remove-student-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="secret-body">
          <p className="secret-desc">
            <strong>비밀 예약 시스템:</strong> 아래 입력란에 학생 이름을 등록하면, 다음 추첨 진행 시 해당 이름이 순서대로 무조건 뽑히게 됩니다. 학생들의 화면에는 무작위 추첨처럼 표시됩니다.
          </p>
          
          <form onSubmit={handleAddSecret} className="form-group">
            <label className="input-label" htmlFor="secret-names">예약할 학생 이름 (줄바꿈 또는 쉼표 구분)</label>
            <textarea
              id="secret-names"
              className="input-text input-textarea"
              placeholder="예: 홍길동, 이순신"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              rows={3}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <button type="submit" className="btn btn-cyan" style={{ flex: 1 }}>
                비밀 예약 추가
              </button>
              {secretQueue.length > 0 && (
                <button type="button" className="btn btn-danger" onClick={handleClearQueue}>
                  예약 비우기
                </button>
              )}
            </div>
          </form>

          <div>
            <h4 className="input-label" style={{ marginBottom: '8px' }}>
              현재 대기 중인 비밀 예약 명단 ({secretQueue.length}명)
            </h4>
            {secretQueue.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                대기 중인 예약 발표자가 없습니다.
              </p>
            ) : (
              <div className="secret-queue-list">
                {secretQueue.map((name, idx) => (
                  <div key={idx} className="secret-queue-item">
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="secret-queue-index">#{idx + 1}</span>
                      <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{name}</span>
                    </div>
                    <button 
                      className="remove-student-btn" 
                      onClick={() => handleRemoveItem(idx)}
                      title="예약 취소"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={onClose} 
            style={{ marginTop: '10px' }}
          >
            설정 완료 및 닫기 (ESC)
          </button>
        </div>
      </div>
    </div>
  );
}
