import type { Architecture } from "../model/types";

export const processorArchitecture: Architecture = {
  id: "processor-architecture", title: "Как процессор выполняет программу", shortTitle: "Архитектура процессора", category: "fundamentals", level: "computer", complexity: "Medium",
  description: "Упрощённая архитектурная карта цикла fetch–decode–execute: от команды в памяти через кэш и блок управления к регистрам и исполнительным устройствам.",
  keyIdea: "Процессор снова и снова получает следующую команду, декодирует её, читает операнды, выполняет операцию и сохраняет результат; кэш и регистры сокращают дорогие обращения к основной памяти.",
  suitableFor: ["Понимание выполнения программы", "Знакомство с memory hierarchy", "Связь машинных команд с работой CPU"],
  notIdealFor: ["Транзисторный уровень", "Точная микроархитектура конкретного CPU", "Разбор out-of-order execution и branch prediction"],
  stack: [{ name: "ISA", note: "Контракт команд: x86-64, ARM, RISC-V" }, { name: "Cache hierarchy" }, { name: "Registers" }, { name: "ALU / FPU" }],
  alternatives: [{ name: "RISC-V single-cycle datapath", note: "Учебная схема datapath на уровне сигналов" }, { name: "Pipeline", note: "Параллельное выполнение стадий разных команд" }],
  tradeoffs: { pros: ["Объясняет базовый цикл выполнения", "Показывает разницу памяти, регистров и вычислений", "Даёт основу для cache misses и производительности"], cons: ["Не показывает конвейер и параллелизм", "Объединяет сложные внутренние блоки", "Не отражает конкретную ISA и микроархитектуру"] },
  tags: ["cpu", "processor", "memory", "cache", "registers", "fetch-decode-execute"],
  nodes: [
    { id: "main-memory", kind: "memory", label: "Main Memory", subtitle: "RAM", position: { x: 20, y: 210 }, description: "Хранит машинные команды и данные запущенных программ за пределами процессорного кристалла.", reason: "Оперативная память вместительнее регистров и кэша, но доступ к ней значительно медленнее.", responsibilities: ["Хранение кода программы", "Хранение рабочих данных", "Обмен cache lines с CPU"], useCases: ["Инструкции", "Heap и stack", "Буферы"], avoidWhen: ["Операнд нужен на каждом такте"], stack: [{ name: "DRAM" }] },
    { id: "cache", kind: "memory", label: "CPU Cache", subtitle: "L1 / L2 / L3", position: { x: 280, y: 210 }, description: "Держит рядом с ядром копии недавно или часто используемых участков памяти.", reason: "Локальность программ позволяет скрыть большую часть задержки основной памяти.", responsibilities: ["Cache lines", "Hit / miss lookup", "Согласованность копий"], useCases: ["Инструкции цикла", "Горячие данные", "Prefetch"], avoidWhen: ["Единственное авторитетное хранилище"], tradeoffs: { pros: ["Низкая задержка при cache hit"], cons: ["Ограниченный размер и miss penalty"] } },
    { id: "fetch", kind: "compute", label: "Fetch Unit", subtitle: "Получение команды", position: { x: 540, y: 20 }, description: "Использует адрес следующей команды и получает её байты из instruction cache.", reason: "Перед выполнением процессор должен знать, какую машинную команду разбирать следующей.", responsibilities: ["Program counter", "Instruction fetch", "Выбор следующего адреса"], useCases: ["Последовательные команды", "Переходы", "Вызовы функций"] },
    { id: "decode-control", kind: "compute", label: "Decode + Control", subtitle: "Что нужно сделать", position: { x: 800, y: 20 }, description: "Распознаёт код операции и создаёт управляющие сигналы для чтения операндов и выполнения.", reason: "Биты инструкции нужно превратить в конкретные действия внутренних блоков CPU.", responsibilities: ["Декодирование opcode", "Выбор регистров", "Управляющие сигналы"], useCases: ["Арифметика", "Load / store", "Branch"] },
    { id: "registers", kind: "memory", label: "Registers", subtitle: "Самая быстрая память", position: { x: 800, y: 400 }, description: "Хранят непосредственно используемые операнды, адреса и промежуточные результаты.", reason: "Исполнительным блокам нужен доступ к значениям за минимальное число тактов.", responsibilities: ["Операнды", "Адреса", "Результаты операций"], useCases: ["General-purpose registers", "Program counter", "Flags"], avoidWhen: ["Большие массивы и долговременное хранение"] },
    { id: "execution", kind: "compute", label: "Execution Units", subtitle: "ALU / FPU / Load-Store", position: { x: 1060, y: 210 }, description: "Выполняют арифметику, логику, сравнения и операции загрузки или сохранения данных.", reason: "Разные типы инструкций требуют специализированных путей вычисления и доступа к памяти.", responsibilities: ["Целочисленные операции", "Floating point и vector operations", "Load / store"], useCases: ["Сложение", "Сравнение", "Чтение памяти"] },
    { id: "clock", kind: "infrastructure", label: "Clock", subtitle: "Общий ритм", position: { x: 540, y: 400 }, description: "Задаёт моменты, когда синхронные блоки фиксируют новое состояние.", reason: "Сложной схеме нужна общая временная опора для согласованного перехода между состояниями.", responsibilities: ["Тактовые импульсы", "Синхронизация стадий", "Timing budget"], useCases: ["Фиксация регистров", "Продвижение выполнения"], avoidWhen: ["Описание количества выполненных инструкций как равного числу тактов"] },
  ],
  edges: [
    { id: "memory-cache", source: "main-memory", target: "cache", label: "cache lines", type: "data", bidirectional: true },
    { id: "cache-fetch", source: "cache", target: "fetch", label: "instruction bytes", type: "data" },
    { id: "fetch-decode", source: "fetch", target: "decode-control", label: "instruction", type: "data" },
    { id: "decode-execution", source: "decode-control", target: "execution", label: "control signals", type: "control" },
    { id: "registers-execution", source: "registers", target: "execution", label: "operands / result", type: "data", bidirectional: true },
    { id: "execution-cache", source: "execution", target: "cache", label: "load / store", type: "data", bidirectional: true },
    { id: "clock-fetch", source: "clock", target: "fetch", label: "clock", type: "control" },
    { id: "clock-decode", source: "clock", target: "decode-control", label: "clock", type: "control" },
  ],
};
