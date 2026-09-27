<template>
  <div class="community-counts" aria-label="Haven 社区数据">
    <div class="count-item">
      <div class="count-icon count-icon--post">
        <el-icon :size="20"><Document /></el-icon>
      </div>
      <div class="count-content">
        <span class="count-value">{{ post_count>9999 ? post_count/10000+'w':post_count }}</span>
        <span class="count-label">帖子总数</span>
      </div>
    </div>

    <div class="count-divider" aria-hidden="true"></div>

    <div class="count-item">
      <div class="count-icon count-icon--user">
        <el-icon :size="20"><User /></el-icon>
      </div>
      <div class="count-content">
        <span class="count-value">{{ user_count>9999? user_count/10000+'w' : user_count }}</span>
        <span class="count-label">注册用户</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Document, User } from '@element-plus/icons-vue'
import { getcount } from '@/api/getcount';
import {ref, onMounted } from 'vue';
const user_count=ref(0)
const post_count=ref(0)
onMounted(async()=>{
const res=await getcount()
if(res.status===0){
    user_count.value=res.data.user_count
    post_count.value=res.data.post_count
}
})
</script>

<style scoped lang="scss">
.community-counts {
  position: absolute;
  right: 4%;
  bottom: 5%;
  z-index: 3;
  display: flex;
  align-items: center;
  gap: 22px;
  width: fit-content;
  font-family: var(--font-main);
  user-select: none;
  animation: counts-in 0.7s 0.25s ease both;
}

.count-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.count-icon {
  display: grid;
  place-items: center;
  transition:
    transform 0.28s ease,
    filter 0.28s ease;
}

.count-icon--post {
  color: #f4d58d;
  filter: drop-shadow(0 2px 6px rgba(45, 25, 35, 0.42));
}

.count-icon--user {
  color: #f5a9b8;
  filter: drop-shadow(0 2px 6px rgba(45, 25, 35, 0.42));
}

.count-content {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.count-value {
  font-family: 'Inter', var(--font-main);
  font-size: 1.5rem;
  font-weight: 700;
  line-height: 1.1;
  color: #f4d58d;
  font-variant-numeric: tabular-nums;
  text-shadow:
    0 2px 8px rgba(45, 25, 35, 0.5),
    0 1px 2px rgba(45, 25, 35, 0.35);
}

.count-item:last-child .count-value {
  color: #f5a9b8;
}

.count-label {
  font-size: 0.82rem;
  font-weight: 600;
  line-height: 1.25;
  color: rgba(255, 255, 255, 0.82);
  text-shadow: 0 1px 6px rgba(45, 25, 35, 0.55);
  white-space: nowrap;
}

.count-divider {
  align-self: stretch;
  width: 1px;
  min-height: 42px;
  background: linear-gradient(
    180deg,
    transparent 0%,
    rgba(255, 255, 255, 0.42) 24%,
    rgba(255, 255, 255, 0.42) 76%,
    transparent 100%
  );
}

@media (prefers-reduced-motion: no-preference) {
  .count-item {
    transition: transform 0.28s ease;
  }

  .count-item:hover {
    transform: translateY(-2px);

    .count-icon {
      transform: scale(1.06);
      filter: drop-shadow(0 3px 8px rgba(45, 25, 35, 0.52));
    }
  }
}

@keyframes counts-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1200px) {
  .community-counts {
    right: 3%;
    gap: 16px;
  }

  .count-item {
    gap: 9px;
  }

  .count-value {
    font-size: 1.3rem;
  }
}
</style>
