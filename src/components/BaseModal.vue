<!-- 
<div class="form-group">
  <label>類別</label>

  <div
    class="picker-trigger"
    @click="showCategoryModal = true"
  >
    點我選擇類別
  </div>
</div>

<BaseModal v-model="showCategoryModal">
  <div style="padding: 24px">
    <h3>這是一個小視窗</h3>
    <p>這裡放任何你想放的內容</p>

    <button @click="showCategoryModal = false">
      關閉
    </button>
  </div>
</BaseModal> -->


<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  closeOnEsc: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const close = () => {
  emit('update:modelValue', false)
}

const onKeydown = (e) => {
  if (props.closeOnEsc && e.key === 'Escape') {
    close()
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <transition name="fade">
      <div
        v-if="modelValue"
        class="modal-overlay"
        @click="close"
      >
        <div class="modal-content" @click.stop>
          <slot />
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 16px;
  max-width: 480px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0,0,0,.2);
}
</style>
