<template>
    <button @click="downloadWord" :disabled="history.length == 0" class="button primary text-white bg-gray-100 hover">
      📄 Télécharger fichier
    </button>
</template>
  
<script setup>
  defineProps({
    downloadWord: Function,
    history: Array,
  });
</script>  