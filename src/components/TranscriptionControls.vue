<template>
    <button @click="stopListening" class="button stop text-white bg-gray-100 hover" :disabled="!isListening">
        ⏹️ Arrêter
    </button>
    <button @click="resetTranscript" class="button danger text-white bg-gray-100 hover" :disabled="!transcript">
        🗑️ Réinitialiser
    </button>
</template>
  
<script setup>
  defineProps({
    stopListening: Function,
    resetTranscript: Function,
    isListening: Boolean,
    transcript: String,
  });
</script>
  