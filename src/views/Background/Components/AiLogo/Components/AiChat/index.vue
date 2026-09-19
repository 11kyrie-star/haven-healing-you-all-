<template>
  <section class="ai-container" aria-label="Haven AI 对话">
    <header class="ai-header">
      <div class="ai-identity">
        <span class="ai-sprite" aria-hidden="true">
          <span class="ai-sprite-highlight"></span>
          <span class="ai-sprite-eye ai-sprite-eye--left"></span>
          <span class="ai-sprite-eye ai-sprite-eye--right"></span>
          <span class="ai-sprite-mouth"></span>
        </span>
        <span class="ai-identity-copy">
          <strong>Haven AI</strong>
          <span class="ai-online">
            <i aria-hidden="true"></i>
            正在陪你
          </span>
        </span>
      </div>
      <span class="ai-header-mark" aria-hidden="true">AI</span>
    </header>

    <div class="ai-list" aria-live="polite" @scroll="closeMenu" ref="listRef">
      <div class="ai-date"><span>今天</span></div>

      <article
        v-for="(message, index) in messages"
        :key="message.id"
        class="ai-message"
        :class="{ 'ai-message--me': message.from !== 'ai' }"
        @contextmenu.prevent="openMenu($event, message)"
      >
        <span v-if="message.from === 'ai'" class="ai-message-avatar" aria-hidden="true">
          <span></span>
          <span></span>
          <i></i>
        </span>

        <div class="ai-message-content">
          <span class="ai-message-name">{{ message.from === 'ai' ? 'Haven AI' : '我' }}</span>
          <div
            class="ai-bubble"
            :class="{
              'ai-bubble--loading':
                isLoading && index === messages.length - 1 && message.from === 'ai',
            }"
          >
            <p v-if="message.content && message.content !== '思考中...'">
              {{ message.content }}
            </p>
            <div
              v-if="isLoading && index === messages.length - 1 && message.from === 'ai'"
              class="ai-typing"
              role="status"
              aria-label="Haven AI 正在回复"
            >
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <time>{{ message.time }}</time>
        </div>
      </article>

      <div class="ai-soft-prompt">
        <span aria-hidden="true">...</span>
        <p>不用急着把话想好，我会慢慢听。</p>
      </div>
    </div>

    <footer class="ai-input">
      <div class="ai-composer">
        <textarea
          rows="1"
          aria-label="输入想说的话"
          placeholder="把心里的话，慢慢说给我听…"
          v-model="text"
          @keydown.enter.exact.prevent="pushmessage"
        ></textarea>
        <button
          v-if="showPushbtn"
          class="ai-send"
          type="button"
          aria-label="发送消息"
          :disabled="!text.trim()"
          @click="pushmessage"
        >
          <el-icon :size="17"><Promotion /></el-icon>
        </button>
        <button
          v-else
          class="ai-send ai-send--pause"
          type="button"
          aria-label="暂停生成"
          @click="stop"
        >
          <el-icon :size="18"><VideoPause /></el-icon>
        </button>
      </div>
      <p class="ai-input-hint">这里没有评判，只有认真倾听</p>
    </footer>
  </section>

  <!-- 消息右键菜单：Teleport 到 body，避免被容器的 transform / overflow 影响定位 -->
  <Teleport to="body">
    <div
      v-if="menuVisible"
      class="ai-context-menu"
      :style="{ left: menuX + 'px', top: menuY + 'px' }"
      role="menu"
      aria-label="消息操作"
      @mousedown.stop
      @contextmenu.prevent
    >
      <button
        class="ai-context-menu-item"
        type="button"
        role="menuitem"
        @click="handleDelete"
      >
        <el-icon :size="13"><Delete /></el-icon>
        <span>删除</span>
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { Promotion, VideoPause, Delete } from '@element-plus/icons-vue'
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { streamrequest } from '@/utils/streamrequest'
const text = ref('')
type MessageStatus='done' | 'pending' | 'stopped' | 'error'
type message = {
  id: number
  from: string
  content: string
  time: string,
  status?:MessageStatus
}
//消息数组
const messages = ref<message[]>([
  {
    id: Date.now(),
    from: 'ai',
    content: '你好呀，我是 Haven。今天也辛苦了，愿意和我说说吗？',
    time: `${new Date().getHours()}:${new Date().getMinutes()}`,
    status:'done'
  },
])
// 控制最后一条 AI 消息的加载样式
const isLoading = ref(false)
//控制发送按钮是否显示
const showPushbtn = ref(true)
//控制流式输出
let abortController: AbortController | null
//推送消息
let push = ref(false) //防止用户在输出的时候再次发送
const pushmessage = async () => {
  if (push.value) {
    return
  }
  if (isLoading.value) {
    return
  }
  abortController = new AbortController()
  const signal = abortController.signal
  const newtext = text.value.trim()
  if (!newtext) {
    return
  }
  let usermessage = ref<message>({
    id: Date.now() + Math.random(),
    from: 'user',
    content: newtext,
    time: `${new Date().getHours()}:${new Date().getMinutes()}`,
  })
  messages.value.push(usermessage.value)
  push.value = true
  text.value = ''
  showPushbtn.value = false
  let aimessage = ref<message>({
    id: Date.now() + Math.random(),
    from: 'ai',
    content: '思考中...',
    time: `${new Date().getHours()}:${new Date().getMinutes()}`,
    status:'pending'
  })
  messages.value.push(aimessage.value)
  isLoading.value = true
  const handlemessage = (res: string) => {
    if (aimessage.value.content === '思考中...') {
      aimessage.value.content = res
    } else {
      aimessage.value.content += res
    }
  }
  try {
    await streamrequest(messages.value, handlemessage, signal)
    aimessage.value.status='done'
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      aimessage.value.status='pending'
      usermessage.value.status='error'
      return
    }
    throw err
  } finally {
    abortController = null
    push.value = false
    isLoading.value = false
    showPushbtn.value=true
    scrolltoBottom()
  }
}
//取消生成
const stopstream = () => {
  abortController?.abort()
  abortController = null
}
//暂停函数
const stop = () => {
  stopstream()
  showPushbtn.value = true
  isLoading.value = false
  messages.value[messages.value.length-1]!.status='stopped'
}

/* ---------- 消息右键菜单 ---------- */
// 菜单大致宽高，用于贴边判断
const MENU_WIDTH = 132
const MENU_HEIGHT = 44
// 菜单是否显示
const menuVisible = ref(false)
// 菜单渲染位置（相对视口）
const menuX = ref(0)
const menuY = ref(0)
// 当前被右键的消息
const menuTarget = ref<message | null>(null)

// 打开菜单：记住目标 + 算出不超出视口的位置
const openMenu = (e: MouseEvent, item: message) => {
  menuTarget.value = item
  const maxX = Math.max(0, window.innerWidth - MENU_WIDTH)
  const maxY = Math.max(0, window.innerHeight - MENU_HEIGHT)
  menuX.value = Math.min(e.clientX, maxX)
  menuY.value = Math.min(e.clientY, maxY)
  menuVisible.value = true
}

// 关闭菜单
const closeMenu = () => {
  menuVisible.value = false
  menuTarget.value = null
}

// 点击页面任意位置关闭（菜单内部的 mousedown 已被 .stop 拦截）
const handleGlobalMouseDown = () => {
  closeMenu()
}

// 按 Esc 关闭
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') closeMenu()
}

onMounted(() => {
  document.addEventListener('mousedown', handleGlobalMouseDown)
  document.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleGlobalMouseDown)
  document.removeEventListener('keydown', handleKeyDown)
})

// 删除被右键的消息
const handleDelete = () => {
  const target = menuTarget.value
  if (!target) return
  // 正在流式输出，且删的就是正在生成的那条 → 先停止生成
  const isStreaming = isLoading.value && messages.value[messages.value.length - 1]?.id === target.id
  if (isStreaming) {
    stop()
  }
  messages.value = messages.value.filter((item) => item.id !== target.id)
  closeMenu()
}

//时刻展现最新消息
const listRef=ref<HTMLElement | null>()
const scrolltoBottom=async()=>{
  await nextTick()
  const el=listRef.value
  if(el){return}
  el!.scrollTop=el!.scrollHeight
}
</script>

<style scoped lang="scss">
.ai-container {
  --ai-water-deep: #397b9a;
  --ai-water-mid: #79cae9;
  --ai-water-light: #dff7ff;
  --ai-ink: rgba(55, 66, 75, 0.88);
  --ai-spring: cubic-bezier(0.34, 1.42, 0.64, 1);

  position: absolute;
  top: calc(100% + 14px);
  right: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  width: min(360px, calc(100vw - 32px));
  height: min(510px, calc(100vh - 120px));
  min-height: 400px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.76);
  border-radius: 20px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.96), rgba(255, 247, 244, 0.91));
  box-shadow:
    0 24px 60px rgba(92, 55, 50, 0.2),
    0 8px 20px rgba(120, 60, 40, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(22px) saturate(1.16);
  color: var(--ai-ink);
  font-family: $font-family-base;
  transform-origin: 100% 0;
  animation: ai-chat-in 0.34s var(--ai-spring) both;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 18px;
    right: 18px;
    z-index: 3;
    height: 3px;
    border-radius: 0 0 8px 8px;
    background: linear-gradient(
      90deg,
      rgba(121, 202, 233, 0.86),
      rgba(226, 184, 206, 0.75),
      rgba(240, 164, 146, 0.78)
    );
    pointer-events: none;
  }
}

.ai-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 66px;
  padding: 15px 18px 13px;
  border-bottom: 1px solid rgba(223, 187, 184, 0.24);
  background: linear-gradient(
    110deg,
    rgba(232, 249, 255, 0.92) 0%,
    rgba(255, 247, 243, 0.9) 65%,
    rgba(255, 242, 238, 0.86) 100%
  );
}

.ai-identity {
  display: flex;
  align-items: center;
  gap: 11px;
  min-width: 0;
}

.ai-identity-copy {
  display: flex;
  flex-direction: column;
  gap: 3px;

  strong {
    font-size: 0.94rem;
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: 0.2px;
    color: rgba(65, 74, 82, 0.9);
  }
}

.ai-online {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  line-height: 1;
  color: rgba(85, 128, 146, 0.82);

  i {
    width: 6px;
    height: 6px;
    border-radius: $radius-circle;
    background: #73ccae;
    box-shadow: 0 0 0 3px rgba(115, 204, 174, 0.13);
  }
}

.ai-sprite {
  position: relative;
  flex: 0 0 auto;
  display: block;
  width: 38px;
  height: 38px;
  border: 1px solid rgba(122, 199, 229, 0.56);
  border-radius: 46% 46% 52% 52% / 42% 42% 58% 58%;
  background: linear-gradient(150deg, #eafcff 0%, #a9e3f5 48%, #74c2e2 100%);
  box-shadow:
    0 6px 16px rgba(81, 165, 200, 0.23),
    inset 0 2px 2px rgba(255, 255, 255, 0.86),
    inset 0 -7px 10px -7px rgba(45, 118, 151, 0.36);
}

.ai-sprite-highlight {
  position: absolute;
  top: 6px;
  left: 8px;
  width: 10px;
  height: 6px;
  border-radius: $radius-pill;
  background: rgba(255, 255, 255, 0.76);
  filter: blur(0.3px);
  transform: rotate(-24deg);
}

.ai-sprite-eye {
  position: absolute;
  top: 17px;
  width: 4px;
  height: 5px;
  border-radius: $radius-circle;
  background: rgba(41, 101, 128, 0.8);
  box-shadow: 0 1px 1px rgba(255, 255, 255, 0.55);

  &--left {
    left: 10px;
  }

  &--right {
    right: 10px;
  }
}

.ai-sprite-mouth {
  position: absolute;
  bottom: 9px;
  left: 50%;
  width: 7px;
  height: 4px;
  translate: -50% 0;
  border-bottom: 1.5px solid rgba(45, 117, 147, 0.6);
  border-radius: 0 0 8px 8px;
}

.ai-header-mark {
  display: grid;
  place-items: center;
  width: 30px;
  height: 24px;
  border: 1px solid rgba(154, 205, 225, 0.35);
  border-radius: $radius-pill;
  background: rgba(255, 255, 255, 0.52);
  color: rgba(82, 152, 180, 0.75);
  font-family: 'Inter', $font-family-base;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.7px;
}

.ai-list {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 16px 15px 20px;
  background:
    radial-gradient(circle at 5% 2%, rgba(203, 239, 250, 0.36), transparent 34%),
    linear-gradient(180deg, rgba(248, 253, 255, 0.78) 0%, rgba(255, 250, 247, 0.82) 100%);
  scrollbar-width: thin;
  scrollbar-color: rgba(117, 187, 213, 0.34) transparent;

  &::-webkit-scrollbar {
    width: 5px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: $radius-pill;
    background: rgba(117, 187, 213, 0.34);
  }
}

.ai-date {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 1px 0 18px;
  color: rgba(132, 146, 154, 0.62);
  font-size: 0.66rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(188, 206, 211, 0.35), transparent);
  }

  span {
    flex: 0 0 auto;
  }
}

.ai-message {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  margin-top: 16px;

  &:first-of-type {
    margin-top: 0;
  }

  &--me {
    justify-content: flex-end;

    .ai-message-content {
      align-items: flex-end;
    }

    .ai-message-name {
      padding-right: 3px;
      color: rgba(184, 105, 92, 0.7);
    }

    .ai-bubble {
      border-color: rgba(235, 150, 137, 0.3);
      border-radius: 18px 6px 18px 18px;
      background: linear-gradient(145deg, #ffe3dc 0%, #ffd2ca 100%);
      box-shadow:
        0 7px 18px rgba(203, 112, 96, 0.14),
        inset 0 1px 0 rgba(255, 255, 255, 0.66);

      p {
        color: rgba(108, 60, 53, 0.9);
      }
    }
  }
}

.ai-message-avatar {
  position: relative;
  flex: 0 0 auto;
  display: block;
  width: 27px;
  height: 27px;
  margin-top: 18px;
  border: 1px solid rgba(142, 207, 231, 0.52);
  border-radius: 48% 48% 52% 52% / 43% 43% 57% 57%;
  background: linear-gradient(145deg, #effcff 0%, #b8e8f6 52%, #83cbe5 100%);
  box-shadow:
    0 5px 12px rgba(86, 166, 198, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.86);

  span {
    position: absolute;
    top: 11px;
    width: 3px;
    height: 4px;
    border-radius: $radius-circle;
    background: rgba(56, 120, 146, 0.75);

    &:first-child {
      left: 7px;
    }

    &:nth-child(2) {
      right: 7px;
    }
  }

  i {
    position: absolute;
    bottom: 6px;
    left: 50%;
    width: 5px;
    height: 3px;
    translate: -50% 0;
    border-bottom: 1px solid rgba(56, 120, 146, 0.54);
    border-radius: 0 0 6px 6px;
  }
}

.ai-message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  max-width: min(82%, 270px);
  gap: 5px;
}

.ai-message-name {
  padding-left: 3px;
  color: rgba(83, 157, 185, 0.76);
  font-size: 0.67rem;
  line-height: 1;
}

.ai-bubble {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 8px;
  overflow: hidden;
  padding: 10px 13px 11px;
  border: 1px solid rgba(133, 206, 233, 0.42);
  border-radius: 6px 18px 18px 18px;
  background: linear-gradient(145deg, rgba(236, 251, 255, 0.98) 0%, rgba(202, 238, 250, 0.96) 100%);
  box-shadow:
    0 7px 18px rgba(76, 155, 188, 0.13),
    inset 0 1px 0 rgba(255, 255, 255, 0.84);
  &::before {
    content: '';
    position: absolute;
    top: 5px;
    left: 12px;
    right: 12px;
    height: 1px;
    border-radius: $radius-pill;
    background: linear-gradient(90deg, rgba(255, 255, 255, 0.86), rgba(255, 255, 255, 0));
    pointer-events: none;
  }

  p {
    flex: 1;
    min-width: 0;
    margin: 0;
    color: rgba(52, 94, 112, 0.92);
    font-size: 0.84rem;
    line-height: 1.7;
    text-align: left;
    white-space: pre-wrap;
    word-break: break-word;
  }

  &.ai-bubble--loading {
    min-width: 72px;
    padding-block: 13px;
    border-color: rgba(119, 199, 229, 0.52);
    box-shadow:
      0 8px 22px rgba(76, 155, 188, 0.18),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        105deg,
        transparent 22%,
        rgba(255, 255, 255, 0.5) 48%,
        transparent 76%
      );
      transform: translateX(-120%);
      animation: ai-loading-sheen 1.8s ease-in-out infinite;
      pointer-events: none;
    }
  }
}

.ai-typing {
  position: relative;
  z-index: 1;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 26px;
  height: 12px;
  margin: 0 1px 1px 0;
  transform: translateY(-1px);

  span {
    width: 6px;
    height: 6px;
    border-radius: $radius-circle;
    background: linear-gradient(145deg, #9ddef2 0%, #63b8dc 100%);
    box-shadow:
      0 3px 8px rgba(73, 153, 187, 0.22),
      inset 0 1px 0 rgba(255, 255, 255, 0.66);
    animation: ai-typing-wave 1.15s ease-in-out infinite;

    &:nth-child(2) {
      animation-delay: 0.14s;
    }

    &:nth-child(3) {
      animation-delay: 0.28s;
    }
  }
}

.ai-message-content time {
  padding: 0 4px;
  color: rgba(139, 150, 156, 0.55);
  font-family: 'Inter', $font-family-base;
  font-size: 0.62rem;
  line-height: 1;
}

.ai-soft-prompt {
  display: flex;
  align-items: center;
  gap: 8px;
  width: fit-content;
  max-width: 88%;
  margin: 17px auto 0;
  padding: 7px 11px;
  border: 1px dashed rgba(139, 199, 219, 0.32);
  border-radius: $radius-pill;
  background: rgba(255, 255, 255, 0.48);
  color: rgba(105, 139, 151, 0.72);

  span {
    color: rgba(104, 188, 218, 0.82);
    font-family: 'Inter', $font-family-base;
    font-size: 0.7rem;
    letter-spacing: 1px;
    line-height: 1;
  }

  p {
    margin: 0;
    font-size: 0.68rem;
    line-height: 1.5;
  }
}

.ai-input {
  position: relative;
  z-index: 2;
  flex: 0 0 auto;
  padding: 11px 15px 13px;
  border-top: 1px solid rgba(223, 187, 184, 0.22);
  background: rgba(255, 252, 251, 0.93);
  user-select: text;
}

.ai-composer {
  display: flex;
  align-items: flex-end;
  gap: 9px;
  padding: 6px 6px 6px 13px;
  border: 1px solid rgba(196, 205, 211, 0.42);
  border-radius: 17px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow:
    inset 0 1px 2px rgba(94, 112, 120, 0.04),
    0 3px 12px rgba(141, 103, 96, 0.06);
  transition:
    border-color 0.22s ease,
    box-shadow 0.22s ease,
    background-color 0.22s ease;

  &:focus-within {
    border-color: rgba(116, 191, 220, 0.65);
    background: #fff;
    box-shadow:
      0 0 0 3px rgba(115, 196, 226, 0.13),
      0 5px 16px rgba(86, 154, 181, 0.1);
  }

  textarea {
    flex: 1;
    min-width: 0;
    height: 36px;
    padding: 8px 0 6px;
    border: 0;
    outline: 0;
    resize: none;
    background: transparent;
    color: rgba(66, 71, 75, 0.88);
    font-family: $font-family-base;
    font-size: 0.8rem;
    line-height: 1.45;

    &::placeholder {
      color: rgba(139, 148, 153, 0.58);
    }
  }
}

.ai-send {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  padding: 0;
  border: 1px solid rgba(98, 179, 211, 0.36);
  border-radius: 13px;
  background: linear-gradient(145deg, #8cd8ef 0%, #69b9dd 100%);
  box-shadow:
    0 5px 12px rgba(80, 157, 190, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.48);
  color: #fff;
  cursor: pointer;
  transition:
    transform 0.22s var(--ai-spring),
    filter 0.22s ease,
    box-shadow 0.22s ease;

  &:not(:disabled):hover {
    filter: brightness(1.04);
    box-shadow:
      0 7px 15px rgba(80, 157, 190, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.52);
    transform: translateY(-1px);
  }

  &:not(:disabled):active {
    transform: translateY(0) scale(0.95);
  }

  &:disabled {
    opacity: 0.46;
    cursor: not-allowed;
    filter: grayscale(0.16);
    box-shadow: 0 3px 8px rgba(80, 157, 190, 0.12);
    transform: none;
  }

  &:focus-visible {
    outline: none;
    box-shadow:
      0 0 0 3px rgba(105, 185, 221, 0.24),
      0 5px 12px rgba(80, 157, 190, 0.24);
  }
}

.ai-send--pause {
  border-color: rgba(228, 132, 119, 0.4);
  background: linear-gradient(145deg, #ffc9bd 0%, #ef938c 100%);
  box-shadow:
    0 5px 13px rgba(202, 101, 91, 0.24),
    inset 0 1px 0 rgba(255, 255, 255, 0.52);

  &:not(:disabled):hover {
    box-shadow:
      0 7px 16px rgba(202, 101, 91, 0.32),
      inset 0 1px 0 rgba(255, 255, 255, 0.58);
  }
}

.ai-input-hint {
  margin: 7px 0 0;
  color: rgba(145, 151, 155, 0.58);
  font-size: 0.64rem;
  line-height: 1;
  text-align: center;
}

/* ---------- 消息右键菜单 ---------- */
.ai-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 132px;
  padding: 5px;
  border: 1px solid rgba(224, 167, 167, 0.35);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 14px 32px rgba(120, 60, 40, 0.18),
    0 4px 12px rgba(120, 60, 40, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(14px) saturate(1.1);
  font-family: $font-family-base;
  user-select: none;
  transform-origin: 0 0;
  animation: ai-menu-in 0.18s ease-out both;
}

.ai-context-menu-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: rgba(184, 105, 92, 0.88);
  font-family: inherit;
  font-size: 0.76rem;
  line-height: 1;
  cursor: pointer;
  transition:
    color 0.18s ease,
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;

  &:hover {
    color: #fff;
    background: linear-gradient(135deg, #f78c6b 0%, #f34f67 100%);
    box-shadow: 0 4px 12px rgba(243, 79, 103, 0.26);
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px rgba(243, 79, 103, 0.26);
  }
}

@keyframes ai-menu-in {
  from {
    opacity: 0;
    transform: scale(0.92) translateY(-3px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes ai-typing-wave {
  0%,
  60%,
  100% {
    opacity: 0.5;
    transform: translateY(0) scale(0.82);
  }

  30% {
    opacity: 1;
    transform: translateY(-4px) scale(1.08);
  }
}

@keyframes ai-loading-sheen {
  0% {
    transform: translateX(-120%);
  }

  55%,
  100% {
    transform: translateX(120%);
  }
}

@keyframes ai-chat-in {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-height: 680px) {
  .ai-container {
    height: min(450px, calc(100vh - 100px));
    min-height: 360px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .ai-container,
  .ai-send,
  .ai-context-menu {
    animation: none;
    transition: none;
  }

  .ai-typing span,
  .ai-bubble--loading::after {
    animation: none;
  }
}
</style>
