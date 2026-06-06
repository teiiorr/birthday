/**
 * Uzbek (Latin) localization — the single source of truth for every
 * user-facing string in the bot.
 *
 * Convention: functions that interpolate dynamic values assume the caller has
 * already HTML-escaped any untrusted content (names, wish text, etc.).
 *
 * Note: plain strings are delimited with double quotes because Uzbek text uses
 * the apostrophe (o', g', a'zo) extensively.
 */

export const uz = {
  common: {
    yes: 'Ha',
    no: "Yo'q",
    back: '🔙 Orqaga',
    cancel: '❌ Bekor qilish',
    confirm: '✅ Tasdiqlash',
    prev: '⬅️ Oldingi',
    next: 'Keyingi ➡️',
    skip: "⏭ O'tkazib yuborish",
    none: "yo'q",
    cancelled: '❌ Bekor qilindi.',
    done: '✅ Bajarildi.',
    unknownAction: 'Bu amal endi mavjud emas.',
    error: "❗️ Xatolik yuz berdi. Birozdan so'ng qayta urinib ko'ring.",
    notAllowed: "Bu amal uchun ruxsatingiz yo'q.",
    on: 'yoqilgan',
    off: "o'chirilgan",
    notSet: 'belgilanmagan',
  },

  start: {
    greetingUser:
      '👋 Assalomu alaykum!\n\n' +
      "Men jamoamizning tug'ilgan kunlari uchun yordamchi botman. " +
      "Tug'ilgan kunlarni kuzatib boraman va hamkasblardan anonim tabriklarni yig'aman.\n\n" +
      'Buyruqlar bilan tanishish uchun /help yozing.',
    adminHint: '\n\n🔐 Siz administratorsiz. Boshqaruv paneli uchun /admin yozing.',
  },

  help: {
    text:
      'ℹ️ <b>Birthday Bot — yordam</b>\n\n' +
      'Mavjud buyruqlar:\n' +
      '/start — Botni ishga tushirish\n' +
      '/help — Yordam\n' +
      "/birthdays — Bu oygi tug'ilgan kunlar\n" +
      "/next — Eng yaqin tug'ilgan kun\n\n" +
      'Hamkasbingizni tabriklash uchun guruhdagi “✍️ Tabrik yozish” tugmasini bosing — ' +
      'tabringiz anonim saqlanadi.',
    adminCommands:
      '\n\n🔐 <b>Administrator buyruqlari:</b>\n' +
      '/admin — Boshqaruv paneli\n' +
      "/employees — Xodimlar ro'yxati\n" +
      "/add_employee — Yangi xodim qo'shish\n" +
      "/upcoming_birthdays — Yaqin tug'ilgan kunlar\n" +
      '/settings — Sozlamalar\n' +
      '/preview_messages — Xabarlar namunasi',
  },

  wish: {
    prompt: (firstName: string): string =>
      `${firstName} uchun tabrigingizni yozing.\n\nTabrigingiz anonim tarzda saqlanadi.`,
    editPrompt: (firstName: string): string => `✏️ ${firstName} uchun yangi tabrik matnini yozing:`,
    preview: (message: string): string => `💌 <b>Tabrik preview:</b>\n\n${message}\n\nYuborasizmi?`,
    btnSend: '✅ Yuborish',
    btnEdit: '✏️ Tahrirlash',
    btnCancel: '❌ Bekor qilish',
    saved: "Rahmat! Tabrik saqlandi va tug'ilgan kun kuni e'lon qilinadi.",
    savedPending:
      "Rahmat! Tabringiz qabul qilindi. Tasdiqdan so'ng tug'ilgan kun kuni e'lon qilinadi.",
    notMember: "Kechirasiz, ushbu imkoniyat faqat jamoa a'zolari uchun mavjud.",
    tooShort: 'Tabrik biroz qisqa. Iltimos, batafsilroq yozing.',
    tooLong: 'Tabrik juda uzun. 1000 belgidan oshmasligi kerak.',
    notText: "Iltimos, tabrikni matn ko'rinishida yuboring.",
    duplicate: "Siz avval ham tabrik yuborgansiz.\n\nYana bitta tabrik qo'shmoqchimisiz?",
    cancelled: '❌ Tabrik bekor qilindi.',
    expired: "Bu tug'ilgan kun uchun tabrik yig'ish yopilgan.",
    disabled: "Hozircha anonim tabriklar yig'ish o'chirilgan.",
    employeeMissing: 'Kechirasiz, bu xodim topilmadi.',
    startBlurb: (firstName: string): string =>
      `✍️ ${firstName} uchun anonim tabrik yozishni boshlaymiz.`,
  },

  group: {
    reminder: (fullNameHtml: string, positionHtml?: string): string => {
      const who = positionHtml ? `${positionHtml} ${fullNameHtml}` : fullNameHtml;
      return (
        `🎉 Ertaga jamoamiz a'zosi <b>${who}</b>ning tug'ilgan kuni!\n\n` +
        'Keling, unga samimiy tabriklar yozamiz.\n\n' +
        "Tabriklar anonim tarzda yig'iladi va ertaga guruhga e'lon qilinadi."
      );
    },
    reminderButton: '✍️ Tabrik yozish',

    announcement: (fullNameHtml: string, positionHtml?: string): string => {
      const who = positionHtml ? `${positionHtml} ${fullNameHtml}` : fullNameHtml;
      return (
        `🎂 Bugun jamoamiz a'zosi <b>${who}</b>ning tug'ilgan kuni!\n\n` +
        'Sizni chin qalbdan tabriklaymiz.\n\n' +
        "Sog'liq, baxt, muvaffaqiyat va yangi yutuqlar tilaymiz. 🎈"
      );
    },

    wishReveal: (seq: number, messageHtml: string): string =>
      `💌 <b>Anonim tabrik #${seq}</b>\n\n${messageHtml}`,

    pollQuestion: 'Qaysi anonim tabrik sizga eng samimiy tuyuldi?',
    pollOption: (seq: number): string => `Tabrik #${seq}`,

    eveningSummary: (firstNameHtml: string, count: number): string =>
      `🎉 Bugungi tabriklar yakunlandi.\n\n` +
      `<b>${firstNameHtml}</b> uchun jami ${count} ta anonim tabrik yozildi.\n\n` +
      'Jamoamiz nomidan yana bir bor tabriklaymiz! 🥳',
    eveningSummaryNoWishes: (firstNameHtml: string): string =>
      `🎉 Bugun <b>${firstNameHtml}</b>ni tabrikladik.\n\n` +
      'Jamoamiz nomidan yana bir bor samimiy tabriklaymiz! 🥳',
  },

  next: {
    none: "Hozircha rejalashtirilgan tug'ilgan kunlar yo'q.",
    card: (fullNameHtml: string, dateLabel: string, daysLeft: number): string => {
      const remaining = daysLeft === 0 ? 'Bugun! 🎉' : `${daysLeft} kun`;
      return (
        `🎂 <b>Eng yaqin tug'ilgan kun:</b>\n\n` +
        `${fullNameHtml}\n\n` +
        `Sana: ${dateLabel}\n` +
        `Qolgan vaqt: ${remaining}`
      );
    },
  },

  birthdays: {
    emptyMonth: "Bu oyda tug'ilgan kunlar yo'q.",
    header: "📅 <b>Bu oy tug'ilgan kunlar:</b>\n\n",
    row: (dateLabel: string, fullNameHtml: string): string => `${dateLabel} — ${fullNameHtml}`,
  },

  admin: {
    notAdmin: "Bu bo'lim faqat administratorlar uchun.",
    panelTitle: "⚙️ <b>Admin panel</b>\n\nKerakli bo'limni tanlang:",
    menu: {
      employees: '👥 Xodimlar',
      addEmployee: "➕ Xodim qo'shish",
      upcoming: "🎂 Yaqin tug'ilgan kunlar",
      wishes: '💌 Tabriklar',
      stats: '📊 Statistika',
      settings: '⚙️ Sozlamalar',
    },

    employees: {
      title: (count: number): string => `👥 <b>Xodimlar ro'yxati</b> (${count} ta):`,
      empty: "Hozircha xodimlar yo'q. “➕ Xodim qo'shish” orqali qo'shing.",
      row: (fullName: string, dateLabel: string): string => `${fullName} — ${dateLabel}`,
      addButton: "➕ Xodim qo'shish",
      searchButton: '🔎 Qidirish',
      card: (e: {
        fullName: string;
        dateLabel: string;
        department: string;
        position: string;
        username: string;
        telegramId: string;
        statusLabel: string;
      }): string =>
        `👤 <b>${e.fullName}</b>\n\n` +
        `📅 Tug'ilgan kun: ${e.dateLabel}\n` +
        `🏢 Bo'lim: ${e.department}\n` +
        `💼 Lavozim: ${e.position}\n` +
        `📱 Username: ${e.username}\n` +
        `🆔 Telegram ID: ${e.telegramId}\n` +
        `📌 Holat: ${e.statusLabel}`,
      statusActive: '🟢 Faol',
      statusArchived: '🗄 Arxivlangan',
      statusInactive: '⚪️ Nofaol',
      btnEdit: '✏️ Tahrirlash',
      btnArchive: '🗄 Arxivlash',
      btnUnarchive: '♻️ Arxivdan chiqarish',
      btnDelete: "🗑 O'chirish",
      deleteConfirm: (fullName: string): string =>
        `⚠️ <b>${fullName}</b>ni o'chirmoqchimisiz?\n\nBu amalni ortga qaytarib bo'lmaydi va unga tegishli barcha tabriklar ham o'chiriladi.`,
      btnDeleteConfirm: "🗑 Ha, o'chirish",
      deleted: "🗑 Xodim o'chirildi.",
      archived: '🗄 Xodim arxivlandi.',
      unarchived: '♻️ Xodim arxivdan chiqarildi.',
      searchPrompt: '🔎 Qidirish uchun ism, familiya yoki username yozing:',
      searchEmpty: 'Hech narsa topilmadi.',
    },

    addEmployee: {
      intro:
        "➕ <b>Yangi xodim qo'shish</b>\n\nQadamlarni bajaring. Istalgan vaqtda /cancel yozib bekor qilishingiz mumkin.",
      askFirstName: '1/8 — Xodimning <b>ismini</b> kiriting:',
      askLastName: '2/8 — <b>Familiyasini</b> kiriting:',
      askUsername:
        "3/8 — Telegram <b>username</b>ini kiriting (masalan @ali). Bilmasangiz “yo'q” deb yozing:",
      askUserId: "4/8 — Telegram <b>user ID</b> (ixtiyoriy). Bilmasangiz “yo'q” deb yozing:",
      askBirthDate: "5/8 — <b>Tug'ilgan sanani</b> kiriting (KK.OO.YYYY, masalan 12.06.1990):",
      askDepartment: "6/8 — <b>Bo'limini</b> kiriting (ixtiyoriy — “yo'q”):",
      askPosition: "7/8 — <b>Lavozimini</b> kiriting (ixtiyoriy — “yo'q”):",
      askPhoto: "8/8 — <b>Profil rasmini</b> yuboring (ixtiyoriy — “yo'q” deb yozing):",
      invalidDate:
        "❗️ Sana noto'g'ri. Iltimos, KK.OO.YYYY ko'rinishida kiriting (masalan 12.06.1990):",
      invalidUserId:
        "❗️ Telegram ID faqat raqamlardan iborat bo'lishi kerak. Qayta kiriting yoki “yo'q” deb yozing:",
      invalidName: '❗️ Iltimos, matn kiriting:',
      notPhoto: "❗️ Iltimos, rasm yuboring yoki “yo'q” deb yozing:",
      review: (summary: string): string => `📋 <b>Tekshiring:</b>\n\n${summary}\n\nSaqlaymizmi?`,
      saved: (fullName: string): string => `✅ Xodim qo'shildi: <b>${fullName}</b>`,
      btnSave: '✅ Saqlash',
    },

    editEmployee: {
      title: (fullName: string): string =>
        `✏️ <b>${fullName}</b> — tahrirlash\n\nQaysi maydonni o'zgartiramiz?`,
      fields: {
        firstName: 'Ism',
        lastName: 'Familiya',
        username: 'Username',
        userId: 'Telegram ID',
        birthDate: "Tug'ilgan sana",
        department: "Bo'lim",
        position: 'Lavozim',
        photo: 'Rasm',
        status: 'Faollik',
      },
      askValue: (fieldLabel: string): string =>
        `✏️ Yangi qiymatni kiriting — <b>${fieldLabel}</b>:`,
      askPhoto: "✏️ Yangi rasmni yuboring (yoki “yo'q” deb yozib rasmni olib tashlang):",
      updated: "✅ Ma'lumot yangilandi.",
      toggledActive: '✅ Holat yangilandi.',
    },

    upcoming: {
      title: "🎂 <b>Yaqin tug'ilgan kunlar</b>",
      empty: "Yaqin 60 kun ichida tug'ilgan kunlar yo'q.",
      row: (dateLabel: string, fullName: string, daysLeft: number): string => {
        const remaining = daysLeft === 0 ? 'bugun' : `${daysLeft} kun`;
        return `${dateLabel} — ${fullName} (${remaining})`;
      },
      manualHeader: "\n\n<i>Qo'lda ishga tushirish:</i>",
      btnTriggerReminder: '▶️ Ertangi eslatma',
      btnTriggerAnnouncement: "▶️ Bugungi e'lon",
      btnTriggerPublish: '▶️ Tabriklarni chiqarish',
      btnTriggerEvening: '▶️ Kechki yakun',
    },

    wishesMod: {
      title: '💌 <b>Tabriklar (moderatsiya)</b>',
      employeesHeader: "Tabriklar yig'ilayotgan xodimlar:",
      empty: "Hozircha tabriklar yo'q.",
      employeeRow: (fullName: string, pending: number, total: number): string =>
        `${fullName} — ${total} ta (kutilmoqda: ${pending})`,
      wishCard: (data: {
        fullName: string;
        sender: string;
        statusLabel: string;
        publishedLabel: string;
        message: string;
      }): string =>
        `💌 <b>Tabrik</b> <i>(faqat admin uchun)</i>\n` +
        `👤 Xodim: ${data.fullName}\n` +
        `✍️ Yuborgan: ${data.sender}\n` +
        `📌 Holat: ${data.statusLabel}\n` +
        `📢 E'lon: ${data.publishedLabel}\n\n` +
        `${data.message}`,
      noWishesForEmployee: "Bu xodim uchun tabriklar yo'q.",
      statusPending: '⏳ Kutilmoqda',
      statusApproved: '✅ Tasdiqlangan',
      statusRejected: '❌ Rad etilgan',
      publishedYes: 'ha',
      publishedNo: "yo'q",
      btnApprove: '✅ Tasdiqlash',
      btnReject: '❌ Rad etish',
      btnDelete: "🗑 O'chirish",
      btnPublish: "📢 E'lon qilish",
      approved: '✅ Tabrik tasdiqlandi.',
      rejected: '❌ Tabrik rad etildi.',
      deleted: "🗑 Tabrik o'chirildi.",
      published: "📢 Tabrik guruhga e'lon qilindi.",
      alreadyPublished: "Bu tabrik allaqachon e'lon qilingan.",
      publishNoGroup: '❗️ Avval guruh ID sozlamalardan belgilanishi kerak.',
    },

    stats: {
      title: '📊 <b>Statistika</b>',
      body: (s: {
        totalEmployees: number;
        birthdaysThisMonth: number;
        wishesTotal: number;
        wishesPublished: number;
        participationRate: number;
      }): string =>
        `👥 Jami xodimlar: <b>${s.totalEmployees}</b>\n` +
        `🎂 Bu oygi tug'ilgan kunlar: <b>${s.birthdaysThisMonth}</b>\n` +
        `💌 Yig'ilgan tabriklar: <b>${s.wishesTotal}</b>\n` +
        `📢 E'lon qilingan: <b>${s.wishesPublished}</b>\n` +
        `📈 Faollik darajasi: <b>${s.participationRate}%</b>`,
    },

    settings: {
      title: '⚙️ <b>Sozlamalar</b>',
      body: (s: {
        groupChatId: string;
        reminderTime: string;
        morningBirthdayTime: string;
        publishIntervalMinutes: number;
        eveningSummaryTime: string;
        timezone: string;
        anonymousWishes: string;
        requireApproval: string;
      }): string =>
        `🏢 Guruh ID: <code>${s.groupChatId}</code>\n` +
        `⏰ Eslatma vaqti: <b>${s.reminderTime}</b>\n` +
        `🌅 Ertalabki tabrik: <b>${s.morningBirthdayTime}</b>\n` +
        `⏳ E'lon oralig'i: <b>${s.publishIntervalMinutes}</b> daqiqa\n` +
        `🌆 Kechki yakun: <b>${s.eveningSummaryTime}</b>\n` +
        `🌍 Vaqt mintaqasi: <b>${s.timezone}</b>\n` +
        `💌 Anonim tabriklar: <b>${s.anonymousWishes}</b>\n` +
        `✅ Tasdiqlash talab: <b>${s.requireApproval}</b>`,
      btnGroup: '🏢 Guruh ID',
      btnReminder: '⏰ Eslatma vaqti',
      btnMorning: '🌅 Ertalabki tabrik',
      btnInterval: "⏳ E'lon oralig'i",
      btnEvening: '🌆 Kechki yakun',
      btnTimezone: '🌍 Vaqt mintaqasi',
      btnToggleWishes: "💌 Anonim tabriklar (yoqish/o'chirish)",
      btnToggleApproval: '✅ Tasdiqlashni almashtirish',
      askGroup:
        "🏢 Guruh chat ID sini yuboring (masalan -1001234567890).\n\nMaslahat: botni guruhga qo'shing va u yerdagi istalgan xabarni botga forward qiling — ID avtomatik aniqlanadi.",
      askReminder: '⏰ Eslatma vaqtini kiriting (HH:MM, masalan 10:00):',
      askMorning: '🌅 Ertalabki tabrik vaqtini kiriting (HH:MM, masalan 09:00):',
      askInterval: "⏳ E'lon oralig'ini daqiqalarda kiriting (masalan 90):",
      askEvening: '🌆 Kechki yakun vaqtini kiriting (HH:MM, masalan 20:00):',
      askTimezone: '🌍 Vaqt mintaqasini kiriting (masalan Asia/Tashkent):',
      invalidTime: "❗️ Vaqt formati noto'g'ri. HH:MM ko'rinishida kiriting (masalan 09:30):",
      invalidInterval: '❗️ Iltimos, 1 dan 1440 gacha butun son kiriting:',
      invalidTimezone: "❗️ Noto'g'ri vaqt mintaqasi. Masalan: Asia/Tashkent",
      invalidGroup: "❗️ Guruh ID butun son bo'lishi kerak (masalan -1001234567890):",
      updated: '✅ Sozlama yangilandi.',
      groupDetected: (id: string): string => `✅ Guruh aniqlandi: <code>${id}</code>`,
    },

    preview: {
      title: '👀 <b>Xabarlar namunasi</b>',
      note: "\n\n<i>Quyida guruhga yuboriladigan xabarlar ko'rinishi keltirilgan (namunaviy ma'lumotlar bilan).</i>",
      reminderLabel: '\n\n— — — <b>Eslatma</b> — — —\n',
      announcementLabel: "\n\n— — — <b>Tug'ilgan kun e'loni</b> — — —\n",
      wishLabel: '\n\n— — — <b>Anonim tabrik</b> — — —\n',
      summaryLabel: '\n\n— — — <b>Kechki yakun</b> — — —\n',
      sampleName: 'Ali Valiyev',
      sampleFirst: 'Ali',
      sampleWish: "Tug'ilgan kuning muborak bo'lsin! Hamisha kulib yur, omad seni tark etmasin.",
    },

    triggers: {
      reminderDone: (count: number): string => `✅ Eslatma yuborildi (${count} ta xodim).`,
      announcementDone: (count: number): string =>
        `✅ Tug'ilgan kun e'lonlari yuborildi (${count} ta).`,
      publishDone: (count: number): string => `✅ ${count} ta tabrik e'lon qilindi.`,
      eveningDone: (count: number): string => `✅ Kechki yakun yuborildi (${count} ta).`,
      nothingDone: 'ℹ️ Yangi hech narsa yuborilmadi.',
      noGroup: '❗️ Guruh ID belgilanmagan. Sozlamalardan belgilang.',
    },
  },
} as const;

export type Localization = typeof uz;
