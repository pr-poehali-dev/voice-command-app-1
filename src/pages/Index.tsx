import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

const COMMANDS = [
  {
    phrase: "открой гараж",
    label: "Открой гараж",
    description: "Открывает устройство Vorota в Google Home",
    icon: "DoorOpen",
    action: () => {
      window.location.href =
        "intent://home.google.com#Intent;scheme=https;package=com.google.android.apps.chromecast.app;end";
    },
  },
  {
    phrase: "запусти навигацию",
    label: "Запусти навигацию",
    description: "Открывает Яндекс Навигатор",
    icon: "Navigation",
    action: () => {
      window.location.href = "yandexnavi://";
    },
  },
  {
    phrase: "включи радио",
    label: "Включи радио онлайн",
    description: "Открывает приложение FMPlay",
    icon: "Radio",
    action: () => {
      window.location.href = "fmplay://";
    },
  },
];

type HistoryItem = {
  id: number;
  phrase: string;
  result: string;
  time: string;
  status: "success" | "error";
};

const formatTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
};

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

type Tab = "commands" | "history";

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("commands");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastMatchedId, setLastMatchedId] = useState<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const idRef = useRef(1);

  const addHistory = (phrase: string, result: string, status: "success" | "error") => {
    const item: HistoryItem = { id: idRef.current++, phrase, result, time: formatTime(), status };
    setHistory((prev) => [item, ...prev]);
    if (status === "success") setLastMatchedId(item.id);
    return item.id;
  };

  const handleTranscript = (text: string) => {
    const lower = text.toLowerCase().trim();
    setTranscript(lower);
    const matched = COMMANDS.find((cmd) => lower.includes(cmd.phrase));
    if (matched) {
      addHistory(matched.label, `Выполняется: ${matched.description}`, "success");
      setTimeout(() => matched.action(), 600);
    } else {
      addHistory(text, "Команда не распознана", "error");
    }
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addHistory("—", "Браузер не поддерживает распознавание голоса", "error");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      handleTranscript(text);
    };
    recognition.onerror = (event) => {
      addHistory("—", `Ошибка микрофона: ${event.error}`, "error");
      setListening(false);
    };
    recognition.onend = () => {
      setListening(false);
      setTranscript("");
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTranscript("");
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
    setTranscript("");
  };

  const handleMicClick = () => {
    if (listening) stopListening();
    else startListening();
  };

  const runCommand = (cmd: typeof COMMANDS[0]) => {
    addHistory(cmd.label, `Выполняется: ${cmd.description}`, "success");
    setTimeout(() => cmd.action(), 400);
  };

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  useEffect(() => {
    if (lastMatchedId !== null) {
      const t = setTimeout(() => setLastMatchedId(null), 2000);
      return () => clearTimeout(t);
    }
  }, [lastMatchedId]);

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#1A1A1A] font-['Golos_Text',sans-serif]">
      {/* Header */}
      <header className="border-b border-[#E8E8E4] px-6 py-5 flex items-center justify-between max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#4F46E5] flex items-center justify-center">
            <Icon name="Mic" size={14} className="text-white" />
          </div>
          <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#8C8C88]">
            Голосовой помощник
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${listening ? "bg-[#4F46E5] animate-pulse" : "bg-[#C8C8C4]"}`} />
          <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#8C8C88]">
            {listening ? "Слушаю..." : "Ожидание"}
          </span>
        </div>
      </header>

      {/* Mic Section */}
      <div className="flex flex-col items-center pt-12 pb-10 gap-4">
        <button
          onClick={handleMicClick}
          className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-300 group cursor-pointer
            ${listening
              ? "border-[#4F46E5] bg-[#4F46E5] shadow-[0_0_48px_rgba(79,70,229,0.35)]"
              : "border-[#E8E8E4] bg-white hover:border-[#4F46E5] hover:shadow-[0_0_24px_rgba(79,70,229,0.12)]"
            }`}
        >
          {listening && (
            <>
              <span className="absolute inset-0 rounded-full border border-[#4F46E5] animate-ping opacity-25" />
              <span className="absolute -inset-3 rounded-full border border-[#4F46E5] animate-ping opacity-10" style={{ animationDelay: "0.3s" }} />
            </>
          )}
          <Icon
            name={listening ? "MicOff" : "Mic"}
            size={26}
            className={`transition-colors duration-300 ${listening ? "text-white" : "text-[#1A1A1A] group-hover:text-[#4F46E5]"}`}
          />
        </button>
        <p className="text-xs font-['IBM_Plex_Mono',monospace] text-[#8C8C88] tracking-wider h-4 text-center">
          {listening
            ? transcript ? `"${transcript}"` : "Говорите команду..."
            : "Нажмите для активации"}
        </p>
      </div>

      {/* Tabs + Content */}
      <div className="px-6 max-w-2xl mx-auto">
        <div className="flex border-b border-[#E8E8E4] mb-6">
          {(["commands", "history"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium border-b-2 -mb-px transition-all duration-200 cursor-pointer
                ${activeTab === tab
                  ? "border-[#4F46E5] text-[#4F46E5]"
                  : "border-transparent text-[#8C8C88] hover:text-[#1A1A1A]"
                }`}
            >
              {tab === "commands" ? "Команды" : (
                <span className="flex items-center gap-2">
                  История
                  {history.length > 0 && (
                    <span className="text-[10px] bg-[#4F46E5] text-white rounded-full w-4 h-4 flex items-center justify-center font-['IBM_Plex_Mono',monospace]">
                      {history.length > 9 ? "9+" : history.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Commands */}
        {activeTab === "commands" && (
          <div className="space-y-3 pb-12">
            {COMMANDS.map((cmd) => (
              <button
                key={cmd.phrase}
                onClick={() => runCommand(cmd)}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl border border-[#E8E8E4] bg-white hover:border-[#4F46E5] hover:shadow-[0_0_16px_rgba(79,70,229,0.08)] transition-all duration-200 cursor-pointer group text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-[#EEEDFB] flex items-center justify-center flex-shrink-0 group-hover:bg-[#4F46E5] transition-colors duration-200">
                  <Icon name={cmd.icon} size={18} className="text-[#4F46E5] group-hover:text-white transition-colors duration-200" fallback="Zap" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A1A1A]">{cmd.label}</p>
                  <p className="text-xs text-[#8C8C88] mt-0.5 font-['IBM_Plex_Mono',monospace]">«{cmd.phrase}»</p>
                </div>
                <Icon name="ArrowRight" size={15} className="text-[#C8C8C4] group-hover:text-[#4F46E5] transition-colors duration-200 flex-shrink-0" />
              </button>
            ))}
            <p className="text-xs text-[#C8C8C4] text-center pt-2 font-['IBM_Plex_Mono',monospace]">
              Нажмите на карточку или скажите команду голосом
            </p>
          </div>
        )}

        {/* History */}
        {activeTab === "history" && (
          <div className="pb-12">
            {history.length === 0 ? (
              <div className="flex flex-col items-center py-20 gap-3 text-[#C8C8C4]">
                <Icon name="Clock" size={32} />
                <p className="text-sm font-['IBM_Plex_Mono',monospace]">История пуста</p>
                <p className="text-xs text-center">Скажите команду или нажмите на карточку</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-4 px-5 py-4 rounded-xl border transition-all duration-500 ${
                      lastMatchedId === item.id
                        ? "border-[#4F46E5] bg-[#EEEDFB]"
                        : "border-[#E8E8E4] bg-white"
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.status === "success" ? "bg-[#ECFDF5]" : "bg-[#FEF2F2]"
                    }`}>
                      <Icon
                        name={item.status === "success" ? "Check" : "X"}
                        size={11}
                        className={item.status === "success" ? "text-[#10B981]" : "text-[#EF4444]"}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A1A]">{item.phrase}</p>
                      <p className="text-xs text-[#8C8C88] mt-1">{item.result}</p>
                    </div>
                    <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#C8C8C4] flex-shrink-0 mt-0.5">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
