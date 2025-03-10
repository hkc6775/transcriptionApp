<template>
    <div>
      <button @click="startRecording" class="button primary text-white bg-gray-100 hover" :disabled="isRecording">
        🎙️ Enregistrer audio
      </button>
      <button @click="stopRecording" class="button stop text-white bg-gray-100 hover" :disabled="!isRecording">
        ⏹️ Arrêter audio
      </button>
    </div>
</template>
  
<script setup>
  defineProps({
    startRecording: Function,
    stopRecording: Function,
    isRecording: Boolean,
  });
</script>
  