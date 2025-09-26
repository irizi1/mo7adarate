// commands/lecture-commands.js

const { isAdmin } = require('../utils');
const { SIGNATURE } = require('../config');
const state = require('../state');
const { addLecture } = require('../utils');
const db = require('../database');

/**
 * @description يبدأ عملية إضافة محاضرة جديدة.
 * @param {Message} message - كائن الرسالة من whatsapp-web.js.
 * @param {Client} client - كائن عميل whatsapp-web.js.
 */
async function handleAddLectureCommand(message, client) {
    const chat = await message.getChat();
    if (!chat.isGroup) {
        await message.reply(`⚠️ هذا الأمر يعمل في المجموعات فقط!${SIGNATURE}`);
        return;
    }

    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    
    if (!(await isAdmin(client, authorId, chat.id._serialized))) {
        await message.reply(`⚠️ هذا الأمر متاح للمشرفين فقط!${SIGNATURE}`);
        return;
    }
    
    await message.react('📚');
    const senderName = contact.pushname || "المشرف";
    
    // التحقق من وجود شعب
    if (state.sections.size === 0) {
        await message.reply(`⚠️ لا توجد شعب مضافة بعد. يرجى إضافة شعبة أولاً.${SIGNATURE}`);
        return;
    }
    
    const replyText = `
📚 *إضافة محاضرة جديدة*

مرحباً ${senderName}! 🙋‍♂️
سأقوم بتوجيهك خطوة بخطوة لإضافة محاضرة جديدة.

يرجى اختيار الشعبة:
`;

    let list = '';
    let index = 1;
    for (const [id, name] of state.sections) {
        list += `${index}. ${name}\n`;
        index++;
    }

    await message.reply(replyText + list + `\n💡 أرسل رقم الشعبة أو *إلغاء* للخروج.${SIGNATURE}`);
    
    state.userState.set(authorId, { 
        step: 'add_lecture_select_section', 
        timestamp: Date.now(),
        lectureData: {}
    });
}

/**
 * @description يعرض قائمة المحاضرات المتاحة.
 * @param {Message} message - كائن الرسالة من whatsapp-web.js.
 * @param {Client} client - كائن عميل whatsapp-web.js.
 */
async function handleListLecturesCommand(message, client) {
    const chat = await message.getChat();
    if (!chat.isGroup) {
        await message.reply(`⚠️ هذا الأمر يعمل في المجموعات فقط!${SIGNATURE}`);
        return;
    }

    await message.react('📋');
    
    try {
        const lectures = await db.getAllLectures();
        
        if (lectures.length === 0) {
            await message.reply(`⚠️ لا توجد محاضرات مضافة بعد.${SIGNATURE}`);
            return;
        }
        
        let list = `📋 *قائمة المحاضرات*\n\n`;
        lectures.forEach((lecture, index) => {
            const date = lecture.created_at ? 
                new Date(lecture.created_at).toLocaleDateString('ar-EG') : 
                'غير محدد';
            list += `${index + 1}. ${lecture.section_name || 'غير محدد'} - ${lecture.class_name || 'غير محدد'}\n`;
            list += `   المادة: ${lecture.subject_name || 'غير محدد'}\n`;
            list += `   المحاضرة: ${lecture.lecture_number || 'غير محدد'}\n`;
            list += `   الأستاذ: ${lecture.professor_name || 'غير محدد'}\n`;
            list += `   التاريخ: ${date}\n\n`;
        });
        
        await message.reply(list + SIGNATURE);
    } catch (error) {
        console.error('[❌] Error listing lectures:', error);
        await message.reply(`⚠️ حدث خطأ أثناء جلب قائمة المحاضرات.${SIGNATURE}`);
    }
}

/**
 * @description ينشئ جدول المحاضرات كملف PDF.
 * @param {Message} message - كائن الرسالة من whatsapp-web.js.
 * @param {Client} client - كائن عميل whatsapp-web.js.
 */
async function handleLecturesTableCommand(message, client) {
    const chat = await message.getChat();
    if (!chat.isGroup) {
        await message.reply(`⚠️ هذا الأمر يعمل في المجموعات فقط!${SIGNATURE}`);
        return;
    }

    await message.react('📊');
    await message.reply(`🔄 *جاري إنشاء جدول المحاضرات...*`);

    try {
        const lectures = await db.getAllLectures();
        
        if (lectures.length === 0) {
            await message.reply(`⚠️ لا توجد محاضرات لإنشاء جدول لها.${SIGNATURE}`);
            return;
        }
        
        // التحقق من وجود بيانات صالحة
        const validLectures = lectures.filter(lecture => 
            lecture.section_name && 
            lecture.class_name && 
            lecture.subject_name && 
            lecture.lecture_number && 
            lecture.professor_name
        );
        
        if (validLectures.length === 0) {
            await message.reply(`⚠️ لا توجد بيانات صالحة لإنشاء جدول المحاضرات.${SIGNATURE}`);
            return;
        }
        
        const { generateLecturesTablePDF } = require('../utils');
        const media = await generateLecturesTablePDF(validLectures);
        
        await client.sendMessage(chat.id._serialized, media, {
            caption: `📊 *جدول المحاضرات*\n\nتم إنشاء الجدول بنجاح.${SIGNATURE}`
        });
    } catch (error) {
        console.error('[❌] Error generating lectures table:', error);
        await message.reply(`⚠️ حدث خطأ أثناء إنشاء جدول المحاضرات: ${error.message}${SIGNATURE}`);
    }
}

module.exports = {
    '!اضافة_محاضرة': handleAddLectureCommand,
    '!add_lecture': handleAddLectureCommand,
    '!قائمة_المحاضرات': handleListLecturesCommand,
    '!list_lectures': handleListLecturesCommand,
    '!جدول_المحاضرات': handleLecturesTableCommand,
    '!lectures_table': handleLecturesTableCommand,
};