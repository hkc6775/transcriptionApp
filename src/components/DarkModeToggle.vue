<template>
    <button @click="toggleDarkMode" class="text-white bg-gray-100 button primary">
      {{ "Mode " + (isDarkMode ? "Clair" : "Sombre") }}
    </button>
</template>
  
<script setup>
  import { ref, onMounted } from "vue";
  
  const isDarkMode = ref(localStorage.getItem("darkMode") === "true");
  
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    localStorage.setItem("darkMode", isDarkMode.value);
    document.body.classList.toggle("dark", isDarkMode.value);
  };
  
  onMounted(() => {
    document.body.classList.toggle("dark", isDarkMode.value);
  });
</script>  