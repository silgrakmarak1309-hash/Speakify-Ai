// Silent Mic Stream Pre-checker & Recovery Wrapper
(function initWebViewAudioGuard() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  // Polyfill SpeechRecognition error safety
  if (SpeechRecognition) {
    const originalStart = SpeechRecognition.prototype.start;
    
    SpeechRecognition.prototype.start = function() {
      try {
        // Force audio hardware warm-up prior to continuous recognition
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          navigator.mediaDevices.getUserMedia({ audio: true })
            .then((stream) => {
              // Immediately release pre-check tracks to keep mic available for SpeechRecognition
              stream.getTracks().forEach(track => track.stop());
              originalStart.call(this);
            })
            .catch((err) => {
              console.warn("WebView mic pre-check blocked, attempting direct start:", err);
              originalStart.call(this);
            });
        } else {
          originalStart.call(this);
        }
      } catch (e) {
        console.error("Speech Recognition launch prevented freeze:", e);
        // Fire custom event or end trigger if instance gets stuck
        if (typeof this.onerror === 'function') {
          this.onerror({ error: 'webview-blocked', message: e.message });
        }
      }
    };
  }
})();