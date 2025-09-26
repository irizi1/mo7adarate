// commands/setup-handler.js - الإصدار المدمج والنهائي

const { SIGNATURE } = require('../config.js');
const state = require('../state.js');
const db = require('../database.js');
const { checkPermission, requireGroup } = require('../utils.js');

// =================================================================
// Handler الرئيسي لبدء عملية الإعداد
// =================================================================

async function handleSetupCommand(message, client) {
    try {
        if (!(await requireGroup(message))) return;
        if (!(await checkPermission(message, client, 'admin'))) return;

        const authorId = message.author || message.from;
        
        await message.react('⚙️');
        const contact = await message.getContact();
        const senderName = contact.pushname || "المشرف";
        
        const replyText = `
⚙️ *إعداد النظام الشامل*

مرحباً ${senderName}! 🙋‍♂️
هذه العملية ستقوم بإعداد شعبة دراسية جديدة بكل تفاصيلها.

يرجى اختيار الإجراء الذي تريد القيام به:

1. عرض الشعب الموجودة حالياً
2. إضافة شعبة جديدة (يبدأ عملية الإعداد)

💡 أرسل رقم الخيار أو *إلغاء* للخروج في أي وقت.${SIGNATURE}`;
        
        await message.reply(replyText);
        state.userState.set(authorId, { 
            step: 'setup_select_action', 
            timestamp: Date.now(),
        });
    } catch (error) {
        console.error('[❌] Error in setup command:', error);
        await message.reply(`⚠️ حدث خطأ غير متوقع.${SIGNATURE}`);
    }
}

// =================================================================
// دوال معالجة خطوات الإعداد (سيتم استدعاؤها من state-handler.js)
// =================================================================

async function handleSetupSelectAction(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const choice = message.body.trim();

    if (choice === '1') {
        const sectionsArray = Array.from(state.sections.values());
        if (sectionsArray.length === 0) {
            await message.reply(`ℹ️ لا توجد أي شعب مضافة حالياً.${SIGNATURE}`);
        } else {
            let list = '📋 *الشعب المسجلة حالياً:*\n\n';
            sectionsArray.forEach(section => {
                list += `- ${section.name}\n`;
            });
            await message.reply(list + SIGNATURE);
        }
        state.userState.delete(authorId);

    } else if (choice === '2') {
        await message.reply(`✅ حسنًا، لنبدأ بإضافة شعبة جديدة.\n\n📝 *ما هو اسم الشعبة؟* (مثال: شعبة القانون)`);
        userState.step = 'setup_get_section_name';
        userState.setupData = { sectionName: '', classes: [] };
    } else {
        await message.reply(`⚠️ خيار غير صالح. يرجى إرسال 1 أو 2.${SIGNATURE}`);
    }
}

async function handleSetupGetSectionName(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const sectionName = message.body.trim();

    if (!sectionName || sectionName.length < 3) {
        return message.reply(`⚠️ اسم الشعبة قصير جداً. يرجى إدخال اسم صحيح.`);
    }

    userState.setupData.sectionName = sectionName;
    userState.step = 'setup_get_class_name';
    await message.reply(`👍 تم تحديد اسم الشعبة: *${sectionName}*\n\n🏫 *الآن، ما هو اسم الفصل الأول؟* (مثال: S1 أو الفصل الأول)`);
    userState.currentClassIndex = 0;
    userState.setupData.classes[0] = { className: '', subjects: [], groups: [] };
}

async function handleSetupGetClassName(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const className = message.body.trim();

    if (!className || className.length < 2) {
        return message.reply(`⚠️ اسم الفصل قصير جداً.`);
    }
    
    userState.setupData.classes[userState.currentClassIndex].className = className;
    userState.step = 'setup_get_subjects_for_class';
    await message.reply(`📚 تم تحديد اسم الفصل: *${className}*\n\n*الآن، أدخل أسماء المواد لهذا الفصل، مفصولة بفاصلة (,)*\nمثال: قانون جنائي, مسطرة مدنية, قانون تجاري`);
}

async function handleSetupGetSubjects(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const subjects = message.body.split(',').map(s => s.trim()).filter(Boolean);

    if (subjects.length === 0) {
        return message.reply('⚠️ لم يتم إدخال أي مواد. يرجى إدخال أسماء المواد مفصولة بفاصلة.');
    }
    
    userState.setupData.classes[userState.currentClassIndex].subjects = subjects;
    userState.step = 'setup_get_groups_and_profs';
    await message.reply(`👍 تم إضافة ${subjects.length} مواد.\n\n*الآن، أدخل الأفواج والأساتذة لهذا الفصل بالصيغة التالية (كل فوج في سطر):*\n*اسم الفوج 1 : اسم الأستاذ 1*\n*اسم الفوج 2 : اسم الأستاذ 2*`);
}

async function handleSetupGetGroupsAndProfs(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const lines = message.body.split('\n').filter(Boolean);
    const groups = [];

    for (const line of lines) {
        const parts = line.split(':');
        if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
            groups.push({ groupName: parts[0].trim(), professorName: parts[1].trim() });
        }
    }

    if (groups.length === 0) {
        return message.reply(`⚠️ لم يتم إدخال الأفواج بالصيغة الصحيحة. يرجى استخدام الصيغة:\nاسم الفوج : اسم الأستاذ`);
    }

    userState.setupData.classes[userState.currentClassIndex].groups = groups;
    userState.step = 'setup_ask_for_another_class';
    await message.reply(`✅ تم إعداد الفصل "${userState.setupData.classes[userState.currentClassIndex].className}" بنجاح.\n\n*هل تريد إضافة فصل آخر لهذه الشعبة؟*\n1. نعم\n2. لا، قم بالحفظ والإنهاء`);
}

async function handleAskForAnotherClass(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const choice = message.body.trim();

    if (choice === '1') {
        userState.currentClassIndex++;
        userState.setupData.classes[userState.currentClassIndex] = { className: '', subjects: [], groups: [] };
        userState.step = 'setup_get_class_name';
        await message.reply(`🏫 *ننتقل للفصل التالي. ما هو اسم الفصل رقم ${userState.currentClassIndex + 1}؟*`);
    } else if (choice === '2') {
        userState.step = 'setup_confirm_and_save';
        let summary = `🎉 *اكتمل الإعداد! يرجى مراجعة البيانات:*\n\n*الشعبة:* ${userState.setupData.sectionName}\n\n`;
        userState.setupData.classes.forEach((classData, index) => {
            summary += `*الفصل ${index + 1}: ${classData.className}*\n  - المواد: ${classData.subjects.join(', ')}\n  - الأفواج والأساتذة:\n`;
            classData.groups.forEach(g => {
                summary += `    • ${g.groupName} (الأستاذ: ${g.professorName})\n`;
            });
            summary += `\n`;
        });
        summary += `*هل البيانات صحيحة؟*\nأرسل "نعم" للحفظ أو "إلغاء" للتجاهل.${SIGNATURE}`;
        await message.reply(summary);
    } else {
        await message.reply(`⚠️ خيار غير صالح. يرجى إرسال 1 أو 2.`);
    }
}

async function handleSetupConfirmAndSave(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);

    if (message.body.trim().toLowerCase() === 'نعم') {
        try {
            await message.reply(`🔄 جاري حفظ البيانات، يرجى الانتظار...`);
            await db.saveSectionSetup(userState.setupData);
            await db.loadCoursesData();
            await message.reply(`✅ تم حفظ الشعبة "${userState.setupData.sectionName}" وكل تفاصيلها بنجاح!${SIGNATURE}`);
        } catch (error) {
            console.error('[❌] Error saving setup data:', error);
            await message.reply(`⚠️ حدث خطأ فادح أثناء الحفظ: ${error.message}${SIGNATURE}`);
        }
    } else {
        await message.reply(`تم إلغاء العملية. لم يتم حفظ أي بيانات.${SIGNATURE}`);
    }
    state.userState.delete(authorId);
}

// --- تصدير كل شيء ---
module.exports = {
    '!إعداد': handleSetupCommand,
    '!setup': handleSetupCommand,
    handleSetupSelectAction,
    handleSetupGetSectionName,
    handleSetupGetClassName,
    handleSetupGetSubjects,
    handleSetupGetGroupsAndProfs,
    handleAskForAnotherClass,
    handleSetupConfirmAndSave,
};