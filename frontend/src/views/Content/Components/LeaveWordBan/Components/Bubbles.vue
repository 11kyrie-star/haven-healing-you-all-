<template>
    <div class="blackboard-wrap">
        <div class="board">
            <div class="chalk-head">
                <span class="chalk-title">今日份温柔</span>
                <span class="chalk-sub">Little comforts, floating to you</span>
            </div>
            <div class="chalk-line"></div>
            <div class="bubbles">
                <div
                    v-for="bubble in bubbles"
                    :key="bubble.text"
                    class="bubble"
                    :style="bubbleStyle(bubble)"
                >
                    {{ bubble.text }}
                </div>
            </div>
            <div class="chalk-tray">
                <span class="chalk-piece piece-pink"></span>
                <span class="chalk-piece piece-white"></span>
                <span class="chalk-piece piece-yellow"></span>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
interface Bubble {
    text: string
    left: number
    size: number
    duration: number
    delay: number
}

const bubbles: Bubble[] = [
    { text: '慢慢来，你也在发光', left: 5, size: 96, duration: 16, delay: 0 },
    { text: '今天也辛苦啦', left: 22, size: 84, duration: 14, delay: 3.5 },
    { text: '好事会发生的', left: 40, size: 78, duration: 18, delay: 1.2 },
    { text: '温柔待自己', left: 58, size: 82, duration: 15, delay: 6 },
    { text: '你比想象中勇敢', left: 74, size: 90, duration: 17, delay: 2.4 },
    { text: '给生活留一点甜', left: 14, size: 88, duration: 19, delay: 8.5 },
    { text: '休息一下也没关系', left: 66, size: 92, duration: 13, delay: 10 },
    { text: '云朵很轻，你也是', left: 34, size: 80, duration: 16, delay: 12 },
]

const bubbleStyle = (bubble: Bubble) => ({
    left: `${bubble.left}%`,
    width: `${bubble.size}px`,
    height: `${bubble.size}px`,
    animationDuration: `${bubble.duration}s`,
    animationDelay: `${bubble.delay}s`,
})
</script>

<style scoped lang="scss">
.blackboard-wrap {
    width: 100%;
    flex: 1;
    min-height: 44vh;
    padding: 12px;
    border-radius: 14px;
    background: linear-gradient(135deg, #a06b48, #7a4f33 60%, #68442d);
    box-shadow: 0 8px 20px rgba(80, 40, 20, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.22);
    animation: board-in 0.8s ease-out both;
}

.board {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 40vh;
    overflow: hidden;
    border-radius: 8px;
    background:
        radial-gradient(ellipse at 18% 12%, rgba(255, 255, 255, 0.055) 0%, transparent 55%),
        radial-gradient(ellipse at 85% 90%, rgba(255, 255, 255, 0.045) 0%, transparent 50%),
        linear-gradient(160deg, #36584b 0%, #28463a 55%, #223d31 100%);
    box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.35);
}

.chalk-head {
    position: relative;
    z-index: 2;
    padding: 18px 16px 0;
    text-align: center;
    user-select: none;

    .chalk-title {
        display: block;
        font-family: var(--font-main);
        font-size: 1.15em;
        letter-spacing: 6px;
        color: rgba(255, 255, 255, 0.92);
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
    }

    .chalk-sub {
        display: block;
        margin-top: 6px;
        font-family: 'Dancing Script', cursive;
        font-size: 0.95em;
        letter-spacing: 1px;
        color: rgba(255, 255, 255, 0.55);
    }
}

.chalk-line {
    position: relative;
    z-index: 2;
    width: 70%;
    height: 2px;
    margin: 10px auto 0;
    border-radius: 2px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
}

.bubbles {
    position: absolute;
    inset: 0;
    z-index: 1;
    pointer-events: none;
}

.bubble {
    position: absolute;
    bottom: -16%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px;
    text-align: center;
    font-family: var(--font-main);
    font-size: 11.5px;
    line-height: 1.35;
    letter-spacing: 0.5px;
    color: rgba(255, 255, 255, 0.96);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
    background: linear-gradient(150deg, rgba(255, 255, 255, 0.34), rgba(255, 255, 255, 0.12) 70%);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.25), inset 0 1px 2px rgba(255, 255, 255, 0.4);
    backdrop-filter: blur(1.5px);
    -webkit-backdrop-filter: blur(1.5px);
    animation-name: bubble-float;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    animation-fill-mode: both;
    will-change: transform, opacity;

    &::before {
        content: '';
        position: absolute;
        top: 12%;
        left: 16%;
        width: 30%;
        height: 18%;
        border-radius: 50%;
        background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.85), transparent 70%);
        transform: rotate(-20deg);
    }

    &::after {
        content: '';
        position: absolute;
        right: 12%;
        bottom: 18%;
        width: 26%;
        height: 12%;
        border-radius: 50%;
        border: 1.5px solid rgba(255, 255, 255, 0.35);
        border-color: transparent transparent rgba(255, 255, 255, 0.35) rgba(255, 255, 255, 0.35);
        transform: rotate(35deg);
    }
}

.chalk-tray {
    position: absolute;
    left: 50%;
    bottom: 10px;
    transform: translateX(-50%);
    z-index: 2;
    width: 56%;
    height: 10px;
    border-radius: 4px;
    background: linear-gradient(180deg, #5f3d27, #4c2f1e);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.35), inset 0 1px 2px rgba(255, 255, 255, 0.15);

    .chalk-piece {
        position: absolute;
        top: -7px;
        width: 16px;
        height: 5px;
        border-radius: 2px;
        box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }

    .piece-pink {
        left: 12%;
        background: #f4a9b8;
        transform: rotate(-18deg);
    }

    .piece-white {
        left: 42%;
        background: #f5f1e8;
        transform: rotate(8deg);
    }

    .piece-yellow {
        left: 72%;
        background: #f2d98b;
        transform: rotate(-10deg);
    }
}

@keyframes bubble-float {
    0% {
        transform: translateY(0) translateX(0) rotate(0deg) scale(0.85);
        opacity: 0;
    }

    10% {
        opacity: 0.95;
    }

    45% {
        transform: translateY(-22vh) translateX(12px) rotate(6deg) scale(1);
    }

    80% {
        transform: translateY(-38vh) translateX(-8px) rotate(-4deg) scale(1.03);
        opacity: 0.8;
    }

    100% {
        transform: translateY(-48vh) translateX(6px) rotate(2deg) scale(1.05);
        opacity: 0;
    }
}

@keyframes board-in {
    from {
        opacity: 0;
        transform: translateY(12px) scale(0.98);
    }

    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

@media (prefers-reduced-motion: reduce) {
    .blackboard-wrap {
        animation: none;
    }

    .bubble {
        animation: none;
        bottom: 30%;
        opacity: 0.9;
    }
}
</style>
