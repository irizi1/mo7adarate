// commands/course-management.js

const state = require('../state');
const { SIGNATURE } = require('../config');
const { isAdmin } = require('../utils');
const db = require('../database');

// =================================================================
// Handler الرئيسي لبدء إدارة المقررات
// =================================================================

/**
 * @description يبدأ عملية إدارة المقررات الدراسية.
 * @param {Message} message - كائن الرسالة من whatsapp-web.js.
 * @param {Client} client - كائن عميل whatsapp-web.js.
 */
async function handleCoursesCommand(message, client) {
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
    const replyText = `
📚 *إدارة المقررات الدراسية*

مرحباً ${senderName}! 🙋‍♂️
يرجى اختيار النوع الذي تريد إدارته:

1. إدارة الشعب
2. إدارة الفصول
3. إدارة الأفواج
4. إدارة الأساتذة
5. إدارة المواد

💡 أرسل رقم الخيار أو *إلغاء* للخروج.${SIGNATURE}`;
    
    await message.reply(replyText);
    state.userState.set(authorId, { 
        step: 'select_management_type', 
        timestamp: Date.now() 
    });
}

// =================================================================
// دوال معالجة ردود المستخدم (سيتم استدعاؤها من state-handler.js)
// =================================================================

/**
 * @description يوجه المستخدم إلى قائمة الإدارة الصحيحة بناءً على اختياره.
 */
async function handleSelectManagementType(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;

    const managementMap = {
        '1': { handler: handleSectionsManagement, args: [] },
        '2': { handler: handleClassesManagement, args: [] },
        '3': { handler: handleGroupsManagement, args: [] },
        '4': { handler: handleProfessorsManagement, args: [] },
        '5': { handler: handleSubjectsManagement, args: [] },
    };

    if (managementMap[content]) {
        const { handler, args } = managementMap[content];
        await handler(message, ...args);
    } else {
        await message.reply(`⚠️ خيار غير صالح. يرجى إرسال رقم من 1 إلى 5.${SIGNATURE}`);
    }
}

/**
 * @description إدارة الشعب (لا حاجة لاختيار شعبة أولاً)
 */
async function handleSectionsManagement(message) {
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    
    await generateManagementMenu(message, 'الشعب', state.sections, 'sections_action');
}

/**
 * @description إدارة الفصول (يبدأ باختيار الشعبة أولاً)
 */
async function handleClassesManagement(message) {
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    
    // عرض قائمة الشعب أولاً
    if (state.sections.size === 0) {
        await message.reply(`⚠️ لا توجد شعب مضافة بعد. يرجى إضافة شعب أولاً.${SIGNATURE}`);
        return;
    }
    
    let list = `📋 *اختر الشعبة أولاً*\n\n`;
    let index = 1;
    for (const [id, section] of state.sections) {
        list += `${index}. ${section.name}\n`;
        index++;
    }
    
    const replyText = `
${list}

💡 أرسل رقم الشعبة أو *إلغاء* للخروج.${SIGNATURE}`;
    
    await message.reply(replyText);
    state.userState.set(authorId, { 
        step: 'select_section_for_classes', 
        timestamp: Date.now(),
        managementType: 'classes'
    });
}

/**
 * @description إدارة الأفواج (يبدأ باختيار الشعبة ثم الفصل)
 */
async function handleGroupsManagement(message) {
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    
    // عرض قائمة الشعب أولاً
    if (state.sections.size === 0) {
        await message.reply(`⚠️ لا توجد شعب مضافة بعد. يرجى إضافة شعب أولاً.${SIGNATURE}`);
        return;
    }
    
    let list = `📋 *اختر الشعبة أولاً*\n\n`;
    let index = 1;
    for (const [id, section] of state.sections) {
        list += `${index}. ${section.name}\n`;
        index++;
    }
    
    const replyText = `
${list}

💡 أرسل رقم الشعبة أو *إلغاء* للخروج.${SIGNATURE}`;
    
    await message.reply(replyText);
    state.userState.set(authorId, { 
        step: 'select_section_for_groups', 
        timestamp: Date.now(),
        managementType: 'groups'
    });
}

/**
 * @description إدارة الأساتذة (يبدأ باختيار الشعبة ثم الفصل)
 */
async function handleProfessorsManagement(message) {
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    
    // عرض قائمة الشعب أولاً
    if (state.sections.size === 0) {
        await message.reply(`⚠️ لا توجد شعب مضافة بعد. يرجى إضافة شعب أولاً.${SIGNATURE}`);
        return;
    }
    
    let list = `📋 *اختر الشعبة أولاً*\n\n`;
    let index = 1;
    for (const [id, section] of state.sections) {
        list += `${index}. ${section.name}\n`;
        index++;
    }
    
    const replyText = `
${list}

💡 أرسل رقم الشعبة أو *إلغاء* للخروج.${SIGNATURE}`;
    
    await message.reply(replyText);
    state.userState.set(authorId, { 
        step: 'select_section_for_professors', 
        timestamp: Date.now(),
        managementType: 'professors'
    });
}

/**
 * @description إدارة المواد (يبدأ باختيار الشعبة ثم الفصل)
 */
async function handleSubjectsManagement(message) {
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    
    // عرض قائمة الشعب أولاً
    if (state.sections.size === 0) {
        await message.reply(`⚠️ لا توجد شعب مضافة بعد. يرجى إضافة شعب أولاً.${SIGNATURE}`);
        return;
    }
    
    let list = `📋 *اختر الشعبة أولاً*\n\n`;
    let index = 1;
    for (const [id, section] of state.sections) {
        list += `${index}. ${section.name}\n`;
        index++;
    }
    
    const replyText = `
${list}

💡 أرسل رقم الشعبة أو *إلغاء* للخروج.${SIGNATURE}`;
    
    await message.reply(replyText);
    state.userState.set(authorId, { 
        step: 'select_section_for_subjects', 
        timestamp: Date.now(),
        managementType: 'subjects'
    });
}

/**
 * @description اختيار الشعبة للفصول
 */
async function handleSelectSectionForClasses(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const sectionIndex = parseInt(content) - 1;
    if (isNaN(sectionIndex) || sectionIndex < 0 || sectionIndex >= state.sections.size) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${state.sections.size}.${SIGNATURE}`);
        return;
    }
    
    // الحصول على معرف الشعبة
    const sectionIds = Array.from(state.sections.keys());
    const sectionId = sectionIds[sectionIndex];
    const sectionName = state.sections.get(sectionId).name;
    
    // عرض قائمة الفصول في هذه الشعبة
    const classesInSection = Array.from(state.classes.values()).filter(cls => cls.section_id === sectionId);
    
    if (classesInSection.length === 0) {
        await message.reply(`⚠️ لا توجد فصول في شعبة "${sectionName}".${SIGNATURE}`);
        state.userState.delete(authorId);
        return;
    }
    
    let list = `📋 *اختر الفصل في شعبة "${sectionName}"*\n\n`;
    let index = 1;
    for (const cls of classesInSection) {
        list += `${index}. ${cls.name}\n`;
        index++;
    }
    
    const replyText = `
${list}

💡 أرسل رقم الفصل أو *إلغاء* للخروج.${SIGNATURE}`;
    
    await message.reply(replyText);
    userState.step = 'select_class_for_management';
    userState.sectionId = sectionId;
    userState.sectionName = sectionName;
    userState.classes = classesInSection;
    state.userState.set(authorId, userState);
}

/**
 * @description اختيار الشعبة للأفواج
 */
async function handleSelectSectionForGroups(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const sectionIndex = parseInt(content) - 1;
    if (isNaN(sectionIndex) || sectionIndex < 0 || sectionIndex >= state.sections.size) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${state.sections.size}.${SIGNATURE}`);
        return;
    }
    
    // الحصول على معرف الشعبة
    const sectionIds = Array.from(state.sections.keys());
    const sectionId = sectionIds[sectionIndex];
    const sectionName = state.sections.get(sectionId).name;
    
    // عرض قائمة الفصول في هذه الشعبة
    const classesInSection = Array.from(state.classes.values()).filter(cls => cls.section_id === sectionId);
    
    if (classesInSection.length === 0) {
        await message.reply(`⚠️ لا توجد فصول في شعبة "${sectionName}".${SIGNATURE}`);
        state.userState.delete(authorId);
        return;
    }
    
    let list = `📋 *اختر الفصل في شعبة "${sectionName}"*\n\n`;
    let index = 1;
    for (const cls of classesInSection) {
        list += `${index}. ${cls.name}\n`;
        index++;
    }
    
    const replyText = `
${list}

💡 أرسل رقم الفصل أو *إلغاء* للخروج.${SIGNATURE}`;
    
    await message.reply(replyText);
    userState.step = 'select_class_for_groups';
    userState.sectionId = sectionId;
    userState.sectionName = sectionName;
    userState.classes = classesInSection;
    state.userState.set(authorId, userState);
}

/**
 * @description اختيار الشعبة للأساتذة
 */
async function handleSelectSectionForProfessors(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const sectionIndex = parseInt(content) - 1;
    if (isNaN(sectionIndex) || sectionIndex < 0 || sectionIndex >= state.sections.size) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${state.sections.size}.${SIGNATURE}`);
        return;
    }
    
    // الحصول على معرف الشعبة
    const sectionIds = Array.from(state.sections.keys());
    const sectionId = sectionIds[sectionIndex];
    const sectionName = state.sections.get(sectionId).name;
    
    // عرض قائمة الفصول في هذه الشعبة
    const classesInSection = Array.from(state.classes.values()).filter(cls => cls.section_id === sectionId);
    
    if (classesInSection.length === 0) {
        await message.reply(`⚠️ لا توجد فصول في شعبة "${sectionName}".${SIGNATURE}`);
        state.userState.delete(authorId);
        return;
    }
    
    let list = `📋 *اختر الفصل في شعبة "${sectionName}"*\n\n`;
    let index = 1;
    for (const cls of classesInSection) {
        list += `${index}. ${cls.name}\n`;
        index++;
    }
    
    const replyText = `
${list}

💡 أرسل رقم الفصل أو *إلغاء* للخروج.${SIGNATURE}`;
    
    await message.reply(replyText);
    userState.step = 'select_class_for_professors';
    userState.sectionId = sectionId;
    userState.sectionName = sectionName;
    userState.classes = classesInSection;
    state.userState.set(authorId, userState);
}

/**
 * @description اختيار الشعبة للمواد
 */
async function handleSelectSectionForSubjects(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const sectionIndex = parseInt(content) - 1;
    if (isNaN(sectionIndex) || sectionIndex < 0 || sectionIndex >= state.sections.size) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${state.sections.size}.${SIGNATURE}`);
        return;
    }
    
    // الحصول على معرف الشعبة
    const sectionIds = Array.from(state.sections.keys());
    const sectionId = sectionIds[sectionIndex];
    const sectionName = state.sections.get(sectionId).name;
    
    // عرض قائمة الفصول في هذه الشعبة
    const classesInSection = Array.from(state.classes.values()).filter(cls => cls.section_id === sectionId);
    
    if (classesInSection.length === 0) {
        await message.reply(`⚠️ لا توجد فصول في شعبة "${sectionName}".${SIGNATURE}`);
        state.userState.delete(authorId);
        return;
    }
    
    let list = `📋 *اختر الفصل في شعبة "${sectionName}"*\n\n`;
    let index = 1;
    for (const cls of classesInSection) {
        list += `${index}. ${cls.name}\n`;
        index++;
    }
    
    const replyText = `
${list}

💡 أرسل رقم الفصل أو *إلغاء* للخروج.${SIGNATURE}`;
    
    await message.reply(replyText);
    userState.step = 'select_class_for_subjects';
    userState.sectionId = sectionId;
    userState.sectionName = sectionName;
    userState.classes = classesInSection;
    state.userState.set(authorId, userState);
}

/**
 * @description اختيار الفصل للإدارة
 */
async function handleSelectClassForManagement(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const classIndex = parseInt(content) - 1;
    if (isNaN(classIndex) || classIndex < 0 || classIndex >= userState.classes.length) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${userState.classes.length}.${SIGNATURE}`);
        return;
    }
    
    const selectedClass = userState.classes[classIndex];
    userState.classId = selectedClass.id;
    userState.className = selectedClass.name;
    
    // عرض قائمة الإجراءات بناءً على نوع الإدارة
    switch (userState.managementType) {
        case 'classes':
            await generateManagementMenu(message, `الفصل "${selectedClass.name}"`, null, 'class_action');
            break;
        case 'groups':
            // عرض الأفواج في هذا الفصل
            const groupsInClass = Array.from(state.groupsData.values()).filter(group => group.class_id === selectedClass.id);
            await generateManagementMenu(message, `الأفواج في الفصل "${selectedClass.name}"`, groupsInClass, 'group_action');
            break;
        case 'professors':
            // عرض الأساتذة في هذا الفصل
            const professorsInClass = Array.from(state.professors.values());
            await generateManagementMenu(message, `الأساتذة في الفصل "${selectedClass.name}"`, professorsInClass, 'professor_action');
            break;
        case 'subjects':
            // عرض المواد في هذا الفصل
            const subjectsInClass = Array.from(state.subjects.values()).filter(subject => subject.class_id === selectedClass.id);
            await generateManagementMenu(message, `المواد في الفصل "${selectedClass.name}"`, subjectsInClass, 'subject_action');
            break;
    }
}

/**
 * @description اختيار الفصل للأفواج
 */
async function handleSelectClassForGroups(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const classIndex = parseInt(content) - 1;
    if (isNaN(classIndex) || classIndex < 0 || classIndex >= userState.classes.length) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${userState.classes.length}.${SIGNATURE}`);
        return;
    }
    
    const selectedClass = userState.classes[classIndex];
    userState.classId = selectedClass.id;
    userState.className = selectedClass.name;
    
    // عرض الأفواج في هذا الفصل
    const groupsInClass = Array.from(state.groupsData.values()).filter(group => group.class_id === selectedClass.id);
    await generateManagementMenu(message, `الأفواج في الفصل "${selectedClass.name}"`, groupsInClass, 'group_action');
}

/**
 * @description اختيار الفصل للأساتذة
 */
async function handleSelectClassForProfessors(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const classIndex = parseInt(content) - 1;
    if (isNaN(classIndex) || classIndex < 0 || classIndex >= userState.classes.length) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${userState.classes.length}.${SIGNATURE}`);
        return;
    }
    
    const selectedClass = userState.classes[classIndex];
    userState.classId = selectedClass.id;
    userState.className = selectedClass.name;
    
    // عرض الأساتذة في هذا الفصل
    const professorsInClass = Array.from(state.professors.values());
    await generateManagementMenu(message, `الأساتذة في الفصل "${selectedClass.name}"`, professorsInClass, 'professor_action');
}

/**
 * @description اختيار الفصل للمواد
 */
async function handleSelectClassForSubjects(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const classIndex = parseInt(content) - 1;
    if (isNaN(classIndex) || classIndex < 0 || classIndex >= userState.classes.length) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${userState.classes.length}.${SIGNATURE}`);
        return;
    }
    
    const selectedClass = userState.classes[classIndex];
    userState.classId = selectedClass.id;
    userState.className = selectedClass.name;
    
    // عرض المواد في هذا الفصل
    const subjectsInClass = Array.from(state.subjects.values()).filter(subject => subject.class_id === selectedClass.id);
    await generateManagementMenu(message, `المواد في الفصل "${selectedClass.name}"`, subjectsInClass, 'subject_action');
}

/**
 * @description معالجة إجراءات الشعب
 */
async function handleSectionsAction(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    
    switch (content) {
        case '1': // إضافة شعبة
            await message.reply(`📝 *إضافة شعبة جديدة*\n\nيرجى إدخال اسم الشعبة:`);
            state.userState.set(authorId, { 
                step: 'add_section', 
                timestamp: Date.now() 
            });
            break;
        case '2': // تعديل شعبة
            if (state.sections.size === 0) {
                await message.reply(`⚠️ لا توجد شعب للتعديل.${SIGNATURE}`);
                return;
            }
            
            let editSectionsList = `📝 *اختر الشعبة التي تريد تعديلها:*\n\n`;
            let index = 1;
            for (const [id, section] of state.sections) {
                editSectionsList += `${index}. ${section.name}\n`;
                index++;
            }
            
            await message.reply(editSectionsList);
            state.userState.set(authorId, { 
                step: 'edit_section', 
                timestamp: Date.now(),
                sections: Array.from(state.sections.entries())
            });
            break;
        case '3': // حذف شعبة
            if (state.sections.size === 0) {
                await message.reply(`⚠️ لا توجد شعب للحذف.${SIGNATURE}`);
                return;
            }
            
            let deleteSectionsList = `🗑️ *اختر الشعبة التي تريد حذفها:*\n\n`;
            index = 1;
            for (const [id, section] of state.sections) {
                deleteSectionsList += `${index}. ${section.name}\n`;
                index++;
            }
            
            await message.reply(deleteSectionsList);
            state.userState.set(authorId, { 
                step: 'delete_section', 
                timestamp: Date.now(),
                sections: Array.from(state.sections.entries())
            });
            break;
        default:
            await message.reply(`⚠️ خيار غير صالح. يرجى إرسال رقم من 1 إلى 3.${SIGNATURE}`);
    }
}

/**
 * @description معالجة إجراءات الفصول
 */
async function handleClassAction(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    switch (content) {
        case '1': // إضافة فصل
            await message.reply(`📝 *إضافة فصل جديد*\n\nيرجى إدخال اسم الفصل:`);
            userState.step = 'add_class';
            break;
        case '2': // تعديل فصل
            await message.reply(`📝 *تعديل الفصل "${userState.className}"*\n\nيرجى إدخال الاسم الجديد:`);
            userState.step = 'edit_class';
            break;
        case '3': // حذف فصل
            await message.reply(`⚠️ *تأكيد حذف الفصل "${userState.className}"*\n\nهذا الإجراء سيحذف جميع المواد والأفواج المرتبطة بهذا الفصل.\n\nيرجى كتابة "تأكيد" للمتابعة أو "إلغاء" للإلغاء:`);
            userState.step = 'delete_class';
            break;
        default:
            await message.reply(`⚠️ خيار غير صالح. يرجى إرسال رقم من 1 إلى 3.${SIGNATURE}`);
    }
}

/**
 * @description معالجة إجراءات الأفواج
 */
async function handleGroupAction(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    switch (content) {
        case '1': // إضافة فوج
            await message.reply(`📝 *إضافة فوج جديد*\n\nيرجى إدخال اسم الفوج:`);
            userState.step = 'add_group';
            break;
        case '2': // تعديل فوج
            if (userState.items.length === 0) {
                await message.reply(`⚠️ لا توجد أفواج للتعديل.${SIGNATURE}`);
                return;
            }
            
            let editGroupsList = `📝 *اختر الفوج الذي تريد تعديله:*\n\n`;
            let index = 1;
            for (const [id, group] of userState.items) {
                editGroupsList += `${index}. ${group.name}\n`;
                index++;
            }
            
            await message.reply(editGroupsList);
            userState.step = 'edit_group';
            break;
        case '3': // حذف فوج
            if (userState.items.length === 0) {
                await message.reply(`⚠️ لا توجد أفواج للحذف.${SIGNATURE}`);
                return;
            }
            
            let deleteGroupsList = `🗑️ *اختر الفوج الذي تريد حذفه:*\n\n`;
            index = 1;
            for (const [id, group] of userState.items) {
                deleteGroupsList += `${index}. ${group.name}\n`;
                index++;
            }
            
            await message.reply(deleteGroupsList);
            userState.step = 'delete_group';
            break;
        default:
            await message.reply(`⚠️ خيار غير صالح. يرجى إرسال رقم من 1 إلى 3.${SIGNATURE}`);
    }
}

/**
 * @description معالجة إجراءات الأساتذة
 */
async function handleProfessorAction(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    switch (content) {
        case '1': // إضافة أستاذ
            await message.reply(`📝 *إضافة أستاذ جديد*\n\nيرجى إدخال اسم الأستاذ:`);
            userState.step = 'add_professor';
            break;
        case '2': // تعديل أستاذ
            if (userState.items.length === 0) {
                await message.reply(`⚠️ لا يوجد أساتذة للتعديل.${SIGNATURE}`);
                return;
            }
            
            let editProfessorsList = `📝 *اختر الأستاذ الذي تريد تعديله:*\n\n`;
            let index = 1;
            for (const [id, professor] of userState.items) {
                editProfessorsList += `${index}. ${professor.name}\n`;
                index++;
            }
            
            await message.reply(editProfessorsList);
            userState.step = 'edit_professor';
            break;
        case '3': // حذف أستاذ
            if (userState.items.length === 0) {
                await message.reply(`⚠️ لا يوجد أساتذة للحذف.${SIGNATURE}`);
                return;
            }
            
            let deleteProfessorsList = `🗑️ *اختر الأستاذ الذي تريد حذفه:*\n\n`;
            index = 1;
            for (const [id, professor] of userState.items) {
                deleteProfessorsList += `${index}. ${professor.name}\n`;
                index++;
            }
            
            await message.reply(deleteProfessorsList);
            userState.step = 'delete_professor';
            break;
        default:
            await message.reply(`⚠️ خيار غير صالح. يرجى إرسال رقم من 1 إلى 3.${SIGNATURE}`);
    }
}

/**
 * @description معالجة إجراءات المواد
 */
async function handleSubjectAction(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    switch (content) {
        case '1': // إضافة مادة
            await message.reply(`📝 *إضافة مادة جديدة*\n\nيرجى إدخال اسم المادة:`);
            userState.step = 'add_subject';
            break;
        case '2': // تعديل مادة
            if (userState.items.length === 0) {
                await message.reply(`⚠️ لا توجد مواد للتعديل.${SIGNATURE}`);
                return;
            }
            
            let editSubjectsList = `📝 *اختر المادة التي تريد تعديلها:*\n\n`;
            let index = 1;
            for (const [id, subject] of userState.items) {
                editSubjectsList += `${index}. ${subject.name}\n`;
                index++;
            }
            
            await message.reply(editSubjectsList);
            userState.step = 'edit_subject';
            break;
        case '3': // حذف مادة
            if (userState.items.length === 0) {
                await message.reply(`⚠️ لا توجد مواد للحذف.${SIGNATURE}`);
                return;
            }
            
            let deleteSubjectsList = `🗑️ *اختر المادة التي تريد حذفها:*\n\n`;
            index = 1;
            for (const [id, subject] of userState.items) {
                deleteSubjectsList += `${index}. ${subject.name}\n`;
                index++;
            }
            
            await message.reply(deleteSubjectsList);
            userState.step = 'delete_subject';
            break;
        default:
            await message.reply(`⚠️ خيار غير صالح. يرجى إرسال رقم من 1 إلى 3.${SIGNATURE}`);
    }
}

/**
 * @description إضافة شعبة جديدة
 */
async function handleAddSection(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    
    if (!content) {
        await message.reply(`⚠️ يرجى إدخال اسم الشعبة.${SIGNATURE}`);
        return;
    }
    
    try {
        // إضافة الشعبة إلى قاعدة البيانات
        const result = await db.query('INSERT INTO sections (name) VALUES ($1) RETURNING id', [content]);
        const sectionId = result.rows[0].id;
        
        // تحديث الحالة في الذاكرة
        state.sections.set(sectionId, { id: sectionId, name: content });
        
        await message.reply(`✅ تمت إضافة الشعبة "${content}" بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error adding section:', error);
        await message.reply(`⚠️ حدث خطأ أثناء إضافة الشعبة. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description تعديل شعبة
 */
async function handleEditSection(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const sectionIndex = parseInt(content) - 1;
    if (isNaN(sectionIndex) || sectionIndex < 0 || sectionIndex >= userState.sections.length) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${userState.sections.length}.${SIGNATURE}`);
        return;
    }
    
    const [sectionId, sectionData] = userState.sections[sectionIndex];
    
    await message.reply(`📝 *تعديل الشعبة "${sectionData.name}"*\n\nيرجى إدخال الاسم الجديد:`);
    
    userState.step = 'edit_section_name';
    userState.sectionId = sectionId;
    userState.oldName = sectionData.name;
    state.userState.set(authorId, userState);
}

/**
 * @description تعديل اسم الشعبة
 */
async function handleEditSectionName(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (!content) {
        await message.reply(`⚠️ يرجى إدخال اسم الشعبة.${SIGNATURE}`);
        return;
    }
    
    try {
        // تحديث الشعبة في قاعدة البيانات
        await db.query('UPDATE sections SET name = $1 WHERE id = $2', [content, userState.sectionId]);
        
        // تحديث الحالة في الذاكرة
        state.sections.set(userState.sectionId, { id: userState.sectionId, name: content });
        
        await message.reply(`✅ تم تعديل الشعبة من "${userState.oldName}" إلى "${content}" بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error editing section:', error);
        await message.reply(`⚠️ حدث خطأ أثناء تعديل الشعبة. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description حذف شعبة
 */
async function handleDeleteSection(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const sectionIndex = parseInt(content) - 1;
    if (isNaN(sectionIndex) || sectionIndex < 0 || sectionIndex >= userState.sections.length) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${userState.sections.length}.${SIGNATURE}`);
        return;
    }
    
    const [sectionId, sectionData] = userState.sections[sectionIndex];
    
    await message.reply(`⚠️ *تأكيد حذف الشعبة "${sectionData.name}"*\n\nهذا الإجراء سيحذف جميع الفصول والمواد والأفواج المرتبطة بهذه الشعبة.\n\nيرجى كتابة "تأكيد" للمتابعة أو "إلغاء" للإلغاء:`);
    
    userState.step = 'confirm_delete_section';
    userState.sectionId = sectionId;
    userState.sectionName = sectionData.name;
    state.userState.set(authorId, userState);
}

/**
 * @description تأكيد حذف الشعبة
 */
async function handleConfirmDeleteSection(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (content.toLowerCase() !== 'تأكيد') {
        await message.reply(`✅ تم إلغاء عملية الحذف.${SIGNATURE}`);
        state.userState.delete(authorId);
        return;
    }
    
    try {
        // حذف الشعبة من قاعدة البيانات (سيتم حذف جميع البيانات المرتبطة بها تلقائياً إذا تم إعداد قيود الحذف في قاعدة البيانات)
        await db.query('DELETE FROM sections WHERE id = $1', [userState.sectionId]);
        
        // تحديث الحالة في الذاكرة
        state.sections.delete(userState.sectionId);
        
        // حذف الفصول المرتبطة بالشعبة
        const classesToDelete = Array.from(state.classes.entries()).filter(([id, cls]) => cls.section_id === userState.sectionId);
        for (const [classId] of classesToDelete) {
            state.classes.delete(classId);
        }
        
        // حذف المواد المرتبطة بالشعبة
        const subjectsToDelete = Array.from(state.subjects.entries()).filter(([id, subject]) => {
            const classId = subject.class_id;
            const cls = state.classes.get(classId);
            return cls && cls.section_id === userState.sectionId;
        });
        for (const [subjectId] of subjectsToDelete) {
            state.subjects.delete(subjectId);
        }
        
        // حذف الأفواج المرتبطة بالشعبة
        const groupsToDelete = Array.from(state.groupsData.entries()).filter(([id, group]) => {
            const classId = group.class_id;
            const cls = state.classes.get(classId);
            return cls && cls.section_id === userState.sectionId;
        });
        for (const [groupId] of groupsToDelete) {
            state.groupsData.delete(groupId);
        }
        
        await message.reply(`✅ تم حذف الشعبة "${userState.sectionName}" وجميع البيانات المرتبطة بها بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error deleting section:', error);
        await message.reply(`⚠️ حدث خطأ أثناء حذف الشعبة. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description إضافة فصل جديد
 */
async function handleAddClass(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (!content) {
        await message.reply(`⚠️ يرجى إدخال اسم الفصل.${SIGNATURE}`);
        return;
    }
    
    try {
        // إضافة الفصل إلى قاعدة البيانات
        const result = await db.query('INSERT INTO classes (name, section_id) VALUES ($1, $2) RETURNING id', [content, userState.sectionId]);
        const classId = result.rows[0].id;
        
        // تحديث الحالة في الذاكرة
        state.classes.set(classId, { id: classId, name: content, section_id: userState.sectionId });
        
        await message.reply(`✅ تمت إضافة الفصل "${content}" بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error adding class:', error);
        await message.reply(`⚠️ حدث خطأ أثناء إضافة الفصل. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description تعديل فصل
 */
async function handleEditClass(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (!content) {
        await message.reply(`⚠️ يرجى إدخال اسم الفصل.${SIGNATURE}`);
        return;
    }
    
    try {
        // تحديث الفصل في قاعدة البيانات
        await db.query('UPDATE classes SET name = $1 WHERE id = $2', [content, userState.classId]);
        
        // تحديث الحالة في الذاكرة
        state.classes.set(userState.classId, { id: userState.classId, name: content, section_id: userState.sectionId });
        
        await message.reply(`✅ تم تعديل الفصل من "${userState.className}" إلى "${content}" بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error editing class:', error);
        await message.reply(`⚠️ حدث خطأ أثناء تعديل الفصل. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description حذف فصل
 */
async function handleDeleteClass(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (content.toLowerCase() !== 'تأكيد') {
        await message.reply(`✅ تم إلغاء عملية الحذف.${SIGNATURE}`);
        state.userState.delete(authorId);
        return;
    }
    
    try {
        // حذف الفصل من قاعدة البيانات
        await db.query('DELETE FROM classes WHERE id = $1', [userState.classId]);
        
        // تحديث الحالة في الذاكرة
        state.classes.delete(userState.classId);
        
        // حذف المواد المرتبطة بالفصل
        const subjectsToDelete = Array.from(state.subjects.entries()).filter(([id, subject]) => subject.class_id === userState.classId);
        for (const [subjectId] of subjectsToDelete) {
            state.subjects.delete(subjectId);
        }
        
        // حذف الأفواج المرتبطة بالفصل
        const groupsToDelete = Array.from(state.groupsData.entries()).filter(([id, group]) => group.class_id === userState.classId);
        for (const [groupId] of groupsToDelete) {
            state.groupsData.delete(groupId);
        }
        
        await message.reply(`✅ تم حذف الفصل "${userState.className}" وجميع البيانات المرتبطة به بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error deleting class:', error);
        await message.reply(`⚠️ حدث خطأ أثناء حذف الفصل. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description إضافة فوج جديد
 */
async function handleAddGroup(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (!content) {
        await message.reply(`⚠️ يرجى إدخال اسم الفوج.${SIGNATURE}`);
        return;
    }
    
    try {
        // إضافة الفوج إلى قاعدة البيانات
        const result = await db.query('INSERT INTO course_groups (name, class_id) VALUES ($1, $2) RETURNING id', [content, userState.classId]);
        const groupId = result.rows[0].id;
        
        // تحديث الحالة في الذاكرة
        state.groupsData.set(groupId, { id: groupId, name: content, class_id: userState.classId });
        
        await message.reply(`✅ تمت إضافة الفوج "${content}" بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error adding group:', error);
        await message.reply(`⚠️ حدث خطأ أثناء إضافة الفوج. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description تعديل فوج
 */
async function handleEditGroup(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const groupIndex = parseInt(content) - 1;
    if (isNaN(groupIndex) || groupIndex < 0 || groupIndex >= userState.items.length) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${userState.items.length}.${SIGNATURE}`);
        return;
    }
    
    const [groupId, groupData] = userState.items[groupIndex];
    
    await message.reply(`📝 *تعديل الفوج "${groupData.name}"*\n\nيرجى إدخال الاسم الجديد:`);
    
    userState.step = 'edit_group_name';
    userState.groupId = groupId;
    userState.oldName = groupData.name;
    state.userState.set(authorId, userState);
}

/**
 * @description تعديل اسم الفوج
 */
async function handleEditGroupName(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (!content) {
        await message.reply(`⚠️ يرجى إدخال اسم الفوج.${SIGNATURE}`);
        return;
    }
    
    try {
        // تحديث الفوج في قاعدة البيانات
        await db.query('UPDATE course_groups SET name = $1 WHERE id = $2', [content, userState.groupId]);
        
        // تحديث الحالة في الذاكرة
        state.groupsData.set(userState.groupId, { id: userState.groupId, name: content, class_id: userState.classId });
        
        await message.reply(`✅ تم تعديل الفوج من "${userState.oldName}" إلى "${content}" بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error editing group:', error);
        await message.reply(`⚠️ حدث خطأ أثناء تعديل الفوج. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description حذف فوج
 */
async function handleDeleteGroup(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const groupIndex = parseInt(content) - 1;
    if (isNaN(groupIndex) || groupIndex < 0 || groupIndex >= userState.items.length) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${userState.items.length}.${SIGNATURE}`);
        return;
    }
    
    const [groupId, groupData] = userState.items[groupIndex];
    
    await message.reply(`⚠️ *تأكيد حذف الفوج "${groupData.name}"*\n\nيرجى كتابة "تأكيد" للمتابعة أو "إلغاء" للإلغاء:`);
    
    userState.step = 'confirm_delete_group';
    userState.groupId = groupId;
    userState.groupName = groupData.name;
    state.userState.set(authorId, userState);
}

/**
 * @description تأكيد حذف الفوج
 */
async function handleConfirmDeleteGroup(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (content.toLowerCase() !== 'تأكيد') {
        await message.reply(`✅ تم إلغاء عملية الحذف.${SIGNATURE}`);
        state.userState.delete(authorId);
        return;
    }
    
    try {
        // حذف الفوج من قاعدة البيانات
        await db.query('DELETE FROM course_groups WHERE id = $1', [userState.groupId]);
        
        // تحديث الحالة في الذاكرة
        state.groupsData.delete(userState.groupId);
        
        await message.reply(`✅ تم حذف الفوج "${userState.groupName}" بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error deleting group:', error);
        await message.reply(`⚠️ حدث خطأ أثناء حذف الفوج. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description إضافة أستاذ جديد
 */
async function handleAddProfessor(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (!content) {
        await message.reply(`⚠️ يرجى إدخال اسم الأستاذ.${SIGNATURE}`);
        return;
    }
    
    try {
        // إضافة الأستاذ إلى قاعدة البيانات
        const result = await db.query('INSERT INTO professors (name) VALUES ($1) RETURNING id', [content]);
        const professorId = result.rows[0].id;
        
        // تحديث الحالة في الذاكرة
        state.professors.set(professorId, { id: professorId, name: content });
        
        await message.reply(`✅ تمت إضافة الأستاذ "${content}" بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error adding professor:', error);
        await message.reply(`⚠️ حدث خطأ أثناء إضافة الأستاذ. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description تعديل أستاذ
 */
async function handleEditProfessor(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const professorIndex = parseInt(content) - 1;
    if (isNaN(professorIndex) || professorIndex < 0 || professorIndex >= userState.items.length) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${userState.items.length}.${SIGNATURE}`);
        return;
    }
    
    const [professorId, professorData] = userState.items[professorIndex];
    
    await message.reply(`📝 *تعديل الأستاذ "${professorData.name}"*\n\nيرجى إدخال الاسم الجديد:`);
    
    userState.step = 'edit_professor_name';
    userState.professorId = professorId;
    userState.oldName = professorData.name;
    state.userState.set(authorId, userState);
}

/**
 * @description تعديل اسم الأستاذ
 */
async function handleEditProfessorName(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (!content) {
        await message.reply(`⚠️ يرجى إدخال اسم الأستاذ.${SIGNATURE}`);
        return;
    }
    
    try {
        // تحديث الأستاذ في قاعدة البيانات
        await db.query('UPDATE professors SET name = $1 WHERE id = $2', [content, userState.professorId]);
        
        // تحديث الحالة في الذاكرة
        state.professors.set(userState.professorId, { id: userState.professorId, name: content });
        
        await message.reply(`✅ تم تعديل الأستاذ من "${userState.oldName}" إلى "${content}" بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error editing professor:', error);
        await message.reply(`⚠️ حدث خطأ أثناء تعديل الأستاذ. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description حذف أستاذ
 */
async function handleDeleteProfessor(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const professorIndex = parseInt(content) - 1;
    if (isNaN(professorIndex) || professorIndex < 0 || professorIndex >= userState.items.length) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${userState.items.length}.${SIGNATURE}`);
        return;
    }
    
    const [professorId, professorData] = userState.items[professorIndex];
    
    await message.reply(`⚠️ *تأكيد حذف الأستاذ "${professorData.name}"*\n\nيرجى كتابة "تأكيد" للمتابعة أو "إلغاء" للإلغاء:`);
    
    userState.step = 'confirm_delete_professor';
    userState.professorId = professorId;
    userState.professorName = professorData.name;
    state.userState.set(authorId, userState);
}

/**
 * @description تأكيد حذف الأستاذ
 */
async function handleConfirmDeleteProfessor(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (content.toLowerCase() !== 'تأكيد') {
        await message.reply(`✅ تم إلغاء عملية الحذف.${SIGNATURE}`);
        state.userState.delete(authorId);
        return;
    }
    
    try {
        // حذف الأستاذ من قاعدة البيانات
        await db.query('DELETE FROM professors WHERE id = $1', [userState.professorId]);
        
        // تحديث الحالة في الذاكرة
        state.professors.delete(userState.professorId);
        
        await message.reply(`✅ تم حذف الأستاذ "${userState.professorName}" بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error deleting professor:', error);
        await message.reply(`⚠️ حدث خطأ أثناء حذف الأستاذ. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description إضافة مادة جديدة
 */
async function handleAddSubject(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (!content) {
        await message.reply(`⚠️ يرجى إدخال اسم المادة.${SIGNATURE}`);
        return;
    }
    
    try {
        // إضافة المادة إلى قاعدة البيانات
        const result = await db.query('INSERT INTO subjects (name, class_id) VALUES ($1, $2) RETURNING id', [content, userState.classId]);
        const subjectId = result.rows[0].id;
        
        // تحديث الحالة في الذاكرة
        state.subjects.set(subjectId, { id: subjectId, name: content, class_id: userState.classId });
        
        await message.reply(`✅ تمت إضافة المادة "${content}" بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error adding subject:', error);
        await message.reply(`⚠️ حدث خطأ أثناء إضافة المادة. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description تعديل مادة
 */
async function handleEditSubject(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const subjectIndex = parseInt(content) - 1;
    if (isNaN(subjectIndex) || subjectIndex < 0 || subjectIndex >= userState.items.length) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${userState.items.length}.${SIGNATURE}`);
        return;
    }
    
    const [subjectId, subjectData] = userState.items[subjectIndex];
    
    await message.reply(`📝 *تعديل المادة "${subjectData.name}"*\n\nيرجى إدخال الاسم الجديد:`);
    
    userState.step = 'edit_subject_name';
    userState.subjectId = subjectId;
    userState.oldName = subjectData.name;
    state.userState.set(authorId, userState);
}

/**
 * @description تعديل اسم المادة
 */
async function handleEditSubjectName(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (!content) {
        await message.reply(`⚠️ يرجى إدخال اسم المادة.${SIGNATURE}`);
        return;
    }
    
    try {
        // تحديث المادة في قاعدة البيانات
        await db.query('UPDATE subjects SET name = $1 WHERE id = $2', [content, userState.subjectId]);
        
        // تحديث الحالة في الذاكرة
        state.subjects.set(userState.subjectId, { id: userState.subjectId, name: content, class_id: userState.classId });
        
        await message.reply(`✅ تم تعديل المادة من "${userState.oldName}" إلى "${content}" بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error editing subject:', error);
        await message.reply(`⚠️ حدث خطأ أثناء تعديل المادة. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description حذف مادة
 */
async function handleDeleteSubject(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    const subjectIndex = parseInt(content) - 1;
    if (isNaN(subjectIndex) || subjectIndex < 0 || subjectIndex >= userState.items.length) {
        await message.reply(`⚠️ رقم غير صالح. يرجى إرسال رقم من 1 إلى ${userState.items.length}.${SIGNATURE}`);
        return;
    }
    
    const [subjectId, subjectData] = userState.items[subjectIndex];
    
    await message.reply(`⚠️ *تأكيد حذف المادة "${subjectData.name}"*\n\nيرجى كتابة "تأكيد" للمتابعة أو "إلغاء" للإلغاء:`);
    
    userState.step = 'confirm_delete_subject';
    userState.subjectId = subjectId;
    userState.subjectName = subjectData.name;
    state.userState.set(authorId, userState);
}

/**
 * @description تأكيد حذف المادة
 */
async function handleConfirmDeleteSubject(message) {
    const content = message.body.trim();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    const userState = state.userState.get(authorId);
    
    if (content.toLowerCase() !== 'تأكيد') {
        await message.reply(`✅ تم إلغاء عملية الحذف.${SIGNATURE}`);
        state.userState.delete(authorId);
        return;
    }
    
    try {
        // حذف المادة من قاعدة البيانات
        await db.query('DELETE FROM subjects WHERE id = $1', [userState.subjectId]);
        
        // تحديث الحالة في الذاكرة
        state.subjects.delete(userState.subjectId);
        
        await message.reply(`✅ تم حذف المادة "${userState.subjectName}" بنجاح!${SIGNATURE}`);
        state.userState.delete(authorId);
    } catch (error) {
        console.error('[❌] Error deleting subject:', error);
        await message.reply(`⚠️ حدث خطأ أثناء حذف المادة. يرجى المحاولة مرة أخرى.${SIGNATURE}`);
        state.userState.delete(authorId);
    }
}

/**
 * @description إنشاء قائمة إدارة
 */
async function generateManagementMenu(message, title, items, nextStep) {
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    
    let menuText = `📋 *${title}*\n\n`;
    
    if (items && items.size > 0) {
        let index = 1;
        for (const [id, item] of items) {
            menuText += `${index}. ${item.name}\n`;
            index++;
        }
        menuText += '\n';
    }
    
    menuText += `الإجراءات المتاحة:\n`;
    menuText += `1. إضافة جديد\n`;
    
    if (items && items.size > 0) {
        menuText += `2. تعديل\n`;
        menuText += `3. حذف\n`;
    }
    
    menuText += `\n💡 أرسل رقم الإجراء أو *إلغاء* للخروج.${SIGNATURE}`;
    
    await message.reply(menuText);
    
    state.userState.set(authorId, { 
        step: nextStep, 
        timestamp: Date.now(),
        items: items ? Array.from(items.entries()) : null
    });
}

module.exports = {
    '!إدارة_المقررات': handleCoursesCommand,
    '!manage_courses': handleCoursesCommand,
    
    // دوال معالجة ردود المستخدم
    handleSelectManagementType,
    handleSectionsManagement,
    handleClassesManagement,
    handleGroupsManagement,
    handleProfessorsManagement,
    handleSubjectsManagement,
    handleSelectSectionForClasses,
    handleSelectClassForManagement,
    handleSelectSectionForGroups,
    handleSelectClassForGroups,
    handleSelectSectionForProfessors,
    handleSelectClassForProfessors,
    handleSelectSectionForSubjects,
    handleSelectClassForSubjects,
    handleSectionsAction,
    handleClassAction,
    handleGroupAction,
    handleProfessorAction,
    handleSubjectAction,
    handleAddSection,
    handleEditSection,
    handleEditSectionName,
    handleDeleteSection,
    handleConfirmDeleteSection,
    handleAddClass,
    handleEditClass,
    handleDeleteClass,
    handleAddGroup,
    handleEditGroup,
    handleEditGroupName,
    handleDeleteGroup,
    handleConfirmDeleteGroup,
    handleAddProfessor,
    handleEditProfessor,
    handleEditProfessorName,
    handleDeleteProfessor,
    handleConfirmDeleteProfessor,
    handleAddSubject,
    handleEditSubject,
    handleEditSubjectName,
    handleDeleteSubject,
    handleConfirmDeleteSubject,
};