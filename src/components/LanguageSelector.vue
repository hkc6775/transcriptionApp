<template>
    <select 
      :value="selectedLanguage" 
      @change="$emit('update:selectedLanguage', $event.target.value)" 
      class="button primary  text-white bg-gray-100"
    >
      <option v-for="lang in languages" :key="lang.code" :value="lang.code">
        {{ lang.name }}
      </option>
    </select>
</template>
  
<script setup>
  defineProps({
    selectedLanguage: String,
    languages: Array,
  });
  
  defineEmits(["update:selectedLanguage"]);
</script>
  