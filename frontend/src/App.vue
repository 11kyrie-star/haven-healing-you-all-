<script setup lang="ts"></script>

<template>
  <RouterView></RouterView>
  <div class="pc-only-mask">
    <div class="pc-only-card">
      <div class="pc-only-title">Haven</div>
      <p class="pc-only-text">本社区只支持电脑端访问<br>请使用电脑浏览器打开</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pc-only-mask{
  display: none;
}
@media(max-width:768px){
.pc-only-mask{
  display: flex;
  position: fixed;
  inset: 0;
  z-index: 99999;
  background: #f5efe9;
  justify-content: center;
  align-items: center;
  .pc-only-title{
    font-family: 'Great Vibes',cursive;
    font-size: 3rem;
    color: rgb(60,30,30,0.8);
  }
  .pc-only-text{
    margin-top: 12px;
    font-family: var(--font-main);
    color: rgb(50, 50,50, 0.7);
    line-height: 1.8;
    text-align: center;
  }
}
}
</style>
