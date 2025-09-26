// commands/management-handler.js

const { isAdmin } = require('../utils');
const { SIGNATURE } = require('../config');
const state = require('../state');

/**
 * @description يبدأ عملية الإدارة العامة.
 * @param {Message} message - كائن الرسالة من whatsapp-web.js.
 * @param {Client} client - كائن عميل whatsapp-web.js.
 */
async function handleManagementCommand(message, client) {
    const chat = await message.getChat();
    const contact = await message.getContact();
    const authorId = contact.id._serialized;
    
    // التحقق من أن المستخدم مشرف
    if (chat.isGroup && !(await isAdmin(client, authorId, chat.id._serialized))) {
        await message.reply(`⚠️ هذا الأمر متاح للمشرفين فقط!${SIGNATURE}`);
        return;
    }
    
    await message.react('⚙️');
    const senderName = contact.pushname || "المستخدم";
    
    const replyText = `
⚙️ *لوحة التحكم*

مرحباً ${senderName}! 🙋‍♂️
يرجى اختيار الإجراء الذي تريد القيام به:

1. عرض الشعب الموجودة
2. إضافة شعبة جديدة
3. تعديل شعبة موجودة
4. حذف شعبة

💡 أرسل رقم الخيار أو *إلغاء* للخروج.${SIGNATURE}`;
    
    await message.reply(replyText);
    state.userState.set(authorId, { 
        step: 'management_select_action', 
        timestamp: Date.now() 
    });
}

module.exports = {
    '!إدارة': handleManagementCommand,
    '!management': handleManagementCommand,
};