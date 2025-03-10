<template>
    <div>
      <h2 class="text-lg font-semibold mb-2">📜 Historique :</h2>
      <div class="header-1">
        <button @click="clearHistory" :disabled="history.length == 0" class="button danger text-white bg-gray-100 hover">
          🗑️ Vider l'historique
        </button>

        <DownloadButton :downloadWord="downloadWord" :history="history" />
      </div>
  
      <ul>
        <li v-for="item in history" :key="item.id">
        <template v-if="editingItemId === item.id">
          <div class="texta live-caption-container pos24 .bg-gray-100">
            <!-- Utilisation correcte de v-model sur une prop -->
            <textarea 
            :value="editingText" 
            @input="$emit('update:editingText', $event.target.value)" 
            class="textarea1">
            </textarea>
            <button @click="editHistoryItem(item.id, editingText)" class="button primary bg-gray-100 text-white">
            ✅ Sauvegarder
            </button>
          </div>
        </template>
        <template v-else>
          <div class="li-text">
            <span>{{ item.text }}</span>
          </div>
          <div class="li-btn">
            <button @click="$emit('startEditing', item.id, item.text)" class="btn-edit">✏️</button>
            <button @click="$emit('deleteHistoryItem', item.id)" class="btn-delete">❌</button>
          </div>
        </template>
        </li>
        <li v-if="history.length == 0" class="center">Aucune transcription enregistrer. Veuiller enregistrer !</li>
      </ul>
    </div>
  </template>
  
<script setup>
import DownloadButton from "./DownloadButton.vue";

// Définition des props pour recevoir les données
defineProps({
  history: Array,
  editingItemId: Number,
  editingText: String,
  downloadWord: Function,
  clearHistory: Function,
  deleteHistoryItem: Function,
});

// Définition des événements pour émettre les actions vers le parent
const emit = defineEmits(["update:editingText", "startEditing", "deleteHistoryItem", "updateHistoryItem"]);

// Fonction de modification de l'élément de l'historique
const editHistoryItem = (id, text=editingText) => {
  console.log("Texte à sauvegarder :", text);
  // Logique pour sauvegarder l'édition dans l'historique
  emit("update:editingText", text);
  emit("startEditing", id, text); // Demander au parent de sauvegarder
  // Émettre un événement pour informer le parent de la sauvegarde
 // Vérifier que 'text' est défini avant d'appliquer des méthodes dessus
 if (text && text.trim().length > 0) {
    emit("updateHistoryItem", id, text);
  } else {
    console.warn("Le texte est vide ou invalide");
  }
};
</script>
  