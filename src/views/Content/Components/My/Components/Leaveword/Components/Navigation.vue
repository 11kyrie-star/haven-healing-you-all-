<template>
    <div class="nav-container">
        <input type="radio" name="word-tab" id="tab-mine" class="nav-radio" checked />
        <input type="radio" name="word-tab" id="tab-theirs" class="nav-radio" />
        <label for="tab-mine" class="nav-item nav-item-mine" @click="pushme">我对TA说</label>
        <label for="tab-theirs" class="nav-item nav-item-theirs" @click="pushta">Ta对我说</label>
        <span class="nav-slider"></span>
    </div>
</template>

<style scoped lang="scss">
.nav-container {
    position: relative;
    width: 100%;
    min-height: 46px;
    height: 6vh;
    display: flex;
    align-items: center;
    border-radius: 999px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(255, 236, 231, 0.72));
    border: 1px solid rgba(255, 255, 255, 0.85);
    box-shadow: 0 2px 10px rgba(120, 60, 40, 0.08);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
}

.nav-radio {
    position: absolute;
    opacity: 0;
    pointer-events: none;
}

.nav-item {
    position: relative;
    z-index: 1;
    flex: 1;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    user-select: none;
    font-family: 'LXGW WenKai', 'Inter', sans-serif;
    font-size: 0.95em;
    font-weight: 400;
    letter-spacing: 2px;
    color: rgba(90, 70, 70, 0.55);
    transition:
        color 0.3s ease,
        font-weight 0.3s ease,
        font-size 0.3s ease,
        letter-spacing 0.3s ease;

    &:hover {
        color: rgba(224, 82, 107, 0.75);
    }

    &:active {
        transform: scale(0.97);
    }
}

#tab-mine:checked ~ .nav-item-mine,
#tab-theirs:checked ~ .nav-item-theirs {
    font-size: 1.05em;
    font-weight: 700;
    letter-spacing: 3px;
    color: #e0526b;
}

#tab-mine:focus-visible ~ .nav-item-mine,
#tab-theirs:focus-visible ~ .nav-item-theirs {
    outline: 2px dashed rgba(243, 79, 103, 0.55);
    outline-offset: -4px;
    border-radius: 999px;
}

.nav-slider {
    position: absolute;
    bottom: 5px;
    left: 25%;
    width: 30%;
    height: 3px;
    border-radius: 999px;
    background: linear-gradient(90deg, #f78c6b, #f34f67);
    box-shadow: 0 2px 6px rgba(243, 79, 103, 0.4);
    transform: translateX(-50%);
    transition: left 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}

#tab-theirs:checked ~ .nav-slider {
    left: 75%;
}
</style>

<script setup lang="ts">
import { useRouter } from 'vue-router';
const router=useRouter()
const pushme=()=>{
    router.push('/layout/content/leaveword/myword')
}
const pushta=()=>{
    router.push('/layout/content/leaveword/taword')
}
</script>
