import { useState } from "react";
import Icon from "@/components/ui/icon";

const COMMANDS = [
  {
    category: "Навигация",
    items: [
      { phrase: "Открой настройки", description: "Переходит в раздел настроек приложения" },
      { phrase: "Вернись назад", description: "Возвращает на предыдущий экран" },
      { phrase: "На главную", description: "Переходит на главную страницу" },
      { phrase: "Закрой приложение", description: "Завершает работу приложения" },
    ],
  },
  {
    category: "Управление",
    items: [
      { phrase: "Включи музыку", description: "Запускает воспроизведение последнего плейлиста" },
      { phrase: "Выключи звук", description: "Отключает системный звук" },
      { phrase: "Увеличь яркость", description: "Повышает яркость экрана на 20%" },
      { phrase: "Режим не беспокоить", description: "Включает режим тишины на устройстве" },
    ],
  },
  {
    category: "Информация",
    items: [
      { phrase: "Который час", description: "Озвучивает текущее время" },
      { phrase: "Какая погода", description: "Сообщает прогноз погоды на сегодня" },
      { phrase: "Напомни через час", description: "Устанавливает напоминание через 60 минут" },
      { phrase: "Что в календаре", description: "Читает события на сегодня" },
    ],
  },
  {
    category: "Умный дом",
    items: [
      { phrase: "Включи свет", description: "Включает освещение в текущей комнате" },
      { phrase: "Закрой шторы", description: "Управляет электроприводом штор" },
      { phrase: "Установи 22 градуса", description: "Задаёт температуру на термостате" },
      { phrase: "Включи кофемашину", description: "Запускает приготовление кофе" },
    ],
  },
];

const HISTORY_INITIAL = [
  { id: 1, phrase: "Который час", result: "Сейчас 14:32", time: "14:32", status: "success" as const },
  { id: 2, phrase: "Включи музыку", result: "Запускаю последний плейлист", time: "14:28", status: "success" as const },
  { id: 3, phrase: "Открой настройки", result: "Команда не распознана", time: "14:15", status: "error" as const },
  { id: 4, phrase: "Какая погода", result: "Сегодня +18°C, облачно", time: "13:50", status: "success" as const },
  { id: 5, phrase: "Напомни через час", result: "Напоминание установлено на 14:50", time: "13:49", status: "success" as const },
  { id: 6, phrase: "Включи свет", result: "Свет в комнате включён", time: "12:10", status: "success" as const },
];

type Tab = "commands" | "history";

export default function Index() {
  const [activeTab, setActiveTab] = useState<Tab>("commands");
  const [listening, setListening] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Навигация");
  const [history] = useState(HISTORY_INITIAL);

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
          onClick={() => setListening((v) => !v)}
          className={`relative w-20 h-20 rounded-full border-2 flex items-center justify-center transition-all duration-400 group cursor-pointer
            ${listening
              ? "border-[#4F46E5] bg-[#4F46E5] shadow-[0_0_48px_rgba(79,70,229,0.3)]"
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
            name="Mic"
            size={26}
            className={`transition-colors duration-300 ${listening ? "text-white" : "text-[#1A1A1A] group-hover:text-[#4F46E5]"}`}
          />
        </button>
        <p className="text-xs font-['IBM_Plex_Mono',monospace] text-[#8C8C88] tracking-widest">
          {listening ? "Говорите команду" : "Нажмите для активации"}
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
              {tab === "commands" ? "Команды" : "История"}
            </button>
          ))}
        </div>

        {/* Commands */}
        {activeTab === "commands" && (
          <div className="space-y-2 pb-12">
            {COMMANDS.map((group) => (
              <div key={group.category} className="border border-[#E8E8E4] rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setExpandedCategory(expandedCategory === group.category ? null : group.category)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F7F7F5] transition-colors cursor-pointer"
                >
                  <span className="text-sm font-semibold text-[#1A1A1A]">{group.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-['IBM_Plex_Mono',monospace] text-[#8C8C88] bg-[#F7F7F5] px-2 py-0.5 rounded-full">
                      {group.items.length}
                    </span>
                    <Icon
                      name="ChevronDown"
                      size={15}
                      className={`text-[#8C8C88] transition-transform duration-200 ${expandedCategory === group.category ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>

                {expandedCategory === group.category && (
                  <div className="divide-y divide-[#F0F0EC]">
                    {group.items.map((cmd, i) => (
                      <div key={i} className="flex items-start gap-4 px-5 py-4 hover:bg-[#FAFAF8] transition-colors">
                        <div className="mt-0.5 w-5 h-5 rounded-md bg-[#EEEDFB] flex items-center justify-center flex-shrink-0">
                          <Icon name="Quote" size={10} className="text-[#4F46E5]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-['IBM_Plex_Mono',monospace] font-medium text-[#1A1A1A]">
                            «{cmd.phrase}»
                          </p>
                          <p className="text-xs text-[#8C8C88] mt-1 leading-relaxed">
                            {cmd.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* History */}
        {activeTab === "history" && (
          <div className="space-y-2 pb-12">
            {history.map((item, idx) => (
              <div
                key={item.id}
                className="flex items-start gap-4 px-5 py-4 rounded-xl border border-[#E8E8E4] bg-white hover:bg-[#FAFAF8] transition-colors"
                style={{ animationDelay: `${idx * 40}ms` }}
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
                  <p className="text-sm font-['IBM_Plex_Mono',monospace] font-medium text-[#1A1A1A]">
                    «{item.phrase}»
                  </p>
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
    </div>
  );
}
