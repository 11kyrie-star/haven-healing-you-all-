<template>
  <div class="ai-entry" ref="aientry">
    <div class="ai-logo">
    <button
      class="ai-trigger"
      type="button"
      aria-label="打开 AI 倾诉"
      aria-describedby="ai-entry-tip"
      @click="handleClick"
    >
      <span class="ai-sheen" aria-hidden="true"></span>

      <!-- AI 小宠物：不悬浮也能一眼看出这是 AI -->
      <span class="ai-pet" aria-hidden="true">
        <span class="ai-pet-antenna">
          <span class="ai-pet-glow"></span>
        </span>
        <span class="ai-pet-body">
          <span class="ai-pet-eye ai-pet-eye--left"></span>
          <span class="ai-pet-eye ai-pet-eye--right"></span>
          <span class="ai-pet-blush ai-pet-blush--left"></span>
          <span class="ai-pet-blush ai-pet-blush--right"></span>
          <span class="ai-pet-mouth"></span>
        </span>
      </span>

      <span class="ai-label">
        <span class="ai-label-mark">AI</span>
        <span class="ai-label-text">倾诉</span>
      </span>
    </button>

    <span class="ai-halo" aria-hidden="true"></span>
    <span class="ai-pulse" aria-hidden="true"></span>
    <span class="ai-spark ai-spark--one" aria-hidden="true"></span>
    <span class="ai-spark ai-spark--two" aria-hidden="true"></span>
    <span class="ai-spark ai-spark--three" aria-hidden="true"></span>

    <div id="ai-entry-tip" class="ai-tip" role="tooltip">
      <span class="ai-tip-title">我是你的 Haven AI</span>
      <span class="ai-tip-desc">在想什么呢？说给我听</span>
    </div>
    </div>
    <div class="ai-chat" v-show="showai">
      <AiChat v-if="showopen"></AiChat>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue';
import { onClickOutside } from '@vueuse/core';
//是否展示AI聊天界面
const showai=ref(false)
const showopen=ref(false)
const handleClick = () => {
  if(!showopen.value){
    showopen.value=true
  }
  if(!showai.value){
    showai.value=true
  }else{
    showai.value=false
  }
}
//异步AI聊天组件
const loadai=()=>import('./Components/AiChat/index.vue')
const AiChat=defineAsyncComponent(loadai)
//点击以外的地方关闭聊天UI（右键菜单被 Teleport 到 body，要排除在外，否则点删除会连带关掉面板）
const aientry=ref<HTMLElement | null>(null)
onClickOutside(aientry,()=>{
  if(showai.value){
    showai.value=false
  }
},{ ignore: ['.ai-context-menu'] })
</script>

<style scoped lang="scss">
.ai-entry {
  // 与 Search 组件（width: min(560px, 90vw)，居中）右边缘对齐的偏移量
  --search-half: min(280px, 45vw);
  --ai-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  position: absolute;
  top: 5%;
  left: calc(50% + var(--search-half) + 60px);
  z-index: 30;
  height: 48px;
  .ai-logo{
     display: flex;
     font-family: $font-family-base;
     user-select: none;
  }
}

/* ---------- 悬浮渐变光环 ---------- */
.ai-halo {
  position: absolute;
  inset: -2px;
  overflow: hidden;
  border-radius: $radius-pill;
  opacity: 0;
  filter: blur(7px);
  pointer-events: none;
  transition: opacity 0.32s ease;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 150%;
    aspect-ratio: 1;
    translate: -50% -50%;
    background: conic-gradient(
      from 0deg,
      rgba(244, 213, 141, 0) 0deg,
      rgba(244, 213, 141, 0.9) 70deg,
      rgba(247, 140, 107, 0.9) 150deg,
      rgba(243, 79, 103, 0.9) 230deg,
      rgba(244, 213, 141, 0) 310deg,
      rgba(244, 213, 141, 0) 360deg
    );
    animation: ai-spin 4s linear infinite;
  }
}

/* ---------- 待机呼吸脉冲 ---------- */
.ai-pulse {
  position: absolute;
  inset: 0;
  border-radius: $radius-pill;
  border: 1px solid rgba(243, 79, 103, 0.45);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
  animation: ai-pulse 3.2s ease-out infinite;
}

/* ---------- 悬浮星点 ---------- */
.ai-spark {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: $radius-circle;
  background: radial-gradient(circle, #fff 0%, #f4d58d 55%, rgba(244, 213, 141, 0) 72%);
  opacity: 0;
  pointer-events: none;

  &--one {
    top: -5px;
    left: 15px;
  }

  &--two {
    right: 9px;
    bottom: -6px;
  }

  &--three {
    left: -6px;
    bottom: 8px;
    width: 4px;
    height: 4px;
  }
}

/* ---------- 按钮主体 ---------- */
.ai-trigger {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  height: 48px;
  padding: 0 14px 0 7px;
  border: 1px solid rgba(224, 167, 167, 0.45);
  border-radius: $radius-pill;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: $glass-blur-soft;
  box-shadow:
    0 4px 16px rgba(120, 60, 40, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  cursor: pointer;
  overflow: hidden;
  transition:
    transform 0.3s var(--ai-spring),
    border-color 0.3s ease,
    background-color 0.3s ease,
    box-shadow 0.3s ease;

  &:active {
    transform: translateY(0) scale(0.97);
    transition-duration: 0.12s;
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(243, 79, 103, 0.3),
      0 10px 24px rgba(243, 79, 103, 0.22);
  }
}

/* ---------- AI 小宠物本体 ---------- */
.ai-pet {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  transform-origin: 50% 78%;
  animation: ai-breathe 3.6s ease-in-out infinite;
}

.ai-pet-body {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 46% 46% 50% 50% / 42% 42% 56% 56%;
  background-image: linear-gradient(158deg, #fde3ab 0%, #f9a56f 46%, #f4707f 100%);
  background-size: 150% 150%;
  box-shadow:
    0 3px 10px rgba(243, 79, 103, 0.34),
    inset 0 1.5px 1px rgba(255, 255, 255, 0.7),
    inset 0 -7px 10px -7px rgba(150, 50, 40, 0.4);
  animation: ai-gradient 7s ease-in-out infinite;
  transition: box-shadow 0.3s ease;
}

/* 天线 + 发光触点 */
.ai-pet-antenna {
  position: absolute;
  top: -4px;
  left: 50%;
  width: 2px;
  height: 9px;
  margin-left: -1px;
  border-radius: 2px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(238, 118, 108, 0.9) 100%);
  transform-origin: bottom center;
  animation: ai-antenna 2.6s ease-in-out infinite;
}

.ai-pet-glow {
  position: absolute;
  top: -3px;
  left: 50%;
  width: 6px;
  height: 6px;
  margin-left: -3px;
  border-radius: $radius-circle;
  background: radial-gradient(circle, #fff 0%, #ffe6a8 45%, rgba(255, 190, 120, 0) 74%);
  box-shadow: 0 0 8px rgba(255, 214, 140, 0.9);
  animation: ai-glow 2.6s ease-in-out infinite;
}

/* 眼睛：周期性眨眼 */
.ai-pet-eye {
  position: absolute;
  top: 11px;
  width: 4.5px;
  height: 6.5px;
  border-radius: $radius-circle;
  background: rgba(94, 40, 32, 0.92);
  transform-origin: center;
  animation: ai-blink 4.6s ease-in-out infinite;
  transition: height 0.25s var(--ai-spring);

  &--left {
    left: 8px;
  }

  &--right {
    right: 8px;
  }
}

.ai-pet-mouth {
  position: absolute;
  bottom: 6px;
  left: 50%;
  width: 8px;
  height: 4px;
  translate: -50% 0;
  border-bottom: 1.5px solid rgba(120, 52, 42, 0.8);
  border-radius: 0 0 8px 8px;
  opacity: 0.5;
  transition:
    opacity 0.25s ease,
    height 0.25s var(--ai-spring);
}

.ai-pet-blush {
  position: absolute;
  bottom: 8px;
  width: 6px;
  height: 4px;
  border-radius: $radius-circle;
  background: rgba(243, 79, 103, 0.5);
  filter: blur(1.5px);
  opacity: 0;
  transition: opacity 0.28s ease;

  &--left {
    left: 3px;
  }

  &--right {
    right: 3px;
  }
}

/* ---------- 常显文案：AI 倾诉 ---------- */
.ai-label {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-left: 7px;
  white-space: nowrap;
}

.ai-label-mark {
  font-family: 'Inter', $font-family-base;
  font-size: 1rem;
  font-weight: 800;
  letter-spacing: 0.4px;
  background-image: linear-gradient(135deg, #efa93c 0%, #f5795a 52%, #f34f67 100%);
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 1px 2px rgba(243, 79, 103, 0.22));
}

.ai-label-text {
  font-size: 0.88rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: rgba(105, 48, 38, 0.92);
}

.ai-sheen {
  position: absolute;
  top: -60%;
  bottom: -60%;
  left: -45%;
  width: 34%;
  background: linear-gradient(
    100deg,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.9) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: skewX(-18deg);
  opacity: 0;
  pointer-events: none;
}

/* ---------- 悬浮提示气泡 ---------- */
.ai-tip {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: max-content;
  max-width: 240px;
  padding: 9px 14px 10px;
  border: 1px solid rgba(224, 167, 167, 0.35);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(14px);
  box-shadow:
    0 14px 32px rgba(120, 60, 40, 0.18),
    0 4px 12px rgba(120, 60, 40, 0.08);
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
  transform-origin: calc(100% - 22px) top;
  pointer-events: none;
  transition:
    opacity 0.24s ease,
    transform 0.3s var(--ai-spring);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 14px;
    right: 14px;
    height: 2px;
    border-radius: 0 0 6px 6px;
    background: linear-gradient(
      90deg,
      rgba(233, 189, 124, 0.8),
      rgba(224, 128, 113, 0.9),
      rgba(250, 130, 145, 0.7)
    );
  }

  &::after {
    content: '';
    position: absolute;
    top: -5px;
    right: 20px;
    width: 9px;
    height: 9px;
    border-top: 1px solid rgba(224, 167, 167, 0.35);
    border-left: 1px solid rgba(224, 167, 167, 0.35);
    border-radius: 1px 0 0 0;
    background: rgba(255, 255, 255, 0.96);
    transform: rotate(45deg);
  }
}

.ai-tip-title {
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.3;
  color: rgba(120, 60, 40, 0.88);
}

.ai-tip-desc {
  font-size: 0.78rem;
  line-height: 1.4;
  color: $color-gray-mid;
  white-space: nowrap;
}

/* ---------- 悬浮 / 键盘聚焦状态 ---------- */
.ai-logo:hover .ai-halo,
.ai-logo:focus-within .ai-halo {
  opacity: 0.75;
}

.ai-logo:hover .ai-pulse,
.ai-logo:focus-within .ai-pulse {
  animation: none;
  opacity: 0;
}

.ai-logo:hover .ai-trigger,
.ai-trigger:focus-visible {
  border-color: rgba(243, 79, 103, 0.5);
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 10px 24px rgba(243, 79, 103, 0.22),
    0 4px 12px rgba(120, 60, 40, 0.14),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  transform: translateY(-2px);
}

.ai-logo:hover .ai-pet,
.ai-trigger:focus-visible .ai-pet {
  animation: ai-pet-bounce 0.95s var(--ai-spring) infinite;
}

.ai-logo:hover .ai-pet-body,
.ai-trigger:focus-visible .ai-pet-body {
  box-shadow:
    0 5px 14px rgba(243, 79, 103, 0.42),
    inset 0 1.5px 1px rgba(255, 255, 255, 0.78),
    inset 0 -7px 10px -7px rgba(150, 50, 40, 0.4);
}

.ai-logo:hover .ai-pet-eye,
.ai-trigger:focus-visible .ai-pet-eye {
  height: 7.5px;
}

.ai-logo:hover .ai-pet-mouth,
.ai-trigger:focus-visible .ai-pet-mouth {
  height: 5px;
  opacity: 0.9;
}

.ai-logo:hover .ai-pet-blush,
.ai-trigger:focus-visible .ai-pet-blush {
  opacity: 1;
}

.ai-logo:hover .ai-pet-antenna {
  animation-duration: 1.1s;
}

.ai-logo:hover .ai-sheen {
  animation: ai-sheen 0.9s ease 0.05s;
}

.ai-logo:hover .ai-spark {
  animation: ai-twinkle 1.7s ease-in-out infinite;
}

.ai-logo:hover .ai-spark--two {
  animation-delay: 0.28s;
}

.ai-logo:hover .ai-spark--three {
  animation-delay: 0.6s;
}

.ai-logo:hover .ai-tip,
.ai-trigger:focus-visible ~ .ai-tip {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* ---------- 动效 ---------- */
@keyframes ai-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes ai-pulse {
  0% {
    opacity: 0.5;
    transform: scale(0.95);
  }
  60%,
  100% {
    opacity: 0;
    transform: scale(1.18);
  }
}

@keyframes ai-twinkle {
  0%,
  100% {
    opacity: 0;
    transform: scale(0.3) translateY(2px);
  }
  45% {
    opacity: 1;
    transform: scale(1) translateY(-1px);
  }
  70% {
    opacity: 0.6;
    transform: scale(0.8) translateY(-2px);
  }
}

@keyframes ai-sheen {
  0% {
    left: -45%;
    opacity: 0;
  }
  18% {
    opacity: 0.85;
  }
  100% {
    left: 118%;
    opacity: 0;
  }
}

@keyframes ai-gradient {
  0%,
  100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

@keyframes ai-breathe {
  0%,
  100% {
    transform: translateY(0) scale(1, 1);
  }
  50% {
    transform: translateY(-1px) scale(1.035, 0.965);
  }
}

@keyframes ai-pet-bounce {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  25% {
    transform: translateY(-4px) rotate(-4deg);
  }
  55% {
    transform: translateY(0) rotate(3deg);
  }
  78% {
    transform: translateY(-2px) rotate(-2deg);
  }
}

@keyframes ai-blink {
  0%,
  90%,
  100% {
    transform: scaleY(1);
  }
  94%,
  96% {
    transform: scaleY(0.12);
  }
}

@keyframes ai-antenna {
  0%,
  100% {
    transform: rotate(-7deg);
  }
  50% {
    transform: rotate(7deg);
  }
}

@keyframes ai-glow {
  0%,
  100% {
    transform: scale(0.82);
    opacity: 0.72;
  }
  50% {
    transform: scale(1.18);
    opacity: 1;
  }
}

/* ---------- 自适应 ---------- */
// 搜索栏是居中 + 560px 上限，常显文案在窄屏右侧放不下，
// 同时右上角问候语也占位，因此把入口挪到搜索栏右下方并右对齐。
@media (max-width: 1300px) {
  .ai-entry {
    top: calc(5% + 60px);
    left: auto;
    right: calc(50% - var(--search-half));
  }
}

// 搜索面板展开时先让位，避免两层浮层打架（渐进增强）

@media (prefers-reduced-motion: reduce) {
  .ai-pet,
  .ai-pet-body,
  .ai-pet-eye,
  .ai-pet-antenna,
  .ai-pet-glow,
  .ai-halo::before,
  .ai-pulse,
  .ai-spark,
  .ai-sheen {
    animation: none;
  }
}
</style>
