/* global window, document, localStorage */
(() => {
  const LS_VOTES = "gog2026_interest_v1";

  /** @typedef {{ id: string, day: 1 | 2, venue: 'main' | 'small' | 'kubsu', start: string, end?: string|null, format?: string, title: string, speaker?: string, block?: boolean, tbd?: boolean, noVote?: boolean, progress?: boolean, tags?: string[], hidden?: boolean }} Slot */

  /** @type {Slot[]} */
  const SLOTS = [];

  /** @typedef {{ key: string, name: string, role: string, topic: string, slotIds: string[], times: string }} Speaker */

  /** @type {Speaker[]} */
  const SPEAKERS = [
    { key: "dontsov", name: "Донцов Егор", role: "Директор сектора ОКН ГК Спектрум", topic: "О проблемах, практических кейсах, туризме, реновации советского наследия, управлении инвестициями", slotIds: ["d1-main-1030", "d1-main-1135"], times: "День 1, 10:30 / модератор дискуссии — 11:35" },
    { key: "dyaykin", name: "Дяйкин Сергей", role: 'Исполнительный директор ООО «Аэропорт Геленджик»', topic: "Инфраструктурный баланс, инвестиции и ГЧП", slotIds: ["d1-main-1045", "d1-main-1135"], times: "День 1, 10:45 / 11:35" },
    { key: "geresh", name: "Гереш Елена", role: "Директор по развитию Шато де Талю, Мантера Групп", topic: "«Море здесь у всех. Такое — только у нас. Шато де Талю и новый образ Геленджика»; также: «НЕЛЬЗЯ, НО ЕСЛИ ОЧЕНЬ ХОЧЕТСЯ, ТО МОЖНО…» + пленарные и интервью", slotIds: ["d1-main-1100", "d1-main-1615", "d1-main-1135", "d1-main-1645", "d2-main-1200-int"], times: "День 1, 11:00 / 11:35 / 16:15 / 16:45; День 2, 12:00" },
    { key: "kangin", name: "Кангин Алексей", role: 'Зам. исп. директора, АНО «Корпорация развития «Геленджик-2035»»', topic: "Новая философия экономического роста; «Туризм в эпоху постмодерна»", slotIds: ["d1-main-1115", "d1-main-1630", "d1-main-1135", "d1-main-1645"], times: "День 1, 11:15 / 16:30 / 11:35 / 16:45" },
    { key: "voronkov", name: "Воронков Михаил", role: "Начальник управления архитектуры и градостроительства, главный архитектор Туапсинского МО", topic: "—", slotIds: ["d1-main-1130", "d1-main-1135"], times: "День 1, 11:30 / 11:35" },
    { key: "pyankova", name: "Пьянкова Анна Александровна", role: 'Директор центра поддержки и развития современного искусства «ЗА АРТ»', topic: "«От газировки к наукограду: опыт ребрендинга и социокультурного перепрограммирования Черноголовки»", slotIds: ["d1-main-1330", "d1-small-1630", "d1-small-after"], times: "День 1, 13:30 · Малый зал — кинопоказ и мастерская" },
    { key: "bitarova", name: "Битарова Мария Анатольевна", role: 'Заместитель директора ГКУ КК «Центр регионального развития»', topic: "«Роль креативных кластеров в экономическом развитии территорий: от идеи к реализации»", slotIds: ["d1-main-1345", "d1-main-1645"], times: "День 1, 13:45 / 16:45" },
    { key: "petruk", name: "Петрук Иван Владимирович", role: 'Основатель и руководитель Арт-парка «Острова Ершовы»', topic: "«Развитие арт-парка с помощью событий на стыке образования и творчества»", slotIds: ["d1-main-1400"], times: "День 1, 14:00" },
    { key: "tyutin", name: "Тютин Владимир", role: 'Технический директор ООО «Аэропорт Геленджик»', topic: "«Архитектура, созвучная природе»", slotIds: ["d1-main-1415"], times: "День 1, 14:15" },
    { key: "astakhov", name: "Астахов Сергей", role: 'Доктор геолого-минералогических наук, архитектор и руководитель проекта Южность', topic: "«Культурно-спортивный центр в тренде деурбанизации. Архитектура и экономические драйверы»", slotIds: ["d1-main-1430", "d1-main-1645"], times: "День 1, 14:30 / 16:45" },
    { key: "morozova", name: "Морозова Марина Александровна", role: 'Генеральный директор АНО «Центр компетенций в сфере туризма и гостеприимства»', topic: "«Креативная экосистема туристского центра на примере Санкт-Петербурга» (онлайн)", slotIds: ["d1-main-1445"], times: "День 1, 14:45" },
    { key: "khalimova", name: "Халимова Аниса", role: "Руководитель отдела развития туризма г. Иннополис", topic: "«Город, одинаково удобный и для местных, и для туристов»", slotIds: ["d1-main-1500"], times: "День 1, 15:00" },
    { key: "malikova", name: "Маликова Дарья", role: 'Руководитель школы медиации «Индустриальный эксперимент»', topic: "«Потенциал индустриального наследия в развитии территорий»", slotIds: ["d1-main-1545", "d1-small-1630", "d1-small-after", "d2-main-1100-pl"], times: "День 1, 15:45 · Малый зал; День 2, модерация пленарной" },
    { key: "kim", name: "Ким Белов", role: "Сценарист, директор по коммуникациям", topic: "«Модное или вечное? Как и зачем формировать вкус вашей аудитории»", slotIds: ["d1-main-1600", "d1-main-1645"], times: "День 1, 16:00 / модератор пленарной — 16:45" },
    { key: "andreev", name: "Андреев Илья", role: 'Основатель центра современной культуры «Рельсы», Тверь / МЫ ТУТ', topic: '«Финансовая устойчивость культурных пространств. Продюсирование локального. Опыт КЦ «Рельсы» и сообщества МЫ ТУТ»', slotIds: ["d2-main-1000", "d2-main-1100-pl"], times: "День 2, 10:00 / 11:00" },
    { key: "avrutskaya", name: "Авруцкая Ирина Гарриевна", role: "Член национального экспертного совета по развитию кадрового потенциала в сфере туризма и гостеприимства (Минэкономразвития РФ). Пушкинские Горы", topic: "«Социокультурное и социоэкономическое развитие малого поселения на примере Пушкинских Гор. Гастрономический туризм как драйвер развития экономики территории»", slotIds: ["d2-main-1015", "d2-main-1100-pl"], times: "День 2, 10:15 / 11:00" },
    { key: "martyshenko", name: "Мартышенко Дмитрий Юрьевич", role: 'Директор консалтингово-аналитической группы «Интеграция», консультант по управлению и организационному развитию', topic: "«Герои не умирают: первая национальная GIS/VR экосистема сохранения исторической памяти на основе ИИ»", slotIds: ["d2-main-1030"], times: "День 2, 10:30" },
    { key: "popelyuk", name: "Попельнюк Кирилл", role: "Co-founder & Креативный директор, ИИнтеграция", topic: "«Радар клиентов: как AI-система находит сигналы спроса раньше, чем их видят конкуренты»", slotIds: ["d2-main-1045"], times: "День 2, 10:45" },
    { key: "nagdev", name: "Vishal Nagdev", role: "Сооснователь Pow Wow Marketing и EVENTFAQS Media (онлайн)", topic: "«Как события превращают локацию в дестинацию» — интервью", slotIds: ["d2-main-1200-int"], times: "День 2, 12:00" },
    { key: "shtanko", name: "Штанько Татьяна Викторовна", role: 'Руководитель отдела городских проектов АНО «Фонд развития города Иннополис»', topic: "«Терапевтический ландшафт: социальное садоводство и природные маршруты в системе благополучия жителей»", slotIds: ["d2-main-1400"], times: "День 2, 14:00" },
    { key: "komkova", name: "Комкова Елена Валерьевна", role: "Основатель студии LËNKA", topic: "«Локальная идентичность как инструмент устойчивого роста»", slotIds: ["d2-main-1420"], times: "День 2, 14:20" },
    { key: "chernets", name: "Чернец Елена", role: "Эксперт по социокультурным исследованиям территорий", topic: "«Как проводить исследования для туристических стратегий и проектов»", slotIds: ["d2-main-1440"], times: "День 2, 14:40" },
    { key: "kozyritskaya", name: "Козырицкая Анастасия", role: "Помощник Главы Альметьевска по развитию городской среды", topic: "«Дизайн для людей: как Альметьевск создаёт комфортную среду через осознанную урбанистику»", slotIds: ["d2-main-1500"], times: "День 2, 15:00" },
    { key: "khabibullin", name: "Хабибуллин Айрат Рашатович", role: 'Директор АНО «Фонд развития города Иннополис», советник мэра г. Иннополис', topic: "«Цифровые сервисы в управлении городом — кейс Иннополиса»", slotIds: ["d2-main-1550"], times: "День 2, 15:50" },
    { key: "komkov", name: "Комков Михаил", role: "Технический директор", topic: "«Анализ восприятия интернет-ресурсов по привлечению туристического потока в малые города»", slotIds: ["d2-main-1610"], times: "День 2, 16:10" },
    { key: "starkov", name: "Старков Александр", role: 'Партнёр агентства «Городские герои», руководитель экспертной группы по развитию креативных индустрий в Башкортостане', topic: "«Креативные индустрии как инструмент развития малых городов: кейс Бирска и перспективы для регионов»", slotIds: ["d2-main-1630"], times: "День 2, 16:30" },
  ];

  function slotRow(
    id,
    day,
    venue,
    start,
    end,
    opts
  ) {
    SLOTS.push({
      id,
      day,
      venue,
      start,
      end,
      format: opts.format,
      title: opts.title,
      speaker: opts.speaker,
      block: opts.block,
      tbd: opts.tbd,
      noVote: opts.noVote,
      progress: opts.progress,
      tags: opts.tags,
      hidden: opts.hidden,
    });
  }

  slotRow("d1-main-0800", 1, "main", "08:00", "10:00", {
    format: "Регистрация (Фойе)",
    title: "Регистрация участников. Приветственный кофе. Нетворкинг",
    speaker: "Волонтёры, организаторы",
    noVote: true,
    progress: false,
  });
  slotRow("d1-main-1000", 1, "main", "10:00", "10:15", {
    format: "Торжественное открытие",
    title: 'Открытие форума «Горы и Город – 2026»',
    speaker: "Организаторы форума. Представители администрации Геленджика. Почётные гости",
    progress: false,
  });
  slotRow("d1-main-bl-p1", 1, "main", "10:15", null, {
    block: true,
    format: "",
    title: 'ПЛЕНАРНАЯ СЕССИЯ №1 · «Горы и Город: Геленджик сегодня и завтра — проекты, которые меняют города»',
    noVote: true,
    progress: false,
  });
  slotRow("d1-main-1015", 1, "main", "10:15", "10:30", {
    format: "Пленарная сессия (с модератором)",
    title: "Приветствие и приглашение спикеров",
    speaker: "—",
    progress: true,
  });
  slotRow("d1-main-1030", 1, "main", "10:30", "10:45", {
    format: "Пленарная сессия (с модератором)",
    title: "О проблемах, практических кейсах, туризме, реновации советского наследия, управлении инвестициями",
    speaker: "**Донцов Егор** — Директор сектора ОКН ГК Спектрум",
    tags: ["пленар", "город", "инвестиции"],
    progress: true,
  });
  slotRow("d1-main-1045", 1, "main", "10:45", "11:00", {
    format: "Пленарная сессия (с модератором)",
    title: "Инфраструктурный баланс, инвестиции и ГЧП",
    speaker: "**Сергей Дяйкин** — Исполнительный директор ООО «Аэропорт Геленджик»",
    tags: ["ГЧП", "инфраструктура"],
    progress: true,
  });
  slotRow("d1-main-1100", 1, "main", "11:00", "11:15", {
    format: "Пленарная сессия (с модератором)",
    title: "«Море здесь у всех. Такое — только у нас. Шато де Талю и новый образ Геленджика»",
    speaker: "**Гереш Елена** — Директор по развитию Шато де Талю, Мантера Групп",
    tags: ["бренд", "туризм"],
    progress: true,
  });
  slotRow("d1-main-1115", 1, "main", "11:15", "11:30", {
    format: "Пленарная сессия (с модератором)",
    title: "Новая философия экономического роста",
    speaker:
      "**Кангин Алексей** — Зам. исп. директора, АНО «Корпорация развития «Геленджик-2035»» (Резерв/Замена: Мальцева)",
    tags: ["экономика", "стратегия"],
    progress: true,
  });
  slotRow("d1-main-1130", 1, "main", "11:30", "11:35", {
    format: "Пленарная сессия (с модератором)",
    title: "—",
    speaker:
      "**Воронков Михаил** — Начальник управления архитектуры и градостроительства, главный архитектор Туапсинского МО",
    progress: true,
  });
  slotRow("d1-main-1135", 1, "main", "11:35", "12:30", {
    format: "Дискуссия",
    title: "Общая дискуссия",
    speaker: "Модератор: Донцов Егор. Спикеры: Дяйкин С., Гереш Е., Кангин А., Воронков М.",
    tags: ["дискуссия"],
    progress: true,
  });
  slotRow("d1-main-1230", 1, "main", "12:30", "12:45", {
    format: "Вопрос-ответ с залом",
    title: "Вопрос-ответ с залом",
    speaker: "—",
    progress: true,
  });
  slotRow("d1-main-lunch", 1, "main", "12:45", "13:30", {
    format: "Обед (Ресторан)",
    title: "Обед. Свободное время",
    speaker: "—",
    noVote: true,
    progress: false,
  });
  slotRow("d1-main-bl-s1", 1, "main", "13:30", null, {
    block: true,
    title: 'БЛОК СОЛЬНЫХ ВЫСТУПЛЕНИЙ №1 · «Устойчивое развитие туристических городов»',
    noVote: true,
    progress: false,
  });
  slotRow("d1-main-1330", 1, "main", "13:30", "13:45", {
    title: "«От газировки к наукограду: опыт ребрендинга и социокультурного перепрограммирования Черноголовки»",
    speaker:
      "**Пьянкова Анна Александровна** — Директор центра поддержки и развития современного искусства «ЗА АРТ»",
    tags: ["ребрендинг", "город"],
    progress: true,
  });
  slotRow("d1-main-1345", 1, "main", "13:45", "14:00", {
    title: "«Роль креативных кластеров в экономическом развитии территорий: от идеи к реализации»",
    speaker:
      "**Битарова Мария Анатольевна** — Заместитель директора ГКУ КК «Центр регионального развития»",
    tags: ["креатив", "развитие"],
    progress: true,
  });
  slotRow("d1-main-1400", 1, "main", "14:00", "14:15", {
    title: "«Развитие арт-парка с помощью событий на стыке образования и творчества»",
    speaker: "**Петрук Иван Владимирович** — Основатель и руководитель Арт-парка «Острова Ершовы»",
    tags: ["образование", "арт-парк"],
    progress: true,
  });
  slotRow("d1-main-bl-s2", 1, "main", "14:15", null, {
    block: true,
    title: 'БЛОК СОЛЬНЫХ ВЫСТУПЛЕНИЙ №2 · «Город для людей: качество жизни и комфорт среды»',
    noVote: true,
    progress: false,
  });
  slotRow("d1-main-1415", 1, "main", "14:15", "14:30", {
    title: "«Архитектура, созвучная природе»",
    speaker: "**Владимир Тютин** — Технический директор ООО «Аэропорт Геленджик»",
    tags: ["архитектура", "экология"],
    progress: true,
  });
  slotRow("d1-main-1430", 1, "main", "14:30", "14:45", {
    title: "«Культурно-спортивный центр в тренде деурбанизации. Архитектура и экономические драйверы»",
    speaker:
      "**Астахов Сергей** — Доктор геолого-минералогических наук, архитектор и руководитель проекта Южность",
    tags: ["архитектура", "город"],
    progress: true,
  });
  slotRow("d1-main-1445", 1, "main", "14:45", "15:00", {
    title: "«Креативная экосистема туристского центра на примере Санкт-Петербурга» (онлайн)",
    speaker:
      "**Морозова Марина Александровна** — Генеральный директор АНО «Центр компетенций в сфере туризма и гостеприимства»",
    tags: ["туризм", "креатив"],
    progress: true,
  });
  slotRow("d1-main-1500", 1, "main", "15:00", "15:15", {
    title: "«Город, одинаково удобный и для местных, и для туристов»",
    speaker: "**Аниса Халимова** — Руководитель отдела развития туризма г. Иннополис",
    tags: ["туризм", "город"],
    progress: true,
  });
  slotRow("d1-main-break", 1, "main", "15:15", "15:45", {
    format: "Кофе-брейк (Фойе)",
    title: "Кофе-брейк",
    speaker: "—",
    noVote: true,
    progress: false,
  });
  slotRow("d1-main-bl-s3", 1, "main", "15:45", null, {
    block: true,
    title: 'БЛОК СОЛЬНЫХ ВЫСТУПЛЕНИЙ №3 · «Креативная экономика и культурная среда»',
    noVote: true,
    progress: false,
  });
  slotRow("d1-main-1545", 1, "main", "15:45", "16:00", {
    title: "«Потенциал индустриального наследия в развитии территорий»",
    speaker: "**Маликова Дарья** — Руководитель школы медиации «Индустриальный эксперимент»",
    tags: ["наследие", "проблематика"],
    progress: true,
  });
  slotRow("d1-main-1600", 1, "main", "16:00", "16:15", {
    title: "«Модное или вечное? Как и зачем формировать вкус вашей аудитории»",
    speaker: "**Ким Белов** — Сценарист, директор по коммуникациям",
    tags: ["коммуникации", "аудитория"],
    progress: true,
  });
  slotRow("d1-main-1615", 1, "main", "16:15", "16:30", {
    title:
      "«НЕЛЬЗЯ, НО ЕСЛИ ОЧЕНЬ ХОЧЕТСЯ, ТО МОЖНО. Как продвигать игорный и винный туризм в нишах с жёсткими ограничениями. Опыт MANTERA»",
    speaker: "**Гереш Елена** — Директор по развитию Шато де Талю, Мантера Групп",
    tags: ["туризм", "бренд"],
    progress: true,
  });
  slotRow("d1-main-1630", 1, "main", "16:30", "16:45", {
    title: "«Туризм в эпоху постмодерна»",
    speaker:
      "**Кангин Алексей** — Зам. исп. директора, АНО «Корпорация развития «Геленджик-2035»»",
    tags: ["туризм"],
    progress: true,
  });
  slotRow("d1-main-bl-p2", 1, "main", "16:45", null, {
    block: true,
    title: 'ПЛЕНАРНАЯ СЕССИЯ №2 · «Туризм и креативная экономика: точки пересечения»',
    noVote: true,
    progress: false,
  });
  slotRow("d1-main-1645", 1, "main", "16:45", "17:40", {
    format: "Пленарная сессия",
    title: "Обсуждение синергии туристической отрасли и креативных индустрий",
    speaker:
      "Модератор: Ким Белов. Спикеры: Астахов С., Битарова М., Гереш Е., Кангин А.",
    tags: ["пленар", "дискуссия", "туризм", "креатив"],
    progress: true,
  });
  slotRow("d1-main-1740", 1, "main", "17:40", "17:50", {
    format: "Вопрос-ответ с залом",
    title: "Вопрос-ответ с залом",
    speaker: "—",
    progress: true,
  });
  slotRow("d1-main-1750", 1, "main", "17:50", "18:00", {
    title: "Завершение дня",
    format: "",
    speaker: "Подведение итогов первого дня. Анонс программы второго дня · Ведущий",
    progress: false,
  });
  slotRow("d1-main-dinner-sp", 1, "main", "18:00", "19:00", {
    format: "",
    title: "Ужин для спикеров",
    speaker: "—",
    noVote: true,
    progress: false,
  });
  slotRow("d1-main-exc", 1, "main", "19:00", "21:00", {
    format: "",
    title: 'Экскурсия в «Шато де Талю»',
    speaker: "—",
    noVote: true,
    progress: false,
  });
  slotRow("d1-main-tf2100", 1, "main", "21:00", "21:15", {
    format: "",
    title: "Трансфер в отель",
    speaker: "—",
    noVote: true,
    progress: false,
  });

  slotRow("d1-small-1630", 1, "small", "16:30", "18:00", {
    format: "Кинопоказ",
    title:
      'Показ и обсуждение документального фильма «Мануфактура культуры» Благотворительного фонда Владимира Потанина',
    speaker: "Пьянкова Анна Александровна, Маликова Дарья Николаевна",
    tags: ["кино"],
    progress: true,
  });
  slotRow("d1-small-after", 1, "small", "18:00", "21:00", {
    format: "Проектная мастерская",
    title: "Работа с индустриальным наследием Краснодарского края. Инструменты культурного программирования",
    speaker: "Пьянкова Анна Александровна, Маликова Дарья Николаевна",
    tags: ["практика", "наследие"],
    progress: true,
  });

  slotRow("d1-kubsu-a", 1, "kubsu", "10:00", "10:40", {
    format: "Наставничество",
    title: 'Презентация проекта студентов КубГУ: «Приложение МаркхотГИД»',
    speaker: "—",
    tags: ["студенты"],
    progress: true,
  });
  slotRow("d1-kubsu-b", 1, "kubsu", "11:00", "12:30", {
    format: "Наставничество",
    title: 'Презентация проектов студентов КубГУ: «Ландшафтные проекты»',
    speaker: "—",
    tags: ["студенты"],
    progress: true,
  });

  slotRow("d2-main-0800", 2, "main", "08:00", "10:00", {
    format: "Регистрация (Фойе)",
    title: "Регистрация участников. Приветственный кофе. Нетворкинг",
    speaker: "Волонтёры, организаторы",
    noVote: true,
    progress: false,
  });
  slotRow("d2-main-bl-x1", 2, "main", "10:00", null, {
    block: true,
    title:
      'БЛОК СОЛЬНЫХ ВЫСТУПЛЕНИЙ №1 · «Качество жизни, комфорт среды, инфраструктура»',
    noVote: true,
    progress: false,
  });
  slotRow("d2-main-1000", 2, "main", "10:00", "10:15", {
    title:
      '«Финансовая устойчивость культурных пространств. Продюсирование локального. Опыт КЦ «Рельсы» и сообщества МЫ ТУТ»',
    speaker: "**Андреев Илья** — Основатель центра современной культуры «Рельсы», Тверь / МЫ ТУТ",
    tags: ["культура", "устойчивость"],
    progress: true,
  });
  slotRow("d2-main-1015", 2, "main", "10:15", "10:30", {
    title:
      "«Социокультурное и социоэкономическое развитие малого поселения на примере Пушкинских Гор. Гастрономический туризм как драйвер развития экономики территории»",
    speaker:
      "**Авруцкая Ирина Гарриевна** — Член национального экспертного совета по развитию кадрового потенциала в сфере туризма и гостеприимства (Минэкономразвития РФ). Пушкинские Горы",
    tags: ["туризм", "посёлок"],
    progress: true,
  });
  slotRow("d2-main-1030", 2, "main", "10:30", "10:45", {
    title:
      "«Герои не умирают: первая национальная GIS/VR экосистема сохранения исторической памяти на основе ИИ»",
    speaker:
      "**Мартышенко Дмитрий Юрьевич** — Директор консалтингово-аналитической группы «Интеграция», консультант по управлению и организационному развитию",
    tags: ["ИИ", "память"],
    progress: true,
  });
  slotRow("d2-main-1045", 2, "main", "10:45", "11:00", {
    title: "«Радар клиентов: как AI-система находит сигналы спроса раньше, чем их видят конкуренты»",
    speaker:
      "**Попельнюк Кирилл** — Co-founder & Креативный директор, ИИнтеграция",
    tags: ["ИИ", "ритейл"],
    progress: true,
  });
  slotRow("d2-main-bl-p1", 2, "main", "11:00", null, {
    block: true,
    title:
      'ПЛЕНАРНАЯ СЕССИЯ №1 · «Город для людей: качество жизни и комфорт среды»',
    noVote: true,
    progress: false,
  });
  slotRow("d2-main-1100-pl", 2, "main", "11:00", "11:45", {
    format: "Пленарная сессия",
    title:
      "Обсуждение человекоцентричных подходов к развитию городской среды. Практики вовлечения горожан",
    speaker:
      "Модератор: Маликова Д. Спикеры: Андреев И., Авруцкая И.",
    tags: ["город"],
    progress: true,
  });
  slotRow("d2-main-1145", 2, "main", "11:45", "12:00", {
    format: "Вопрос-ответ с залом",
    title: "Вопрос-ответ с залом",
    speaker: "—",
    progress: true,
  });
  slotRow("d2-main-1200-int", 2, "main", "12:00", "13:00", {
    format: "Интервью с онлайн-спикером",
    title: "«Как события превращают локацию в дестинацию»",
    speaker:
      "**Гереш Елена** + **Vishal Nagdev** (онлайн) — сооснователь Pow Wow Marketing и EVENTFAQS Media",
    tags: ["события", "локации"],
    progress: true,
  });
  slotRow("d2-main-lunch", 2, "main", "13:00", "14:00", {
    format: "Обед (Ресторан)",
    title: "Организованный обед",
    speaker: "—",
    noVote: true,
    progress: false,
  });
  slotRow("d2-main-bl-x2", 2, "main", "14:00", null, {
    block: true,
    title:
      'БЛОК СОЛЬНЫХ ВЫСТУПЛЕНИЙ №2 · «Инфраструктура, ГЧП, исследования и стратегии»',
    noVote: true,
    progress: false,
  });
  slotRow("d2-main-1400", 2, "main", "14:00", "14:20", {
    title:
      "«Терапевтический ландшафт: социальное садоводство и природные маршруты в системе благополучия жителей»",
    speaker:
      "**Штанько Татьяна Викторовна** — Руководитель отдела городских проектов АНО «Фонд развития города Иннополис»",
    tags: ["ландшафт"],
    progress: true,
  });
  slotRow("d2-main-1420", 2, "main", "14:20", "14:40", {
    title: "«Локальная идентичность как инструмент устойчивого роста»",
    speaker:
      "**Комкова Елена Валерьевна** — Основатель студии LËNKA",
    tags: ["идентичность"],
    progress: true,
  });
  slotRow("d2-main-1440", 2, "main", "14:40", "15:00", {
    title: "«Как проводить исследования для туристических стратегий и проектов»",
    speaker: "**Чернец Елена** — Эксперт по социокультурным исследованиям территорий",
    tags: ["исследования"],
    progress: true,
  });
  slotRow("d2-main-1500", 2, "main", "15:00", "15:20", {
    title:
      "«Дизайн для людей: как Альметьевск создаёт комфортную среду через осознанную урбанистику»",
    speaker:
      "**Козырицкая Анастасия** — Помощник Главы Альметьевска по развитию городской среды",
    tags: ["дизайн", "город"],
    progress: true,
  });
  slotRow("d2-main-brk", 2, "main", "15:20", "15:50", {
    format: "Кофе-брейк (Фойе)",
    title: "Кофе-брейк",
    speaker: "—",
    noVote: true,
    progress: false,
  });
  slotRow("d2-main-bl-ins", 2, "main", "15:50", null, {
    block: true,
    title:
      'ИНСАЙТ-СЕССИИ · «Лучшие практики и кейсы развития территорий»',
    noVote: true,
    progress: false,
  });
  slotRow("d2-main-1550", 2, "main", "15:50", "16:10", {
    title: "«Цифровые сервисы в управлении городом — кейс Иннополиса»",
    speaker:
      "**Хабибуллин Айрат Рашатович** — Директор АНО «Фонд развития города Иннополис», советник мэра г. Иннополис",
    tags: ["цифра", "управление"],
    progress: true,
  });
  slotRow("d2-main-1610", 2, "main", "16:10", "16:30", {
    title:
      "«Анализ восприятия интернет-ресурсов по привлечению туристического потока в малые города»",
    speaker: "**Комков Михаил** — Технический директор",
    tags: ["туризм", "исследование"],
    progress: true,
  });
  slotRow("d2-main-1630", 2, "main", "16:30", "16:50", {
    title:
      "«Креативные индустрии как инструмент развития малых городов: кейс Бирска и перспективы для регионов»",
    speaker:
      "**Старков Александр** — Партнёр агентства «Городские герои», руководитель экспертной группы по развитию креативных индустрий в Башкортостане",
    tags: ["креатив", "маленькие города"],
    progress: true,
  });
  slotRow("d2-main-tbd1", 2, "main", "16:50", "17:10", {
    title: "TBD",
    speaker: "TBD",
    tbd: true,
    noVote: true,
    progress: true,
  });
  slotRow("d2-main-tbd2", 2, "main", "17:10", "17:30", {
    title: "TBD",
    speaker: "TBD",
    tbd: true,
    noVote: true,
    progress: true,
  });
  slotRow("d2-main-close", 2, "main", "17:30", "18:00", {
    format: "Торжественное закрытие",
    title:
      "Подведение итогов. Формулирование рекомендаций. Благодарности участникам, спикерам и партнёрам. Анонс следующего форума",
    speaker: "",
    progress: false,
  });
  slotRow("d2-main-vip", 2, "main", "18:00", "22:00", {
    format: "",
    title: "Торжественный фуршет (VIP)",
    speaker: "Вечерний фуршет для VIP-гостей, спикеров и партнёров",
    noVote: true,
    progress: false,
  });

  const VISIBLE_SLOTS = SLOTS.filter((s) => !s.hidden);

  function pad2(n) {
    return String(n).padStart(2, "0");
  }

  /** @returns {number} ms */
  function atLocal(dStr, hhmm, dayAdj = 0) {
    const [h, m] = hhmm.split(":").map(Number);
    const d = new Date(`${dStr}T${pad2(h)}:${pad2(m)}:00`);
    return d.getTime();
  }

  const DAY_ISO = { 1: "2026-05-16", 2: "2026-05-17" };

  function slotStartMs(sl) {
    return atLocal(DAY_ISO[sl.day], sl.start);
  }

  function slotEndMs(sl) {
    if (!sl.end) return slotStartMs(sl);
    const [eh, em] = sl.end.split(":").map(Number);
    const [sh, sm] = sl.start.split(":").map(Number);
    let endMs = atLocal(DAY_ISO[sl.day], sl.end);
    const startMs = slotStartMs(sl);
    if (endMs < startMs) endMs += 86400000;
    if (eh === sh && em === sm) return startMs;
    return endMs;
  }

  function votesMap() {
    try {
      return JSON.parse(localStorage.getItem(LS_VOTES) || "{}") || {};
    } catch {
      return {};
    }
  }

  function setVotesMap(m) {
    localStorage.setItem(LS_VOTES, JSON.stringify(m));
  }

  function slotVoteCount(slotId, m) {
    return Number(m[slotId] || 0);
  }

  function speakerTotals(m) {
    const totals = {};
    SPEAKERS.forEach((s) => {
      totals[s.key] = s.slotIds.reduce((acc, sid) => acc + slotVoteCount(sid, m), 0);
    });
    return totals;
  }

  function tagTotalsFromVotes(m) {
    const tally = {};
    VISIBLE_SLOTS.forEach((sl) => {
      const v = slotVoteCount(sl.id, m);
      if (!v || !sl.tags) return;
      sl.tags.forEach((t) => {
        tally[t] = (tally[t] || 0) + v;
      });
    });
    return tally;
  }

  function formatNowClock() {
    const d = new Date();
    return d.toLocaleString("ru-RU", {
      weekday: "short",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const venueOrder = /** @type {const} */ ({ main: 0, small: 1, kubsu: 2 });

  /** @returns {{ now: Slot|null, next: Slot|null, untilNextMin: number|null }} */
  function liveNowNext() {
    const t = Date.now();
    const pri = (v) => venueOrder[v] ?? 99;
    const sorted = [...VISIBLE_SLOTS].sort(
      (a, b) => slotStartMs(a) - slotStartMs(b) || pri(a.venue) - pri(b.venue)
    );

    const active = sorted.filter((sl) => {
      const a = slotStartMs(sl);
      const b = slotEndMs(sl);
      return t >= a && t < b && !sl.block;
    });
    active.sort((a, b) => pri(a.venue) - pri(b.venue) || slotStartMs(a) - slotStartMs(b));
    const now = active.length ? active[0] : null;

    /** @returns {Slot[]} */
    const startsFrom = (ms) =>
      sorted
        .filter((sl) => !sl.block && slotStartMs(sl) >= ms)
        .sort((a, b) => slotStartMs(a) - slotStartMs(b) || pri(a.venue) - pri(b.venue));

    let next = null;
    let untilNextMin = null;
    if (now) {
      const after = startsFrom(slotEndMs(now));
      next = after.find((sl) => sl.id !== now.id) || after[0] || null;
    } else {
      next = sorted.find((sl) => !sl.block && t < slotStartMs(sl)) || null;
    }
    if (next) untilNextMin = Math.max(0, Math.round((slotStartMs(next) - t) / 60000));
    return { now, next, untilNextMin };
  }

  /** Progress: главный зал, текущий календарный день программы или выбранный день если вне диапазона */
  function dayProgress(day, nowMs = Date.now()) {
    const iso = DAY_ISO[day];
    const dayStart = atLocal(iso, "08:00");
    const dayEnd = atLocal(iso, "22:05");
    if (nowMs < dayStart || nowMs > dayEnd) return { passed: null, remaining: null, label: "Вне времени форума" };
    const mainSlots = VISIBLE_SLOTS.filter(
      (s) => s.day === day && s.venue === "main" && s.progress === true && !s.block
    );
    const counts = [];
    mainSlots.forEach((s) => {
      const end = slotEndMs(s);
      if (nowMs >= end) counts.push({ s, state: "passed" });
      else counts.push({ s, state: "remaining" });
    });
    const passed = counts.filter((c) => c.state === "passed").length;
    const remaining = counts.filter((c) => c.state === "remaining").length;
    return { passed, remaining, label: `${passed} прошло · ${remaining} впереди · всего блоков содержания: ${counts.length}` };
  }

  function heatColors(pctMax) {
    if (pctMax >= 66) return "var(--heat-high)";
    if (pctMax >= 33) return "var(--heat-mid)";
    return "var(--heat-low)";
  }

  /** ---------- Rendering ---------- */

  let state = {
    venue: /** @type {'main'|'small'|'kubsu'} */ ("main"),
    day: /** @type {0|1|2} */ (0),
    query: "",
  };

  function matchFilter(sl) {
    if (state.venue !== sl.venue) return false;
    if (state.day === 1 || state.day === 2) {
      if (sl.day !== state.day) return false;
    }
    const q = state.query.trim().toLowerCase();
    if (q) {
      const hay = `${sl.title} ${sl.speaker || ""} ${sl.format || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }

  function renderProgram(root) {
    if (!root) return;
    const cards = VISIBLE_SLOTS.filter(matchFilter);
    root.innerHTML = cards
      .map((sl) => {
        const isBlock = Boolean(sl.block);
        const time = sl.end ? `${sl.start}–${sl.end}` : sl.start;
        const m = votesMap();
        const cnt = slotVoteCount(sl.id, m);
        const voteBtn =
          sl.noVote || isBlock
            ? ""
            : `<button type="button" class="vote-btn" data-slot="${sl.id}" aria-label="Интересно">👍 Интересно <span class="vote-n">${cnt}</span></button>`;
        const fmt = sl.format ? `<span class="slot-format">${escapeHtml(sl.format)}</span>` : "";
        const sp = sl.speaker ? `<p class="slot-sp">${escapeHtml(sl.speaker)}</p>` : "";
        const tbd = sl.tbd ? '<span class="badge badge--tbd">TBD</span>' : "";
        return `
<article class="slot-card${isBlock ? " slot-card--block" : ""}" id="slot-${sl.id}">
  <div class="slot-card__head">
    <span class="slot-time">${escapeHtml(time)}</span>
    <div class="slot-badges">${fmt}${tbd}</div>
  </div>
  <h3 class="slot-title">${escapeHtml(sl.title)}</h3>
  ${sp}
  <div class="slot-actions">${voteBtn}</div>
</article>`;
      })
      .join("");
    root.querySelectorAll(".vote-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const sid = btn.getAttribute("data-slot");
        const vm = votesMap();
        vm[sid] = (vm[sid] || 0) + 1;
        setVotesMap(vm);
        btn.querySelector(".vote-n").textContent = String(vm[sid]);
        syncAiAndHeatmap();
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderSpeakers(root) {
    if (!root) return;
    root.innerHTML = SPEAKERS.map((sp) => {
      const initials = sp.name
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();
      const links = [...new Set(sp.slotIds)]
        .map((id) => {
          const sl = VISIBLE_SLOTS.find((x) => x.id === id);
          if (!sl) return "";
          const day = sl.day === 1 ? "16 мая" : "17 мая";
          return `<a href="#slot-${id}">${escapeHtml(day)} · ${escapeHtml(sl.start)}</a>`;
        })
        .filter(Boolean)
        .join(" · ");
      return `
<article class="sp-card" data-spk="${sp.key}">
  <div class="sp-avatar" aria-hidden="true">${escapeHtml(initials)}</div>
  <h3 class="sp-name">${escapeHtml(sp.name)}</h3>
  <p class="sp-role">${escapeHtml(sp.role)}</p>
  <p class="sp-topic">${escapeHtml(sp.topic)}</p>
  <div class="sp-links">${links}</div>
</article>`;
    }).join("");
  }

  function renderAiPulse(el) {
    if (!el) return;
    const m = votesMap();
    const totals = speakerTotals(m);
    const top = [...SPEAKERS]
      .map((s) => ({ s, n: totals[s.key] }))
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);
    const { now, next, untilNextMin } = liveNowNext();
    const curDay = now ? now.day : (Date.now() >= atLocal(DAY_ISO[2], "00:00") ? 2 : 1);

    const prog = dayProgress(curDay);

    const tagTot = tagTotalsFromVotes(m);
    const hotTag = Object.entries(tagTot).sort((a, b) => b[1] - a[1])[0];

    const hottestSlot = [...VISIBLE_SLOTS].reduce(
      (best, sl) => {
        const v = slotVoteCount(sl.id, m);
        if (!best || v > best.v) return { sl, v };
        return best;
      },
      /** @type {{sl: Slot, v: number}|null} */ (null)
    );

    el.innerHTML = `
<section class="pulse-block">
  <h3>Сейчас на устройстве</h3>
  <p class="pulse-clock">${escapeHtml(formatNowClock())}</p>
</section>
<section class="pulse-block">
  <h3>Слот программы</h3>
  <p class="pulse-now">${now ? `<strong>Сейчас:</strong> ${escapeHtml(now.title)}${now.speaker ? ` — ${escapeHtml(now.speaker)}` : ""}` : '<span class="muted">Нет активного слота по расписанию</span>'}</p>
  <p class="pulse-next">${
    next
      ? `<strong>Следующее через ${untilNextMin != null ? untilNextMin : "…"} мин.:</strong> ${escapeHtml(next.title)}`
      : '<span class="muted">На сегодня после текущего нет элементов или форум завершён</span>'
  }</p>
</section>
<section class="pulse-block">
  <h3>Прогресс дня (Главный зал)</h3>
  <p class="muted">Правило: блоки содержания (без пауз регистрация/еда/перерывы) текущего дня</p>
  <p><strong>${curDay === 1 ? "16 мая" : "17 мая"}:</strong> ${
      prog.passed != null ? escapeHtml(prog.label) : escapeHtml(prog.label)
    }</p>
</section>
<section class="pulse-block">
  <h3>Топ‑5 по «Интересно»</h3>
  <ol class="pulse-top">${top.map((x) => `<li><strong>${escapeHtml(x.s.name)}</strong> — ${x.n}</li>`).join("")}</ol>
</section>
<section class="pulse-block">
  <h3>«Горячая тема» по тегам</h3>
  <p>${
    hotTag
      ? `Тег <strong>#${escapeHtml(hotTag[0])}</strong> — суммарно меток голосования: ${hotTag[1]}`
      : '<span class="muted">Ещё нет голосов — нажимайте «Интересно» у сессий</span>'
  }</p>
  ${
    hottestSlot && hottestSlot.v > 0
      ? `<p><strong>Самый «горячий» слот:</strong> ${escapeHtml(hottestSlot.sl.title)} (${hottestSlot.v})</p>`
      : ""
  }
</section>`;
  }

  function renderHeatmap(root) {
    if (!root) return;
    const m = votesMap();
    const totals = speakerTotals(m);
    const max = Math.max(1, ...Object.values(totals));
    const rows = [...SPEAKERS]
      .map((s) => ({ s, n: totals[s.key], pct: Math.round((100 * totals[s.key]) / max) }))
      .sort((a, b) => b.n - a.n);

    root.innerHTML = `
<div class="heat-legend"><span>Золото (макс.)</span><span>Средний</span><span>Низкий</span></div>
<ul class="heat-list">${rows
      .map(
        ({ s, pct }) =>
          `<li><span>${escapeHtml(s.name)}</span><span class="heat-bar" title="${pct}%"><i style="width:${pct}%;background:${heatColors(
            pct
          )}"></i></span><span>${pct}%</span></li>`
      )
      .join("")}
</ul>`;
  }

  function syncAiAndHeatmap() {
    renderAiPulse(document.querySelector("[data-ai-pulse]"));
    renderHeatmap(document.querySelector("[data-heatmap-root]"));
  }

  /** ---------- Tabs / hooks ---------- */

  document.querySelectorAll("[data-vtab]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = /** @type {'main'|'small'|'kubsu'} */ (btn.getAttribute("data-vtab"));
      state.venue = v;
      document.querySelectorAll("[data-vtab]").forEach((b) => {
        const on = b.getAttribute("data-vtab") === v;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
      });
      renderProgram(document.querySelector("[data-program-root]"));
    });
  });

  document.querySelectorAll("[data-day-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const d = Number(btn.getAttribute("data-day-filter")) || 0;
      state.day = /** @type {0|1|2} */ (d);
      document.querySelectorAll("[data-day-filter]").forEach((b) => {
        const on = Number(b.getAttribute("data-day-filter") || "0") === state.day;
        b.classList.toggle("is-active", on);
      });
      renderProgram(document.querySelector("[data-program-root]"));
    });
  });

  const searchInput = document.querySelector("[data-program-search]");
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.query = searchInput.value || "";
      renderProgram(document.querySelector("[data-program-root]"));
    });
  }

  function initGoogleContact() {
    const cfg = window.GOOGLE_FORM_CONFIG || {};
    const embedRaw = (cfg.embedUrl || "").trim();
    const form = document.querySelector("#contact-form");
    const host = document.querySelector("#google-form-embed-host");
    const hint = document.querySelector("#form-hint-native");
    const status = document.querySelector("#form-status");

    let usedEmbed = false;
    if (host && embedRaw) {
      try {
        const u = new URL(embedRaw);
        if (u.hostname === "docs.google.com" && u.pathname.includes("/forms/")) {
          u.searchParams.set("embedded", "true");
          const iframe = document.createElement("iframe");
          iframe.className = "google-form-iframe";
          iframe.title = "Заявка на участие";
          iframe.src = u.href;
          iframe.loading = "lazy";
          iframe.referrerPolicy = "no-referrer-when-downgrade";
          host.replaceChildren(iframe);
          host.removeAttribute("hidden");
          if (form) {
            form.setAttribute("hidden", "");
            form.setAttribute("aria-hidden", "true");
          }
          if (hint) hint.setAttribute("hidden", "");
          usedEmbed = true;
        }
      } catch {
        usedEmbed = false;
      }
    }

    if (!usedEmbed) {
      if (host) {
        host.setAttribute("hidden", "");
        host.replaceChildren();
      }
      if (form) {
        form.removeAttribute("hidden");
        form.removeAttribute("aria-hidden");
      }
      if (hint) hint.removeAttribute("hidden");
    }

    if (usedEmbed || !form || !status) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const nameEl = form.querySelector("#c-name");
      const emailEl = form.querySelector("#c-email");
      const msgEl = form.querySelector("#c-msg");
      const name = nameEl?.value?.trim() ?? "";
      const email = emailEl?.value?.trim() ?? "";
      const message = msgEl?.value?.trim() ?? "";

      const googleReady =
        cfg &&
        typeof cfg.formAction === "string" &&
        /^https:\/\/docs\.google\.com\/forms\//.test(cfg.formAction) &&
        cfg.entryName &&
        cfg.entryEmail &&
        cfg.entryMessage;

      status.textContent = "";

      if (!googleReady) {
        status.textContent =
          "Отправка заявки с сайта сейчас недоступна: форма ещё не подключена к сервису организаторов. Напишите на dm.martyshenko@gmail.com — команда форума ответится и подскажет формат участия.";
        return;
      }

      if (!email || !message) {
        status.textContent = "Заполните обязательные поля: эл. почта и сообщение.";
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;

      try {
        const body = new URLSearchParams();
        body.set(cfg.entryName, name);
        body.set(cfg.entryEmail, email);
        body.set(cfg.entryMessage, message);
        body.set("fvv", "1");

        await fetch(cfg.formAction, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString(),
        });

        status.textContent =
          "Спасибо! Заявка отправлена. Данные появятся в таблице ответов Google Формы; мы свяжемся с вами по указанной почте.";
        form.reset();
      } catch {
        status.textContent =
          "Не удалось отправить форму. Проверьте интернет или напишите на dm.martyshenko@gmail.com.";
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  const navToggle = document.querySelector(".btn-nav-toggle");
  const navMobile = document.querySelector(".nav-mobile");
  const closeMobileNav = () => {
    if (!navMobile || !navToggle) return;
    navMobile.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Открыть меню");
  };

  if (navToggle && navMobile) {
    navToggle.addEventListener("click", () => {
      const open = navMobile.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
    });
    navMobile.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMobileNav));
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && navMobile.classList.contains("is-open")) {
        e.preventDefault();
        closeMobileNav();
        navToggle.focus();
      }
    });
  }

  renderProgram(document.querySelector("[data-program-root]"));
  renderSpeakers(document.querySelector("[data-speakers-root]"));
  renderAiPulse(document.querySelector("[data-ai-pulse]"));
  renderHeatmap(document.querySelector("[data-heatmap-root]"));
  initGoogleContact();

  setInterval(() => {
    renderAiPulse(document.querySelector("[data-ai-pulse]"));
  }, 30000);

  const navLinks = [...document.querySelectorAll("[data-nav]")];
  const seen = new Set();
  const sections = [];
  navLinks.forEach((a) => {
    const id = a.getAttribute("data-nav");
    const el = id && document.getElementById(id);
    if (el && id && !seen.has(id)) {
      seen.add(id);
      sections.push({ id, el });
    }
  });

  const setActiveNav = (id) => {
    navLinks.forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("data-nav") === id);
    });
  };

  if (sections.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActiveNav(visible.target.id);
      },
      { rootMargin: "-28% 0px -55% 0px", threshold: [0, 0.1, 0.25, 0.5] }
    );
    sections.forEach(({ el }) => io.observe(el));
  }

  const toTop = document.querySelector(".to-top");
  if (toTop) {
    const toggleTop = () => {
      toTop.classList.toggle("is-visible", window.scrollY > 520);
    };
    toggleTop();
    window.addEventListener("scroll", toggleTop, { passive: true });
  }
})();
