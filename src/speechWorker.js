self.onmessage = (event) => {
    if (!("webkitSpeechRecognition" in self)) {
        self.postMessage({ error: "Votre navigateur ne supporte pas la reconnaissance vocale !" });
        return;
    }

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = event.data.lang;

    recognition.onresult = (e) => {
        const text = Array.from(e.results)
            .map((result) => result[0].transcript)
            .join(" ");
        self.postMessage({ transcript: text });
    };

    recognition.onerror = (e) => {
        self.postMessage({ error: e.error });
    };

    if (event.data.action === "start") recognition.start();
    if (event.data.action === "stop") recognition.stop();
};