<template>
    <p class="live-caption">{{ transcript || "En attente de transcription..." }}</p>
</template>
  
<script setup>
  defineProps({
    isListening: Boolean,
    transcript: String,
  });
</script>
  
<style>
  .live-caption-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    flex-flow: column;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9999;
  }
  
  .live-caption {
    font-size: 3rem;
    color: white;
    text-align: center;
    padding: 20px;
    text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.8);
    overflow-y: auto; /* ✅ Permet le défilement */
  }
</style>
  