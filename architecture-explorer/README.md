# ArchLens

Интерактивный просмотрщик системных архитектур. ArchLens объясняет не структуру каталогов, а ответственность runtime-компонентов, trust boundaries, состояние и потоки данных.

## Запуск

```bash
npm install
npm run dev
```

Проверка production-сборки:

```bash
npm run typecheck
npm run build
```

## Архитектура проекта

```text
src/
  app/                       # тонкий App Router entry point
  features/
    architecture/
      data/                  # независимые architecture definitions
      model/                 # доменные types
      ui/                    # workspace и explorer
    graph/ui/                # адаптер React Flow и custom node
    inspector/ui/            # overview и node inspector
```

Доменная модель не зависит от React Flow. `ArchitectureGraph` преобразует `ArchitectureNode` и `ArchitectureEdge` в визуальное представление только на границе UI.

## Как добавить архитектуру

1. Создать файл в `src/features/architecture/data/`.
2. Экспортировать объект, удовлетворяющий интерфейсу `Architecture`.
3. Добавить definition в массив `architectures` в `data/index.ts`.

Новый UI-компонент не требуется: explorer, graph и inspector строятся из данных.

Definition описывает system/runtime architecture или базовую computer architecture. Framework указывается в `stack` или `alternatives`, но не становится типом архитектуры. Каждый граф должен объяснять одну идею и обычно содержать 4–9 узлов (максимум 12).

Типы связей:

- `request` — синхронный вызов;
- `data` — чтение или запись состояния;
- `event` — domain event;
- `async` — очередь или фоновая задача;
- `realtime` — постоянный двусторонний канал.
- `control` — управляющий сигнал внутри вычислительной архитектуры.

Публичные примеры разрешены только с конкретным техническим `sourceUrl`. Если надёжного источника нет, поле `examples` нужно оставить пустым.

## Library Iteration 1

- 32 готовые архитектуры первой полной библиотеки;
- сворачиваемые категории и поиск по названию, категории и тегам;
- pan, zoom и fit view;
- выбор узла и подробный inspector;
- architecture overview со стеком и trade-offs;
- локальные TypeScript definitions без backend и persistence.

Evolution и визуальный builder намеренно не входят в эту итерацию. Текущие стабильные `node.id`, `kind`, позиции и типизированные edges позволяют позже добавить шаги эволюции, drag-and-drop и validation rules без замены доменной модели.
