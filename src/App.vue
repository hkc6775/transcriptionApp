<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import { Document, Packer, Paragraph, Style, TextRun } from "docx";
import { saveAs } from "file-saver";
import Dexie from "dexie";
import RecordingControls from "./components/RecordingControls.vue";
import LanguageSelector from "./components/LanguageSelector.vue";
import TranscriptionControls from "./components/TranscriptionControls.vue";
import DarkModeToggle from "./components/DarkModeToggle.vue";
import LiveCaption from "./components/LiveCaption.vue";
import HistoryList from "./components/HistoryList.vue";

const isListening = ref(false);
const transcript = ref("");
const history = ref([]);
const selectedLanguage = ref("fr-FR");
const recognition = ref(null);
let updateFrame = null;
const editingItemId = ref(null);
const editingText = ref("");
const pos11Container = ref(null); // Référence à la div

const languages = [
  { code: "fr-FR", name: "Français" },
  { code: "en-US", name: "English" },
  { code: "es-ES", name: "Español" },
  { code: "de-DE", name: "Deutsch" },
  { code: "it-IT", name: "Italiano" },
  { code: "pt-PT", name: "Português" },
  { code: "ru-RU", name: "Русский (Russe)" },
  { code: "zh-CN", name: "中文 (Chinois Simplifié)" },
  { code: "ja-JP", name: "日本語 (Japonais)" },
  { code: "ko-KR", name: "한국어 (Coréen)" },
  { code: "ar-SA", name: "العربية (Arabe)" },
  { code: "nl-NL", name: "Nederlands (Néerlandais)" },
  { code: "sv-SE", name: "Svenska (Suédois)" },
  { code: "pl-PL", name: "Polski (Polonais)" },
  { code: "hi-IN", name: "हिन्दी (Hindi)" },
  { code: "tr-TR", name: "Türkçe (Turc)" },
  { code: "he-IL", name: "עברית (Hébreu)" },
  { code: "th-TH", name: "ไทย (Thaï)" },
  { code: "id-ID", name: "Bahasa Indonesia" },
  { code: "vi-VN", name: "Tiếng Việt (Vietnamien)" },
  { code: "uk-UA", name: "Українська (Ukrainien)" },
  { code: "el-GR", name: "Ελληνικά (Grec)" },
  { code: "da-DK", name: "Dansk (Danois)" },
  { code: "fi-FI", name: "Suomi (Finnois)" },
  { code: "no-NO", name: "Norsk (Norvégien)" },
  { code: "hu-HU", name: "Magyar (Hongrois)" },
  { code: "ro-RO", name: "Română (Roumain)" },
  { code: "bg-BG", name: "Български (Bulgare)" },
  { code: "cs-CZ", name: "Čeština (Tchèque)" },
  { code: "ms-MY", name: "Bahasa Melayu (Malais)" },
];

// ✅ Optimisation de la base de données Dexie
const db = new Dexie("TranscriptionDB");
db.version(1).stores({ history: "++id, text" });

const saveToDatabase = async (text) => {
  if (text.trim()) {
    await db.history.add({ text });
    loadHistory(); // Recharge immédiatement l'historique
  }
};

const loadHistory = async () => {
  history.value = await db.history.toArray();
};

onMounted(loadHistory);

onMounted(() => {
  if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
    alert("Votre navigateur ne supporte pas la reconnaissance vocale !");
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition.value = new SpeechRecognition();
  recognition.value.continuous = true;
  recognition.value.interimResults = true;
  recognition.value.lang = selectedLanguage.value;

  recognition.value.onresult = (event) => {
    if (!updateFrame) {
      updateFrame = requestAnimationFrame(() => {
        transcript.value = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join(" ");
        updateFrame = null;
      });
    }
  };

  recognition.value.onerror = (event) => {
    console.error("Erreur de reconnaissance vocale : ", event.error);
  };
});

// 🎤 Démarrer l'écoute
const startListening = () => {
  if (recognition.value) {
    recognition.value.lang = selectedLanguage.value;
    recognition.value.start();
    isListening.value = true;
  }
};

// ⏹️ Arrêter l'écoute et sauvegarder
const stopListening = () => {
  if (recognition.value) {
    recognition.value.stop();
    isListening.value = false;
    if (transcript.value.trim()) {
      saveToDatabase(transcript.value);
      transcript.value = ""; // Réinitialisation après sauvegarde
    }
  }
};

// 🗑️ Réinitialiser la transcription proprement
const resetTranscript = () => {
  if (recognition.value) {
    recognition.value.stop(); // ✅ Arrêter la reconnaissance
  }
  transcript.value = ""; // ✅ Réinitialiser le texte

  // ✅ Redémarrer proprement la reconnaissance
  setTimeout(() => {
    if (isListening.value) {
      recognition.value.start();
    }
  }, 500); // Laisser un petit délai avant de redémarrer
};

const scrollToBottom = () => {
  nextTick(() => {
    if (pos11Container.value) {
      pos11Container.value.scrollTop = pos11Container.value.scrollHeight;
    }
  });
};

watch(transcript, () => {
  scrollToBottom();
});


// 📄 Télécharger en Word
const downloadWord = async () => {
  if (history.value.length === 0) {
    alert("Aucune transcription à télécharger !");
    return;
  }

  try {
    const paragraphs = [
      new Paragraph({
        children: [
          new TextRun({
            text: "Historique des transcriptions",
            bold: true,
            size: 32,
          }),
        ],
      }),
      ...history.value.map(
        (item) => new Paragraph({ children: [new TextRun(item.text)] })
      ),
    ];

    const doc = new Document({
      sections: [{ properties: {}, children: paragraphs }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, "transcriptions.docx");
  } catch (error) {
    console.error("Erreur lors de la génération du fichier Word :", error);
  }
};

const audioBlob = ref(null);
let recorder = ref(null);  // Déclarer recorder en tant que ref pour garantir qu'il est réactif
const isRecording = ref(false);  // Variable pour suivre l'état de l'enregistrement

// Fonction pour démarrer l'enregistrement audio
const startRecording = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder.value = new MediaRecorder(stream);  // Utilisation de recorder.value pour affecter l'objet MediaRecorder
    const chunks = [];

    recorder.value.ondataavailable = (event) => chunks.push(event.data);
    recorder.value.onstop = () => {
      audioBlob.value = new Blob(chunks, { type: "audio/wav" });
      saveAs(audioBlob.value, "audio_recording.wav");
    };

    recorder.value.start();
    isRecording.value = true;  // Marquer l'enregistrement comme en cours
  } catch (err) {
    console.error("Erreur d'enregistrement audio : ", err);
  }
};

// Fonction pour arrêter l'enregistrement audio
const stopRecording = () => {
  if (recorder.value && recorder.value.state === "recording") {
    recorder.value.stop();
    isRecording.value = false;  // Marquer l'enregistrement comme terminé
  }
};

// Fonction pour supprimer un élément spécifique de l'historique
const deleteHistoryItem = async (id) => {
  await db.history.delete(id);
  loadHistory();  // Recharge l'historique après la suppression
};

// Fonction pour vider l'historique
const clearHistory = async () => {
  await db.history.clear();
  loadHistory();  // Recharge l'historique après le vidage
};

// Fonction pour activer l'édition d'un élément
const startEditing = (id, text) => {
  console.log("Démarrage de l'édition pour l'élément avec l'ID", id, "et texte", text);  // Ajout du log
  editingItemId.value = id;
  editingText.value = text || "";
};

const updateHistoryItem = async (id, text) => {
  console.log("Texte après modification :", text);

  if (!text || text.trim() === "") { // 🔹 Vérification avant d'appeler trim()
    console.warn("Le texte est vide ou invalide, annulation de la modification.");
    return;
  }

  await db.history.update(id, { text });
  loadHistory(); // 🔹 Recharge immédiatement l'historique après modification
  editingItemId.value = null; // 🔹 Sortie du mode édition
  editingText.value = ""; // 🔹 Réinitialisation de l'édition
};

// Fonction pour modifier un élément de l'historique

</script>

<template>
  <div class="header bg-gray-100">
      <h3>📝 Transcription App</h3>
      <div id="header-right">
        <!-- Sélection de la langue -->
        <LanguageSelector :selectedLanguage="selectedLanguage" :languages="languages" />

        <!-- Mode nuit switch -->
        <DarkModeToggle />
      </div>
  </div>



  <div class="main12">
    <div class="pos21">
      <h1>🎤 Transcription en temps réel</h1>
    </div>

    <!-- Boutons de contrôle -->
    <div class="pos21">
      <button @click="startListening" class="button primary text-white bg-gray-100 hover">
        ▶️ Démarrer
      </button>
      <RecordingControls :startRecording="startRecording" :stopRecording="stopRecording" :isRecording="isRecording" />
    </div>

    <!-- Mode Live Caption (Sous-titres en plein écran) -->
    <div v-if="isListening" class="live-caption-container pos24">
      <div class="pos34">
        <TranscriptionControls :stopListening="stopListening" :resetTranscript="resetTranscript" :isListening="isListening" :transcript="transcript" />
      </div>
      <div ref="pos11Container" class="pos11">
        <LiveCaption :isListening="isListening" :transcript="transcript" />
      </div>
    </div>

    <!-- Historique et exportation -->
    <div class="pos01 bg-blue-600">
      <HistoryList 
      v-model:editingText="editingText"
      :history="history"
      :editingItemId="editingItemId"
      :clearHistory="clearHistory"
      :deleteHistoryItem="deleteHistoryItem"
      :downloadWord="downloadWord"
      @startEditing="startEditing"
      @deleteHistoryItem="deleteHistoryItem"
      @updateHistoryItem="updateHistoryItem"/>
    </div>

  </div>

  <div v-if="isRecording" class="pos22 center">
    <span id="buble"></span>
    <span>enregistrement en cour...</span>
  </div>
</template>

<style>
/* Désactive le curseur sur les boutons désactivés */
button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* 🌙 Mode Sombre */
body.dark .pos01 {
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  padding: 7px;
  background-color: transparent;
}

.pos01 {
  position: relative;
  display: block;
  width: 100%;
  height: auto;
  padding: 7px;
  background-color: rgba(197, 196, 196, 0.356);
}

/* ✨ Animation de fondu */
@keyframes fadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* 🌙 Mode Sombre */
body.dark {
  background-color: #121212;
  color: white;
}

body.dark .bg-gray-100,
body.dark .optionColor {
  background-color: #1f1f1f;
}

body.dark .text-white {
  color: #ddd;
}

body.dark .bg-blue-600 {
  background-color: #4e91b752;
}

/* 🏠 Header */
.header {
  position: fixed;
  top: 0px;
  left: 0px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  background-color: white;
  border-bottom: 1px solid gray;
  z-index: 1000;
}

/* 🎛️ Styles des boutons */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  font-size: 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  margin: 0.3rem;
  text-align: center;
}

.button.primary {
  background-color: #007bff;
  color: white;
}

.button.primary:hover {
  background-color: #0056b3;
}

.button.stop {
  background-color: #01942d;
  color: white;
}

.button.stop:hover {
  background-color: #015316;
}

.button.danger {
  background-color: #dc3545;
  color: white;
}

.button.danger:hover {
  background-color: #a71d2a;
}

/* 📌 Conteneur principal */
.main12 {
  position: relative;
  top: 30px;
  width: 60%;
  margin: auto;
  padding: 10px;
  display: block;
}

/* 📏 Sections flexibles */
.pos21 {
  width: 100%;
  padding: 8px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

.pos34 {
  position: relative;
  width: 100%;
  height: 10%;
  display: flex;
  justify-content: space-between;
  padding: 7px;
}

.pos11 {
  position: relative;
  width: 100%;
  height: 90%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 7px;
  overflow-y: auto; /* ✅ Permet le défilement */
}

/* 🎤 Zone de transcription */
.texta {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  z-index: 100000000;
}

.textarea1 {
  font-size: 2.5rem;
  background: transparent;
  color: white;
  border: none;
  outline: none;
  padding: 10px;
  word-wrap: break-word;
}

/* 📥 Bouton Enregistrer */
.btn-save {
  margin-top: 10px;
  padding: 7px;
}

.pos22 {
  position: fixed;
  left: 0px;
  bottom: 0px;
  width: 100%;
  height: auto;
  padding: 2rem;
  flex-flow: column;
  border-top-left-radius: 2rem;
  border-top-right-radius: 2rem;
  background: rgba(46, 45, 45, 0.897);
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 🟢 Bubble animation */
#buble {
  width: 30px;
  height: 30px;
  border: 2px solid blue;
  border-radius: 50%;
  box-shadow: 10px 30px 40px rgb(115, 168, 247);
  transition: 1s;
  animation: animate 1s ease-in-out infinite;
}

@keyframes animate {
  to {
    scale: 0.7;
    border: 2px solid red;
    box-shadow: 10px 30px 40px rgb(247, 97, 97);
  }
}

/* 📜 Liste des éléments */
ul {
  margin: 0;
  padding: 0;
}

li {
  display: flex;
  flex-wrap: nowrap;
  list-style: none;
  border-bottom: 1px solid gray;
}

.li-text {
  width: 80%;
  padding: 0.4rem;
  font-size: 1.2rem;
}

.li-text:hover {
  background-color: rgba(7, 7, 7, 0.603);
  color: white;
  border-radius: 0.2rem;
}

.li-btn {
  width: 20%;
  display: flex;
}

.li-btn button {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 5px;
  cursor: pointer;
  border: hidden;
  background-color: white;
  box-sizing: 1px 2px 3px gray;
}

.li-btn button:hover {
  scale: .9;
}

/* 📱📏 Media Queries pour le Responsive */
@media screen and (max-width: 1024px) {
  .main12 {
    top: 70px;
    width: 80%;
  }
  
  .button {
    padding: 10px 15px;
    font-size: 0.9rem;
  }

  .live-caption {
    font-size: 2rem;
  }

  .textarea1 {
    font-size: 2rem;
  }
}

@media screen and (max-width: 768px) {
  .header {
    flex-direction: column;
    text-align: center;
  }

  .main12 {
    top: 70px;
    width: 97%;
  }

  .button {
    padding: 8px 12px;
    font-size: 0.85rem;
  }

  .live-caption {
    font-size: 1.8rem;
  }

  .textarea1 {
    font-size: 1.8rem;
  }
  .li-btn {
    width: 20%;
  }
  .li-text {
    width: 80%;
  }
}

@media screen and (max-width: 480px) {
  .main12 {
    top: 70px;
    width: 100%;
    padding: 5px;
  }

  .button {
    padding: 6px 10px;
    font-size: 0.8rem;
  }

  .live-caption {
    font-size: 1.5rem;
    padding: 10px;
  }

  .textarea1 {
    font-size: 1.5rem;
  }
  .li-btn {
    width: 30%;
  }
  .li-text {
    width: 70%;
  }
}
</style>