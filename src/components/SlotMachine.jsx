import React, { useState, useEffect, useRef } from 'react';
import { audioManager } from '../utils/audio';

export default function SlotMachine({ 
  winner, 
  allStudents, 
  isSpinning, 
  duration = 3000, 
  onFinished,
  reelIndex = 0 
}) {
  const [offset, setOffset] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const [reelItems, setReelItems] = useState(['???']);
  const isSpinningRef = useRef(false);

  // 160px은 index.css에 정의된 .slot-item의 height와 동일해야 합니다.
  const ITEM_HEIGHT = 160;

  useEffect(() => {
    if (isSpinning && !isSpinningRef.current) {
      isSpinningRef.current = true;
      startSpin();
    }
  }, [isSpinning]);

  const startSpin = () => {
    // 1. 스핀할 아이템 리스트 생성
    const itemsCount = 20; // 총 롤링될 개수
    const randomItems = [];
    
    // 명단이 부족할 경우 대비
    const pool = allStudents.length > 0 ? allStudents : ['대기자 없음'];
    
    for (let i = 0; i < itemsCount - 2; i++) {
      const randomIdx = Math.floor(Math.random() * pool.length);
      randomItems.push(pool[randomIdx]);
    }
    
    // 시작 이름: 이전의 당첨 상태 혹은 현재 릴의 첫 화면에 보였던 이름
    const startName = reelItems[reelItems.length - 1] || '???';
    
    // 최종 완성 리스트: [시작이름, ...랜덤이름들, 당첨자]
    const finalItems = [startName, ...randomItems, winner || '???'];
    setReelItems(finalItems);
    
    // 2. 애니메이션 준비 (트랜지션 끄고 offset을 0으로 초기화)
    setTransitionEnabled(false);
    setOffset(0);

    // 3. 브라우저가 상태 변경을 렌더링한 후 트랜지션을 켜고 마지막 아이템 위치로 스크롤 시작
    setTimeout(() => {
      setTransitionEnabled(true);
      setOffset(-(finalItems.length - 1) * ITEM_HEIGHT);
      
      // 4. 감속 효과와 일치하는 틱 사운드 재생
      playDeceleratingTicks(0, duration);
    }, 50);

    // 5. 완료 시점 처리
    setTimeout(() => {
      isSpinningRef.current = false;
      if (onFinished) {
        onFinished();
      }
    }, duration + 50);
  };

  // 비선형(감속) 틱 소리 재생 로직
  const playDeceleratingTicks = (elapsed, totalDuration) => {
    if (!isSpinningRef.current || elapsed >= totalDuration) return;

    audioManager.playTick();

    // 시작 시점엔 45ms 간격, 멈출 때에 다다를수록 최대 450ms 간격으로 늘어나며 감속 묘사
    const progress = elapsed / totalDuration;
    const currentDelay = 45 + Math.pow(progress, 2) * 400;

    setTimeout(() => {
      playDeceleratingTicks(elapsed + currentDelay, totalDuration);
    }, currentDelay);
  };

  const style = {
    transform: `translateY(${offset}px)`,
    transition: transitionEnabled 
      ? `transform ${duration}ms cubic-bezier(0.12, 0.8, 0.15, 1)` 
      : 'none',
  };

  // 스핀 완료 시 릴의 테두리 색상 강조 등을 제어하기 위한 클래스명 선정
  let reelClass = "slot-reel";
  if (isSpinning) {
    reelClass += " active-reel";
  } else if (reelItems[reelItems.length - 1] === winner && winner !== '???') {
    reelClass += " winner-reel";
  }

  return (
    <div className={reelClass}>
      <div className="reel-center-indicator" />
      <div className="slot-strip" style={style}>
        {reelItems.map((item, idx) => (
          <div key={idx} className="slot-item">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
