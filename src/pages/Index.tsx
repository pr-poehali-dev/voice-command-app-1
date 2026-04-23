import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

type Command = {
  phrase: string;
  label: string;
  description: string;
  icon: string;
  url: string;
};

const DEFAULT_COMMANDS: Command[] = [
  {
    phrase: "открой гараж",
    label: "Открой гараж",
    description: "Открывает устройство Vorota в Google Home",
    icon: "DoorOpen",
    url: "intent://home.google.com#Intent;scheme=https;package=com.google.android.apps.chromecast.app;end",
  },
  {
    phrase: "запусти навигацию",
    label: "Запусти навигацию",
    description: "Открывает Яндекс Навигатор",
    icon: "Navigation",
    url: "yandexnavi://",
  },
  {
    phrase: "включи радио",
    label: "Включи радио онлайн",
    description: "Открывает приложение FMPlay",
    icon: "Radio",
    url: "fmplay://",
  },
];

const ICON_OPTIONS = [
  "Zap", "Star", "Heart", "Home", "Phone", "Music", "Camera", "Map",
  "Mail", "Bell", "Car", "Lightbulb", "Tv", "Wifi", "Lock", "Settings",
  "Navigation", "Radio", "DoorOpen", "Mic", "Volume2", "ShoppingCart",
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

const STORAGE_KEY = "voice_commands";

const loadCommands = (): Command[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_COMMANDS;
  } catch {
    return DEFAULT_COMMANDS;
  }
};

const saveCommands = (cmds: Command[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cmds));
};

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

type Tab = "commands" | "history";

const EMPTY_FORM = { label: "", phrase: "", description: "", icon: "Zap", url: "" };

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("commands");
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [lastMatchedId, setLastMatchedId] = useState<number | null>(null);
  const [commands, setCommands] = useState<Command[]>(loadCommands);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const idRef = useRef(1);

  const addHistory = (phrase: string, result: string, status: "success" | "error") => {
    const item: HistoryItem = { id: idRef.current++, phrase, result, time: formatTime(), status };
    setHistory((prev) => [item, ...prev]);
    if (status === "success") setLastMatchedId(item.id);
  };

  const handleTranscript = (text: string) => {
    const lower = text.toLowerCase().trim();
    setTranscript(lower);
    const matched = commands.find((cmd) => lower.includes(cmd.phrase));
    if (matched) {
      addHistory(matched.label, `Выполняется: ${matched.description}`, "success");
      setTimeout(() => { window.location.href = matched.url; }, 600);
    } else {
      addHistory(text, "Команда не распознана", "error");
    }
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { addHistory("—", "Браузер не поддерживает распознавание голоса", "error"); return; }
    const recognition = new SR();
    recognition.lang = "ru-RU";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e) => handleTranscript(e.results[0][0].transcript);
    recognition.onerror = (e) => { addHistory("—", `Ошибка: ${e.error}`, "error"); setListening(false); };
    recognition.onend = () => { setListening(false); setTranscript(""); };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setTranscript("");
  };

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); setTranscript(""); };
  const handleMicClick = () => listening ? stopListening() : startListening();

  const runCommand = (cmd: Command) => {
    addHistory(cmd.label, `Выполняется: ${cmd.description}`, "success");
    setTimeout(() => { window.location.href = cmd.url; }, 400);
  };

  const openAddForm = () => {
    setForm(EMPTY_FORM);
    setEditIndex(null);
    setShowForm(true);
  };

  const openEditForm = (idx: number) => {
    const cmd = commands[idx];
    setForm({ label: cmd.label, phrase: cmd.phrase, description: cmd.description, icon: cmd.icon, url: cmd.url });
    setEditIndex(idx);
    setShowForm(true);
  };

  const saveForm = () => {
    if (!form.label.trim() || !form.phrase.trim() || !form.url.trim()) return;
    const newCmd: Command = {
      label: form.label.trim(),
      phrase: form.phrase.trim().toLowerCase(),
      description: form.description.trim() || form.label.trim(),
      icon: form.icon,
      url: form.url.trim(),
    };
    let updated: Command[];
    if (editIndex !== null) {
      updated = commands.map((c, i) => (i === editIndex ? newCmd : c));
    } else {
      updated = [...commands, newCmd];
    }
    setCommands(updated);
    saveCommands(updated);
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditIndex(null);
  };

  const deleteCommand = (idx: number) => {
    const updated = commands.filter((_, i) => i !== idx);
    setCommands(updated);
    saveCommands(updated);
    setDeleteConfirm(null);
  };

  useEffect(() => { return () => recognitionRef.current?.stop(); }, []);

  useEffect(() => {
    if (lastMatchedId !== null) {
      const t = setTimeout(() => setLastMatchedId(null), 2000);
      return () => clearTimeout(t);
    }
  }, [lastMatchedId]);

  const isFormValid = form.label.trim() && form.phrase.trim() && form.url.trim();

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#1A1A1A] font-['Golos_Text',sans-serif]">

      {/* Modal: Add / Edit */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl border border-[#E8E8E4] p-6 z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-[#1A1A1A]">
                {editIndex !== null ? "Редактировать команду" : "Новая команда"}
              </h2>
              <button onClick={() => setShowForm(false)} className="w-7 h-7 rounded-full bg-[#F7F7F5] flex items-center justify-center hover:bg-[#E8E8E4] transition-colors cursor-pointer">
                <Icon name="X" size={13} className="text-[#8C8C88]" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Label */}
              <div>
                <label className="text-xs font-medium text-[#8C8C88] uppercase tracking-wider mb-1.5 block">Название</label>
                <input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Например: Открой гараж"
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E8E4] bg-[#F7F7F5] text-sm text-[#1A1A1A] placeholder:text-[#C8C8C4] focus:outline-none focus:border-[#4F46E5] transition-colors"
                />
              </div>

              {/* Phrase */}
              <div>
                <label className="text-xs font-medium text-[#8C8C88] uppercase tracking-wider mb-1.5 block">Голосовая фраза</label>
                <input
                  value={form.phrase}
                  onChange={(e) => setForm((f) => ({ ...f, phrase: e.target.value }))}
                  placeholder="Например: открой гараж"
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E8E4] bg-[#F7F7F5] text-sm font-['IBM_Plex_Mono',monospace] text-[#1A1A1A] placeholder:text-[#C8C8C4] focus:outline-none focus:border-[#4F46E5] transition-colors"
                />
                <p className="text-xs text-[#C8C8C4] mt-1.5">Произносите эту фразу для активации</p>
              </div>

              {/* URL */}
              <div>
                <label className="text-xs font-medium text-[#8C8C88] uppercase tracking-wider mb-1.5 block">Ссылка или deep link</label>
                <input
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://... или приложение://"
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E8E4] bg-[#F7F7F5] text-sm font-['IBM_Plex_Mono',monospace] text-[#1A1A1A] placeholder:text-[#C8C8C4] focus:outline-none focus:border-[#4F46E5] transition-colors"
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-medium text-[#8C8C88] uppercase tracking-wider mb-1.5 block">Описание (необязательно)</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Что делает команда"
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E8E4] bg-[#F7F7F5] text-sm text-[#1A1A1A] placeholder:text-[#C8C8C4] focus:outline-none focus:border-[#4F46E5] transition-colors"
                />
              </div>

              {/* Icon picker */}
              <div>
                <label className="text-xs font-medium text-[#8C8C88] uppercase tracking-wider mb-2 block">Иконка</label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, icon: name }))}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                        form.icon === name
                          ? "bg-[#4F46E5] border-[#4F46E5]"
                          : "bg-[#F7F7F5] border-[#E8E8E4] hover:border-[#4F46E5]"
                      }`}
                    >
                      <Icon name={name} size={16} className={form.icon === name ? "text-white" : "text-[#8C8C88]"} fallback="Zap" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-3 rounded-xl border border-[#E8E8E4] text-sm font-medium text-[#8C8C88] hover:bg-[#F7F7F5] transition-colors cursor-pointer"
              >
                Отмена
              </button>
              <button
                onClick={saveForm}
                disabled={!isFormValid}
                className="flex-1 py-3 rounded-xl bg-[#4F46E5] text-sm font-medium text-white hover:bg-[#4338CA] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {editIndex !== null ? "Сохранить" : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      )}

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
          {listening ? (transcript ? `"${transcript}"` : "Говорите команду...") : "Нажмите для активации"}
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
                ${activeTab === tab ? "border-[#4F46E5] text-[#4F46E5]" : "border-transparent text-[#8C8C88] hover:text-[#1A1A1A]"}`}
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

        {/* Commands Tab */}
        {activeTab === "commands" && (
          <div className="space-y-3 pb-12">
            {commands.map((cmd, idx) => (
              <div key={idx} className="relative group/card">
                {/* Delete confirm overlay */}
                {deleteConfirm === idx && (
                  <div className="absolute inset-0 z-10 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-between px-5">
                    <p className="text-sm text-[#EF4444] font-medium">Удалить команду?</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-xs rounded-lg border border-[#E8E8E4] bg-white text-[#8C8C88] hover:bg-[#F7F7F5] cursor-pointer transition-colors">Отмена</button>
                      <button onClick={() => deleteCommand(idx)} className="px-3 py-1.5 text-xs rounded-lg bg-[#EF4444] text-white hover:bg-[#DC2626] cursor-pointer transition-colors">Удалить</button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runCommand(cmd)}
                    className="flex-1 flex items-center gap-4 px-5 py-4 rounded-xl border border-[#E8E8E4] bg-white hover:border-[#4F46E5] hover:shadow-[0_0_16px_rgba(79,70,229,0.08)] transition-all duration-200 cursor-pointer group text-left"
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

                  {/* Edit / Delete */}
                  <div className="flex flex-col gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity duration-150">
                    <button
                      onClick={() => openEditForm(idx)}
                      className="w-8 h-8 rounded-lg border border-[#E8E8E4] bg-white flex items-center justify-center hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors cursor-pointer"
                    >
                      <Icon name="Pencil" size={13} className="text-[#8C8C88]" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(idx)}
                      className="w-8 h-8 rounded-lg border border-[#E8E8E4] bg-white flex items-center justify-center hover:border-[#EF4444] hover:text-[#EF4444] transition-colors cursor-pointer"
                    >
                      <Icon name="Trash2" size={13} className="text-[#8C8C88]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add button */}
            <button
              onClick={openAddForm}
              className="w-full flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-dashed border-[#C8C8C4] bg-transparent hover:border-[#4F46E5] hover:bg-[#EEEDFB] transition-all duration-200 cursor-pointer group"
            >
              <Icon name="Plus" size={16} className="text-[#8C8C88] group-hover:text-[#4F46E5] transition-colors" />
              <span className="text-sm text-[#8C8C88] group-hover:text-[#4F46E5] transition-colors font-medium">Добавить команду</span>
            </button>

            <p className="text-xs text-[#C8C8C4] text-center pt-1 font-['IBM_Plex_Mono',monospace]">
              Нажмите на карточку или скажите команду голосом
            </p>
          </div>
        )}

        {/* History Tab */}
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
                      lastMatchedId === item.id ? "border-[#4F46E5] bg-[#EEEDFB]" : "border-[#E8E8E4] bg-white"
                    }`}
                  >
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${item.status === "success" ? "bg-[#ECFDF5]" : "bg-[#FEF2F2]"}`}>
                      <Icon name={item.status === "success" ? "Check" : "X"} size={11} className={item.status === "success" ? "text-[#10B981]" : "text-[#EF4444]"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A1A1A]">{item.phrase}</p>
                      <p className="text-xs text-[#8C8C88] mt-1">{item.result}</p>
                    </div>
                    <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#C8C8C4] flex-shrink-0 mt-0.5">{item.time}</span>
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
