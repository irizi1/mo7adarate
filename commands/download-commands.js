// commands/download-commands.js - الإصدار المحدث لإرسال الملفات مباشرة

const { MessageMedia } = require('whatsapp-web.js');
const axios = require('axios');
const state = require('../state.js');
const { SIGNATURE } = require('../config.js');
const db = require('../database.js');

async function handleViewLecturesCommand(message, client) {
    if (state.sections.size === 0) {
        return message.reply(`⚠️ لا توجد شعب مضافة بعد. يرجى استخدام !إعداد أولاً.${SIGNATURE}`);
    }

    let list = '📚 *عرض وتحميل المحاضرات*\n\nيرجى اختيار الشعبة:\n\n';
    Array.from(state.sections.values()).forEach((section, i) => {
        list += `${i + 1}. ${section.name}\n`;
    });
    list += `\n💡 أرسل رقم الخيار أو *إلغاء*.`;

    await message.reply(list);
    state.userState.set(message.author || message.from, {
        step: 'view_lectures_select_section',
        timestamp: Date.now()
    });
}

// --- دوال الخطوات (سيتم استدعاؤها من state-handler.js) ---

async function handleViewLecturesSelectSection(message, client) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const choice = parseInt(message.body.trim());
    const sectionsArray = Array.from(state.sections.values());

    if (isNaN(choice) || choice < 1 || choice > sectionsArray.length) {
        return message.reply('⚠️ رقم غير صالح. يرجى اختيار رقم من القائمة.');
    }

    const selectedSection = sectionsArray[choice - 1];
    userState.sectionId = selectedSection.id;
    userState.sectionName = selectedSection.name;

    const classesInSection = Array.from(state.classes.values()).filter(c => c.section_id === selectedSection.id);
    if (classesInSection.length === 0) {
        state.userState.delete(authorId);
        return message.reply(`⚠️ لا توجد فصول مضافة لهذه الشعبة.${SIGNATURE}`);
    }

    let list = `🏫 *اختر الفصل في شعبة "${selectedSection.name}":*\n\n`;
    classesInSection.forEach((cls, i) => list += `${i + 1}. ${cls.name}\n`);
    await message.reply(list);

    userState.step = 'view_lectures_select_class';
    userState.classes = classesInSection;
}

async function handleViewLecturesSelectClass(message, client) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const choice = parseInt(message.body.trim());
    const classesArray = userState.classes;

    if (isNaN(choice) || choice < 1 || choice > classesArray.length) {
        return message.reply('⚠️ رقم غير صالح. يرجى اختيار رقم من القائمة.');
    }

    const selectedClass = classesArray[choice - 1];
    userState.classId = selectedClass.id;
    userState.className = selectedClass.name;

    const subjectsInClass = Array.from(state.subjects.values()).filter(s => s.class_id === selectedClass.id);
    if (subjectsInClass.length === 0) {
        state.userState.delete(authorId);
        return message.reply(`⚠️ لا توجد مواد مضافة لهذا الفصل.${SIGNATURE}`);
    }

    let list = `📖 *اختر المادة في الفصل "${selectedClass.name}":*\n\n`;
    subjectsInClass.forEach((sub, i) => list += `${i + 1}. ${sub.name}\n`);
    await message.reply(list);

    userState.step = 'view_lectures_request_lecture';
    userState.subjects = subjectsInClass;
}

async function handleRequestLecture(message, client) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const choice = parseInt(message.body.trim());
    const subjectsArray = userState.subjects;

    if (isNaN(choice) || choice < 1 || choice > subjectsArray.length) {
        return message.reply('⚠️ رقم غير صالح. يرجى اختيار رقم من القائمة.');
    }

    const selectedSubject = subjectsArray[choice - 1];
    
    try {
        const result = await db.query('SELECT * FROM lectures WHERE subject_id = $1 ORDER BY upload_date DESC', [selectedSubject.id]);
        
        if (result.rows.length === 0) {
            state.userState.delete(authorId);
            return message.reply(`⚠️ لا توجد محاضرات متاحة لمادة "${selectedSubject.name}".${SIGNATURE}`);
        }

        let list = `📝 *المحاضرات المتاحة لمادة "${selectedSubject.name}":*\n\n`;
        result.rows.forEach((lecture, index) => {
            const date = new Date(lecture.upload_date).toLocaleDateString('ar-SA');
            // استخراج اسم الملف فقط من المسار الكامل
            const simpleFileName = lecture.file_name.split('/').pop();
            list += `${index + 1}. ${simpleFileName} (${date})\n`;
        });
        list += `\n💡 أرسل رقم المحاضرة التي تريد تحميلها أو *إلغاء* للخروج.`;

        await message.reply(list);
        userState.step = 'view_lectures_download';
        userState.lectures = result.rows;
    } catch (error) {
        console.error('[❌] Error fetching lectures:', error);
        state.userState.delete(authorId);
        await message.reply(`⚠️ حدث خطأ أثناء جلب المحاضرات. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
    }
}

async function handleDownloadLecture(message, client) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const choice = parseInt(message.body.trim());
    const lecturesArray = userState.lectures;

    if (isNaN(choice) || choice < 1 || choice > lecturesArray.length) {
        return message.reply('⚠️ رقم غير صالح. يرجى اختيار رقم من القائمة.');
    }

    const selectedLecture = lecturesArray[choice - 1];
    const simpleFileName = selectedLecture.file_name.split('/').pop();
    
    await message.reply(`📥 *جاري تحميل المحاضرة...*\n\n*${simpleFileName}*`);
    await message.react('📥');
    
    try {
        // --- الجزء الجديد: تحميل الملف وإرساله ---
        const response = await axios.get(selectedLecture.file_url, {
            responseType: 'arraybuffer' // مهم جداً للحصول على الملف كمحتوى ثنائي
        });
        
        const base64Data = Buffer.from(response.data, 'binary').toString('base64');
        
        const media = new MessageMedia('application/pdf', base64Data, simpleFileName);
        
        // إرسال الملف إلى المستخدم مباشرة
        await client.sendMessage(authorId, media, { caption: `✅ تفضل محاضرتك.${SIGNATURE}` });
        
    } catch (error) {
        console.error('[❌] Error downloading or sending file:', error);
        await message.reply(`⚠️ حدث خطأ أثناء تحميل وإرسال الملف. قد يكون الرابط معطلاً.${SIGNATURE}`);
    } finally {
        state.userState.delete(authorId);
    }
}

module.exports = {
    '!عرض_المحاضرات': handleViewLecturesCommand,
    '!view_lectures': handleViewLecturesCommand,
    handleViewLecturesSelectSection,
    handleViewLecturesSelectClass,
    handleRequestLecture,
    handleDownloadLecture,
};