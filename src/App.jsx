import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { audioManager } from './utils/audio';
import { confetti } from './utils/confetti';
import SlotMachine from './components/SlotMachine';
import SecretOverlay from './components/SecretOverlay';

const SAMPLE_STUDENTS = [
  '강민준', '김서연', '박지우', '이민우', '최예은',
  '정현우', '한지민', '오지훈', '윤하은', '임도현',
  '서지원', '신재희', '황건우', '안수빈', '송민재',
  '조은서', '배진우', '유진아', '홍길동', '이순신'
];

export default function App() {
  const [students, setStudents] = useState([]);
  const [singleNameInput, setSingleNameInput] = useState('');
  const [bulkNamesInput, setBulkNamesInput] = useState('');
  const [excludePicked, setExcludePicked] = useState(true);
  const [pickCount, setPickCount] = useState(1);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winners, setWinners] = useState([]);
  const [finishedCount, setFinishedCount] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  
  // 비밀 설정 모달 상태
  const [isSecretOpen, setIsSecretOpen] = useState(false);
  const [secretQueue, setSecretQueue] = useState([]);
  const [logoClicks, setLogoClicks] = useState(0);

  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // 로컬 스토리지 데이터 로드
  useEffect(() => {
    const stored = localStorage.getItem('presenter_students');
    if (stored) {
      try {
        setStudents(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse local storage students:", e);
        loadSampleStudents();
      }
    } else {
      loadSampleStudents();
    }
  }, []);

  // 로컬 스토리지 데이터 저장
  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem('presenter_students', JSON.stringify(students));
    }
  }, [students]);

  // 전역 단축키 이벤트 리스너 (Ctrl + Shift + K -> 비밀 메뉴 오픈)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSecretOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 샘플 학생 로드
  const loadSampleStudents = () => {
    const samples = SAMPLE_STUDENTS.map((name, index) => ({
      id: `sample-${index}-${Date.now()}`,
      name,
      isPicked: false
    }));
    setStudents(samples);
  };

  // 학생 개별 추가
  const handleAddSingle = (e) => {
    e.preventDefault();
    if (!singleNameInput.trim()) return;
    
    // 중복 체크 및 추가
    if (students.some(s => s.name === singleNameInput.trim())) {
      alert("이미 등록된 학생 이름입니다.");
      return;
    }

    const newStudent = {
      id: `single-${Date.now()}`,
      name: singleNameInput.trim(),
      isPicked: false
    };
    
    setStudents(prev => [...prev, newStudent]);
    setSingleNameInput('');
  };

  // 학생 일괄 추가 (엔터/쉼표 구분)
  const handleAddBulk = (e) => {
    e.preventDefault();
    if (!bulkNamesInput.trim()) return;

    const names = bulkNamesInput
      .split(/[\n,]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);

    const existingNames = new Set(students.map(s => s.name));
    const newStudents = [];

    names.forEach(name => {
      if (!existingNames.has(name)) {
        newStudents.push({
          id: `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name,
          isPicked: false
        });
        existingNames.add(name); // 내부 추가 방지
      }
    });

    if (newStudents.length > 0) {
      setStudents(prev => [...prev, ...newStudents]);
    }
    setBulkNamesInput('');
  };

  // 엑셀 및 CSV 파일 업로드 파싱
  const handleExcelUpload = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        
        // 데이터를 행렬 형태(Array of Arrays)로 변환
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        
        // 첫 번째 열에서 이름 추출
        const importedNames = data
          .map(row => row[0])
          .map(val => val !== undefined && val !== null ? String(val).trim() : '')
          .filter(val => val.length > 0 && !['이름', 'name', 'Name', '학생명', 'student'].includes(val));

        if (importedNames.length === 0) {
          alert("유효한 학생 이름을 찾지 못했습니다. 엑셀의 첫 번째 열에 학생 이름을 적어주세요.");
          return;
        }

        const existingNames = new Set(students.map(s => s.name));
        const newStudents = [];

        importedNames.forEach(name => {
          if (!existingNames.has(name)) {
            newStudents.push({
              id: `excel-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name,
              isPicked: false
            });
            existingNames.add(name);
          }
        });

        if (newStudents.length > 0) {
          setStudents(prev => [...prev, ...newStudents]);
          alert(`${newStudents.length}명의 학생을 성공적으로 불러왔습니다!`);
        } else {
          alert("새롭게 추가할 이름이 없습니다. (이미 존재하는 이름들입니다)");
        }
      } catch (err) {
        console.error("Excel parse error:", err);
        alert("엑셀 파일 파싱에 실패했습니다. 올바른 파일 양식인지 확인해 주세요.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleExcelUpload(file);
    e.target.value = null; // 입력 비우기
  };

  // 드래그 앤 드롭 업로드 지원
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
      handleExcelUpload(file);
    } else {
      alert("엑셀(.xlsx, .xls) 또는 CSV(.csv) 파일만 지원합니다.");
    }
  };

  // 학생 개별 삭제
  const handleRemoveStudent = (id) => {
    setStudents(prev => prev.filter(s => s.id !== id));
  };

  // 전체 삭제
  const handleClearAll = () => {
    if (window.confirm("명단 전체를 삭제하시겠습니까?")) {
      setStudents([]);
      localStorage.removeItem('presenter_students');
    }
  };

  // 추첨 상태 초기화
  const handleResetDraw = () => {
    setStudents(prev => prev.map(s => ({ ...s, isPicked: false })));
    setWinners([]);
    confetti.stop();
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  // 음소거 토글
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    audioManager.setMute(nextMute);
  };

  // 로고 클릭 5회 감지 -> 비밀 메뉴 오픈
  const handleLogoClick = () => {
    setLogoClicks(prev => {
      const nextClicks = prev + 1;
      if (nextClicks >= 5) {
        setIsSecretOpen(true);
        return 0;
      }
      return nextClicks;
    });
  };

  // 추첨 시작
  const handleDrawStart = () => {
    if (students.length === 0) {
      alert("먼저 학생 명단을 추가해 주세요.");
      return;
    }

    const availablePool = excludePicked 
      ? students.filter(s => !s.isPicked) 
      : students;

    if (availablePool.length === 0 && secretQueue.length === 0) {
      alert("더 이상 남은 추첨 대상자가 없습니다. 초기화 후 다시 시도해 주세요.");
      return;
    }

    // 실제로 뽑아야 하는 최종 인원 수 계산 (남은 총 인원수보다 크게 설정된 경우 보정)
    const activePickCount = Math.min(
      pickCount, 
      availablePool.length + secretQueue.length
    );

    let tempSecretQueue = [...secretQueue];
    let tempAvailable = [...availablePool];
    const newWinners = [];

    for (let i = 0; i < activePickCount; i++) {
      if (tempSecretQueue.length > 0) {
        // 비밀 예약 명단에서 우선 추출
        const secretName = tempSecretQueue.shift();
        newWinners.push(secretName);
        // 무작위 풀에 있는 학생이라면 1회성 중복 방지를 위해 풀에서 해당 이름을 임시 제외
        tempAvailable = tempAvailable.filter(s => s.name !== secretName);
      } else {
        if (tempAvailable.length === 0) break;
        
        // 일반 무작위 추첨
        const randomIdx = Math.floor(Math.random() * tempAvailable.length);
        const chosen = tempAvailable[randomIdx];
        newWinners.push(chosen.name);
        
        // 다중 추첨 시 같은 이름이 한 번에 여러 개 뽑히는 중복 방지
        tempAvailable.splice(randomIdx, 1);
      }
    }

    // 상태 적용
    setWinners(newWinners);
    setSecretQueue(tempSecretQueue);
    setIsSpinning(true);
    setFinishedCount(0);
    confetti.stop();
  };

  // 개별 슬롯 릴 완료 콜백
  const handleReelFinished = () => {
    setFinishedCount(prev => {
      const nextCount = prev + 1;
      if (nextCount === winners.length) {
        // 모든 릴이 완전히 멈췄을 때
        setIsSpinning(false);
        audioManager.playChime();
        if (canvasRef.current) {
          confetti.start(canvasRef.current);
        }
        // 중복 방지 모드일 경우 발표 목록 상태 갱신
        if (excludePicked) {
          setStudents(prevStudents => 
            prevStudents.map(student => 
              winners.includes(student.name) 
                ? { ...student, isPicked: true } 
                : student
            )
          );
        }
      }
      return nextCount;
    });
  };

  // 남은 인원수
  const remainingCount = students.filter(s => !s.isPicked).length;

  return (
    <div className="app-container">
      {/* 좌측 사이드바: 명단 관리 */}
      <aside className="sidebar">
        <div className="logo-section" title="5번 연속 클릭 시 비밀 패널 오픈">
          <h1 className="logo-title" onClick={handleLogoClick}>
            🎬 오늘의 발표자
          </h1>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>v1.0</span>
        </div>

        {/* 개별 추가 */}
        <form onSubmit={handleAddSingle} className="form-group">
          <label className="input-label" htmlFor="single-input">학생 개별 등록</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              id="single-input"
              type="text" 
              className="input-text" 
              placeholder="이름 입력" 
              value={singleNameInput}
              onChange={(e) => setSingleNameInput(e.target.value)}
              disabled={isSpinning}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-cyan" disabled={isSpinning}>등록</button>
          </div>
        </form>

        {/* 일괄 추가 */}
        <form onSubmit={handleAddBulk} className="form-group">
          <label className="input-label" htmlFor="bulk-input">학생 일괄 등록 (쉼표/줄바꿈)</label>
          <textarea
            id="bulk-input"
            className="input-text input-textarea"
            placeholder="홍길동, 이순신&#13;김영희"
            value={bulkNamesInput}
            onChange={(e) => setBulkNamesInput(e.target.value)}
            disabled={isSpinning}
          />
          <button type="submit" className="btn btn-outline" disabled={isSpinning} style={{ width: '100%' }}>
            일괄 등록 실행
          </button>
        </form>

        {/* 엑셀 파일 드롭 존 */}
        <div className="form-group">
          <label className="input-label">엑셀/CSV 파일 일괄 업로드</label>
          <div 
            className="file-upload-zone"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !isSpinning && fileInputRef.current.click()}
            style={{ pointerEvents: isSpinning ? 'none' : 'auto' }}
          >
            <span className="file-upload-icon">📁</span>
            <span className="file-upload-text">
              클릭하여 업로드하거나<br/>파일을 끌어다 놓으세요 (.xlsx, .csv)
            </span>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* 환경 설정 */}
        <div className="toggle-wrapper">
          <span className="input-label" style={{ color: 'var(--text-main)' }}>
            이미 뽑힌 학생 중복 추첨 제외
          </span>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={excludePicked}
              onChange={(e) => setExcludePicked(e.target.checked)}
              disabled={isSpinning}
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* 명단 헤더 */}
        <div className="student-list-container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="student-count-badge">
              총 {students.length}명 / 남은 인원 {remainingCount}명
            </span>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button 
                className="btn btn-danger" 
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                onClick={handleClearAll}
                disabled={isSpinning || students.length === 0}
              >
                비우기
              </button>
              <button 
                className="btn btn-outline" 
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                onClick={loadSampleStudents}
                disabled={isSpinning}
              >
                예시 로드
              </button>
            </div>
          </div>

          {/* 명단 렌더링 */}
          <div className="student-list">
            {students.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', marginTop: '20px' }}>
                학생 명단이 비어 있습니다.
              </p>
            ) : (
              students.map((student) => (
                <div 
                  key={student.id} 
                  className={`student-list-item ${excludePicked && student.isPicked ? 'is-picked' : ''}`}
                >
                  <span className="student-name">
                    {student.name} {excludePicked && student.isPicked && ' (완료)'}
                  </span>
                  <button 
                    className="remove-student-btn"
                    onClick={() => handleRemoveStudent(student.id)}
                    disabled={isSpinning}
                  >
                    &times;
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* 우측 메인 컨텐츠 영역 */}
      <main className="main-content">
        {/* Confetti Canvas */}
        <canvas ref={canvasRef} className="confetti-canvas" />

        {/* 상단 툴 바 */}
        <div className="top-bar">
          <button 
            className="sound-toggle-btn" 
            onClick={handleToggleMute}
            title={isMuted ? "음소거 해제" : "음소거"}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>

        {/* 슬롯머신 중앙 연출 영역 */}
        <div className="slot-machine-outer">
          {winners.length === 0 ? (
            <div style={{ textAlign: 'center', opacity: 0.85 }}>
              <div style={{ fontSize: '6rem', marginBottom: '20px' }}>🍀</div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--accent-cyan)' }}>
                오늘의 주인공은?
              </h2>
              <p style={{ color: 'var(--text-muted)', marginTop: '10px' }}>
                추첨 인원을 설정하고 [추첨 시작]을 눌러주세요!
              </p>
            </div>
          ) : (
            <div className="slot-machine-grid">
              {winners.map((winnerName, idx) => (
                <SlotMachine
                  key={idx}
                  reelIndex={idx}
                  winner={winnerName}
                  allStudents={students.map(s => s.name)}
                  isSpinning={isSpinning}
                  duration={2000 + idx * 800} // 개별 스핀 멈춤 시점 다르게 하여 엇박자 연출 (Stagger)
                  onFinished={handleReelFinished}
                />
              ))}
            </div>
          )}
        </div>

        {/* 하단 컨트롤 영역 */}
        <div className="control-bar">
          <div className="draw-controls">
            <div className="picker-count-input">
              <label htmlFor="pick-count">선정 인원수</label>
              <input
                id="pick-count"
                type="number"
                min={1}
                max={Math.min(5, students.length || 1)}
                value={pickCount}
                onChange={(e) => setPickCount(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                disabled={isSpinning}
              />
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>명</span>
            </div>

            <button 
              className="btn btn-cyan btn-large" 
              onClick={handleDrawStart}
              disabled={isSpinning || students.length === 0}
            >
              🚀 {isSpinning ? '두근두근...' : '추첨 시작'}
            </button>

            <button 
              className="btn btn-outline" 
              onClick={handleResetDraw}
              disabled={isSpinning}
            >
              🔄 추첨 초기화
            </button>
          </div>
          
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            비밀 메뉴 단축키: Ctrl + Shift + K
          </div>
        </div>
      </main>

      {/* 교사용 비밀 대기열 모달 */}
      <SecretOverlay
        isOpen={isSecretOpen}
        onClose={() => setIsSecretOpen(false)}
        secretQueue={secretQueue}
        setSecretQueue={setSecretQueue}
      />
    </div>
  );
}
