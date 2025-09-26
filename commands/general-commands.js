// commands/general-commands.js

const { SIGNATURE } = require('../config');
const state = require('../state');

/**
 * @description يعرض قائمة الأوامر المتاحة.
 * @param {Message} message - كائن الرسالة.
 * @param {Client} client - عميل واتساب.
 */
async function handleCommandsCommand(message, client) {
    const commandsList = `
📋 *قائمة الأوامر المتاحة:*

🔧 *أوامر المشرفين:*
• !إعداد - لإعداد النظام (للمشرفين فقط)
• !اضافة_محاضرة - لإضافة محاضرة جديدة (للمشرفين فقط)
• !عرض_المحاضرات - لعرض وتحميل المحاضرات
• !إدارة_المقررات - لإدارة المقررات الدراسية (للمشرفين فقط)
• !اضافة_مطور - لإضافة مطور جديد (للمالك فقط)
• !احصائيات - لعرض إحصائيات البوت (للمالك فقط)
• !اعادة_تشغيل - لإعادة تشغيل البوت (للمالك فقط)

📚 *أوامر المحاضرات:*
• !بحث - للبحث عن محاضرة
• !تحميل - لتحميل محاضرة محددة

🤖 *أوامر الذكاء الاصطناعي:*
• !سؤال - لطرح سؤال على الذكاء الاصطناعي
• !ترجمة - لترجمة نص
• !تلخيص - لتلخيص نص

📊 *أوامر أخرى:*
• !استطلاع - لإنشاء استطلاع رأي
• !مساعدة - لعرض المساعدة
• !إبلاغ - للإبلاغ عن مشكلة

💡 لإرسال ملاحظات أو اقتراحات، استخدم أمر !إبلاغ${SIGNATURE}
    `;
    
    await message.reply(commandsList);
}

/**
 * @description يعرض معلومات المساعدة.
 * @param {Message} message - كائن الرسالة.
 * @param {Client} client - عميل واتساب.
 */
async function handleHelpCommand(message, client) {
    const helpText = `
🤖 *مساعدة بوت واتساب*

مرحباً بك في بوت واتساب لإدارة المحاضرات والمقررات الدراسية!

*كيفية استخدام البوت:*

1. *للمشرفين:*
   - استخدم أمر !إعداد لإعداد النظام للمرة الأولى.
   - استخدم أمر !اضافة_محاضرة لإضافة محاضرات جديدة.
   - استخدم أمر !إدارة_المقررات لإدارة الشعب والفصول والمواد.

2. *للطلاب:*
   - استخدم أمر !عرض_المحاضرات لعرض المحاضرات المتاحة.
   - استخدم أمر !تحميل لتحميل محاضرة محددة.
   - استخدم أمر !بحث للبحث عن محاضرة.

3. *للجميع:*
   - استخدم أمر !سؤال لطرح سؤال على الذكاء الاصطناعي.
   - استخدم أمر !ترجمة لترجمة نص.
   - استخدم أمر !تلخيص لتلخيص نص.

*ملاحظات:*
- بعض الأوامر تتطلب صلاحيات مشرف.
- يمكنك إلغاء أي عملية عن طريق كتابة "إلغاء".
- إذا واجهت أي مشكلة، استخدم أمر !إبلاغ للإبلاغ عنها.${SIGNATURE}
    `;
    
    await message.reply(helpText);
}

/**
 * @description يسمح للمستخدمين بالإبلاغ عن مشاكل.
 * @param {Message} message - كائن الرسالة.
 * @param {Client} client - عميل واتساب.
 */
async function handleReportCommand(message, client) {
    const reportText = message.body.replace(/^!إبلاغ|^!report/i, '').trim();
    
    if (!reportText) {
        await message.reply(`⚠️ يرجى كتابة المشكلة التي تريد الإبلاغ عنها. مثال: !إبلاغ لا يمكنني تحميل المحاضرات${SIGNATURE}`);
        return;
    }
    
    await message.react('📝');
    
    try {
        const contact = await message.getContact();
        const userName = contact.pushname || contact.name || "مستخدم";
        const userId = contact.id._serialized;
        
        const reportMessage = `
🚩 *تقرير جديد*

*المستخدم:* ${userName} (${userId})
*المشكلة:* ${reportText}
*التاريخ والوقت:* ${new Date().toLocaleString('ar-SA')}
        `;
        
        // إرسال التقرير إلى المالك
        if (state.OWNER_ID) {
            await client.sendMessage(state.OWNER_ID, reportMessage);
        }
        
        await message.reply(`✅ تم إرسال تقريرك بنجاح. شكراً لك على مساعدتنا في تحسين البوت!${SIGNATURE}`);
    } catch (error) {
        console.error('[❌] Error in report command:', error);
        await message.reply(`⚠️ حدث خطأ أثناء إرسال تقريرك. يرجى المحاولة مرة أخرى لاحقًا.${SIGNATURE}`);
    }
}

module.exports = {
    '!أوامر': handleCommandsCommand,
    '!commands': handleCommandsCommand,
    '!مساعدة': handleHelpCommand,
    '!help': handleHelpCommand,
    '!إبلاغ': handleReportCommand,
    '!report': handleReportCommand,
};