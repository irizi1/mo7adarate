// commands/setup-handler.js

const { SIGNATURE } = require('../config.js');
const state = require('../state.js');
const { checkPermission, requireGroup } = require('../utils.js');
const setupSteps = require('./setup-handler-steps.js');

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
        
        // --- الفحص هنا ---
        const userStateData = { 
            step: 'setup_select_action',
            timestamp: Date.now(),
        };
        state.userState.set(authorId, userStateData);
        console.log(`[DEBUG] State SET for user ${authorId}. Current state map size: ${state.userState.size}`);
        // --- نهاية الفحص ---

    } catch (error) {
        console.error('[❌] Error in setup command:', error);
        await message.reply(`⚠️ حدث خطأ غير متوقع.${SIGNATURE}`);
    }
}

module.exports = {
    '!إعداد': handleSetupCommand,
    '!setup': handleSetupCommand,
    ...setupSteps
};