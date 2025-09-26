// commands/add-lecture-commands.js - الإصدار المحدث مع إضافة اختيار الأستاذ

const { checkPermission, requireGroup } = require('../utils.js');
const { SIGNATURE, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO } = require('../config.js');
const state = require('../state.js');
const db = require('../database.js');
const { Octokit } = require("@octokit/rest");

let octokit;
if (GITHUB_TOKEN && GITHUB_OWNER && GITHUB_REPO) {
    octokit = new Octokit({ auth: GITHUB_TOKEN });
}

async function handleAddLectureCommand(message, client) {
    if (!(await requireGroup(message))) return;
    if (!(await checkPermission(message, client, 'admin'))) return;

    const authorId = message.author || message.from;

    if (state.sections.size === 0) {
        return message.reply(`⚠️ لا توجد شعب مضافة بعد. يرجى استخدام !إعداد أولاً.${SIGNATURE}`);
    }

    let list = '📚 *إضافة محاضرة جديدة*\n\nيرجى اختيار الشعبة:\n\n';
    Array.from(state.sections.values()).forEach((section, i) => {
        list += `${i + 1}. ${section.name}\n`;
    });
    list += `\n💡 أرسل رقم الخيار أو *إلغاء*.`;

    await message.reply(list);
    state.userState.set(authorId, {
        step: 'add_lecture_select_section',
        timestamp: Date.now(),
        lectureData: {}
    });
}

async function handleSelectSection(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const choice = parseInt(message.body.trim());
    const sectionsArray = Array.from(state.sections.values());

    if (isNaN(choice) || choice < 1 || choice > sectionsArray.length) {
        return message.reply('⚠️ رقم غير صالح. يرجى اختيار رقم من القائمة.');
    }

    const selectedSection = sectionsArray[choice - 1];
    userState.lectureData.sectionId = selectedSection.id;
    userState.lectureData.sectionName = selectedSection.name;

    const classesInSection = Array.from(state.classes.values()).filter(c => c.section_id === selectedSection.id);
    if (classesInSection.length === 0) {
        state.userState.delete(authorId);
        return message.reply(`⚠️ لا توجد فصول مضافة لهذه الشعبة.${SIGNATURE}`);
    }

    let list = '🏫 *اختر الفصل:*\n\n';
    classesInSection.forEach((cls, i) => list += `${i + 1}. ${cls.name}\n`);
    await message.reply(list);

    userState.step = 'add_lecture_select_class';
    userState.tempData = classesInSection;
}

async function handleSelectClass(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const choice = parseInt(message.body.trim());
    const classesArray = userState.tempData;

    if (isNaN(choice) || choice < 1 || choice > classesArray.length) {
        return message.reply('⚠️ رقم غير صالح. يرجى اختيار رقم من القائمة.');
    }

    const selectedClass = classesArray[choice - 1];
    userState.lectureData.classId = selectedClass.id;
    userState.lectureData.className = selectedClass.name;

    const subjectsInClass = Array.from(state.subjects.values()).filter(s => s.class_id === selectedClass.id);
     if (subjectsInClass.length === 0) {
        state.userState.delete(authorId);
        return message.reply(`⚠️ لا توجد مواد مضافة لهذا الفصل.${SIGNATURE}`);
    }
    
    let list = '📖 *اختر المادة:*\n\n';
    subjectsInClass.forEach((sub, i) => list += `${i + 1}. ${sub.name}\n`);
    await message.reply(list);

    userState.step = 'add_lecture_select_subject';
    userState.tempData = subjectsInClass;
}

async function handleSelectSubject(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const choice = parseInt(message.body.trim());
    const subjectsArray = userState.tempData;

    if (isNaN(choice) || choice < 1 || choice > subjectsArray.length) {
        return message.reply('⚠️ رقم غير صالح. يرجى اختيار رقم من القائمة.');
    }

    const selectedSubject = subjectsArray[choice - 1];
    userState.lectureData.subjectId = selectedSubject.id;
    userState.lectureData.subjectName = selectedSubject.name;

    const groupsInClass = Array.from(state.groupsData.values()).filter(g => g.class_id === userState.lectureData.classId);
    if (groupsInClass.length === 0) {
        state.userState.delete(authorId);
        return message.reply(`⚠️ لا توجد أفواج مضافة لهذا الفصل.${SIGNATURE}`);
    }

    let list = '👥 *اختر الفوج:*\n\n';
    groupsInClass.forEach((group, i) => list += `${i + 1}. ${group.name}\n`);
    await message.reply(list);
    
    userState.step = 'add_lecture_select_group';
    userState.tempData = groupsInClass;
}

async function handleSelectGroup(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const choice = parseInt(message.body.trim());
    const groupsArray = userState.tempData;

    if (isNaN(choice) || choice < 1 || choice > groupsArray.length) {
        return message.reply('⚠️ رقم غير صالح. يرجى اختيار رقم من القائمة.');
    }

    const selectedGroup = groupsArray[choice - 1];
    userState.lectureData.groupName = selectedGroup.name;

    const professorsArray = Array.from(state.professors.values());
     if (professorsArray.length === 0) {
        state.userState.delete(authorId);
        return message.reply(`⚠️ لا يوجد أساتذة مضافون للنظام.${SIGNATURE}`);
    }

    let list = '👨‍🏫 *اختر الأستاذ:*\n\n';
    professorsArray.forEach((prof, i) => list += `${i + 1}. ${prof.name}\n`);
    await message.reply(list);
    
    userState.step = 'add_lecture_select_professor';
    userState.tempData = professorsArray;
}

async function handleSelectProfessor(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const choice = parseInt(message.body.trim());
    const professorsArray = userState.tempData;

    if (isNaN(choice) || choice < 1 || choice > professorsArray.length) {
        return message.reply('⚠️ رقم غير صالح. يرجى اختيار رقم من القائمة.');
    }

    const selectedProfessor = professorsArray[choice - 1];
    userState.lectureData.professorId = selectedProfessor.id;

    await message.reply(`📝 *ما هو عنوان أو رقم هذه المحاضرة؟*\n(مثال: المحاضرة الأولى، أو مقدمة في القانون)`);
    userState.step = 'add_lecture_get_details';
}

async function handleGetLectureDetails(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);
    const details = message.body.trim();

    if (!details) {
        return message.reply('⚠️ يرجى إدخال عنوان أو رقم للمحاضرة.');
    }

    userState.lectureData.lectureDetails = details;
    
    await message.reply(`✅ ممتاز. الآن، يرجى إرسال ملف المحاضرة (PDF).`);
    userState.step = 'add_lecture_upload_file';
}

async function handleUploadFile(message) {
    const authorId = message.author || message.from;
    const userState = state.userState.get(authorId);

    if (!message.hasMedia || message.type !== 'document') {
        return message.reply(`⚠️ يرجى إرسال ملف بصيغة PDF.`);
    }
    
    const media = await message.downloadMedia();
    if (!media || !media.mimetype.includes('pdf')) {
        return message.reply(`⚠️ فشل تحميل الملف أو أن الملف ليس بصيغة PDF. يرجى المحاولة مرة أخرى.`);
    }

    if (!octokit) {
        state.userState.delete(authorId);
        return message.reply(`⚠️ لا يمكن رفع الملف. إعدادات GitHub غير مكتملة. يرجى مراجعة المالك.`);
    }

    await message.react('🔄');

    const { sectionName, className, subjectName, lectureDetails, groupName, subjectId, professorId } = userState.lectureData;
    const sanitizedDetails = lectureDetails.replace(/[/\\?%*:|"<>]/g, '-');
    
    const filePath = `lectures/${sectionName}/${className}/${subjectName}/${sanitizedDetails} - ${groupName}.pdf`;

    try {
        await octokit.repos.createOrUpdateFileContents({
            owner: GITHUB_OWNER,
            repo: GITHUB_REPO,
            path: filePath,
            message: `BOT: Add lecture - ${filePath}`,
            content: media.data,
            branch: 'main'
        });

        const downloadUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}@main/${encodeURI(filePath)}`;
        
        await db.query(
            'INSERT INTO lectures (file_name, file_url, subject_id, professor_id, uploader_id, upload_date) VALUES ($1, $2, $3, $4, $5, NOW())',
            [filePath, downloadUrl, subjectId, professorId, authorId]
        );

        await message.reply(`✅ تمت إضافة المحاضرة ورفعها بنجاح!${SIGNATURE}`);

    } catch (error) {
        console.error('[❌] Error uploading to GitHub or saving to DB:', error);
        await message.reply(`⚠️ حدث خطأ فادح أثناء الرفع أو الحفظ. تأكد من صحة إعدادات GitHub وأن عمود professor_id موجود في جدول lectures.`);
    } finally {
        state.userState.delete(authorId);
    }
}

module.exports = {
    '!اضافة_محاضرة': handleAddLectureCommand,
    '!add_lecture': handleAddLectureCommand,
    handleSelectSection,
    handleSelectClass,
    handleSelectSubject,
    handleSelectGroup,
    handleSelectProfessor,
    handleGetLectureDetails,
    handleUploadFile,
};