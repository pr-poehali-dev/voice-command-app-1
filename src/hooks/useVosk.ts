import { useState, useRef, useCallback } from "react";

// Vosk small Russian model hosted on CDN (~50MB, cached after first load)
const MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-small-ru-0.22.zip";

type VoskStatus = "idle" | "loading" | "ready" | "listening" | "error";

export function useVosk(onResult: (text: string) => void) {
  const [status, setStatus] = useState<VoskStatus>("idle");
  const [loadProgress, setLoadProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const modelRef = useRef<unknown>(null);
  const recognizerRef = useRef<unknown>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const loadModel = useCallback(async () => {
    if (modelRef.current || status === "loading") return;
    setStatus("loading");
    setLoadProgress(0);
    setErrorMsg("");

    try {
      // Dynamic import to avoid SSR issues
      const { createModel } = await import("vosk-browser");

      // Fetch with progress tracking
      const response = await fetch(MODEL_URL);
      if (!response.ok) throw new Error("Не удалось загрузить модель");

      const contentLength = Number(response.headers.get("Content-Length") || 0);
      const reader = response.body!.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        if (contentLength > 0) {
          setLoadProgress(Math.round((received / contentLength) * 100));
        }
      }

      const blob = new Blob(chunks);
      const model = await createModel(URL.createObjectURL(blob));
      modelRef.current = model;
      setStatus("ready");
      setLoadProgress(100);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки";
      setErrorMsg(msg);
      setStatus("error");
    }
  }, [status]);

  const startListening = useCallback(async () => {
    if (!modelRef.current) { await loadModel(); return; }
    if (status === "listening") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const model = modelRef.current as any;
      const recognizer = new model.KaldiRecognizer(16000);
      recognizerRef.current = recognizer;

      recognizer.on("result", (msg: { result: { text: string } }) => {
        const text = msg.result?.text?.trim();
        if (text) onResult(text);
      });

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const int16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        recognizer.acceptWaveform(int16);
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      setStatus("listening");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Ошибка микрофона";
      setErrorMsg(msg);
      setStatus("error");
    }
  }, [status, loadModel, onResult]);

  const stopListening = useCallback(() => {
    processorRef.current?.disconnect();
    processorRef.current = null;
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    recognizerRef.current = null;
    setStatus(modelRef.current ? "ready" : "idle");
  }, []);

  const toggle = useCallback(() => {
    if (status === "listening") stopListening();
    else if (status === "idle") loadModel().then(() => startListening());
    else startListening();
  }, [status, loadModel, startListening, stopListening]);

  return { status, loadProgress, errorMsg, toggle, loadModel, startListening, stopListening };
}
