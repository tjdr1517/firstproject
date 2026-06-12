// Canvas 기반의 고성능 커스텀 폭죽(Confetti) 이펙트 유틸리티
class ConfettiParticle {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.reset();
    // 시작 시점의 높이를 살짝 스크린 중간 밑으로 분사하도록 설정
    this.y = canvasHeight + Math.random() * 20;
    this.x = canvasWidth / 2 + (Math.random() - 0.5) * 50;
    // 발사 각도: 위쪽 방향으로 퍼짐
    const angle = (Math.random() * 60 + 60) * (Math.PI / 180); // 60도 ~ 120도
    const velocity = Math.random() * 15 + 10;
    this.vx = Math.cos(angle) * velocity;
    this.vy = -Math.sin(angle) * velocity;
  }

  reset() {
    this.x = Math.random() * this.canvasWidth;
    this.y = -20;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = Math.random() * 4 + 4;
    this.size = Math.random() * 8 + 6;
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 10;
    
    // 색상 팔레트: Vibrant Neon Colors
    const colors = [
      '#FF0055', // 핫핑크
      '#00FFCC', // 아쿠아/네온민트
      '#FFCC00', // 네온옐로
      '#9900FF', // 퍼플
      '#33FF00', // 그린
      '#FF5500', // 오렌지
      '#0099FF'  // 네온블루
    ];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.opacity = 1;
    this.opacitySpeed = Math.random() * 0.005 + 0.005;
  }

  update() {
    // 중력 및 마찰 적용
    this.vy += 0.25; // 중력
    this.vx *= 0.98; // 공기 저항
    
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    
    // 화면 하단으로 내려오기 시작하면 서서히 투명화
    if (this.vy > 0) {
      this.opacity -= this.opacitySpeed;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.globalAlpha = Math.max(0, this.opacity);
    ctx.fillStyle = this.color;
    
    // 사각형 리본 모양 그리기
    ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.5);
    ctx.restore();
  }
}

let animationFrameId = null;

export const confetti = {
  start(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 캔버스 크기 브라우저 창 크기에 맞춤
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resizeCanvas();
    
    // 파티클 생성 (중앙 분사형 폭죽 느낌)
    const particles = [];
    const particleCount = 120;
    for (let i = 0; i < particleCount; i++) {
      particles.push(new ConfettiParticle(canvas.width, canvas.height));
    }

    // 애니메이션 루프
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let alive = false;
      particles.forEach((p) => {
        p.update();
        if (p.opacity > 0 && p.y < canvas.height + 50) {
          p.draw(ctx);
          alive = true;
        }
      });

      if (alive) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    // 기존 애니메이션 프레임 취소 후 새로 실행
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
    animate();
  },

  stop() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  }
};
