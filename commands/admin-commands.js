// commands/admin-commands.js

const { SIGNATURE } = require('../config');
const state = require('../state');
const { saveData } = require('../database');
const { checkPermission, requireGroup, getUserInfo } = require('../utils');

/**
 * @description يضيف مطورًا جديدًا.
 * @param {Message} message - كائن الرسالة.
 * @param {Client} client - عميل واتساب.
 */
async function handleAddDeveloperCommand(message, client) {
    try {
        // التحقق من أن الرسالة من مجموعة
        if (!(await requireGroup(message))) {
            return;
        }
        
        // التحقق من صلاحية المالك
        if (!(await checkPermission(message, client, 'owner'))) {
            return;
        }
        
        const mentionedUsers = await message.getMentions();
        
        if (mentionedUsers.length === 0) {
            await message.reply(`⚠️ يرجى الإشارة إلى المستخدم الذي تريد إضافته كمطور. مثال: !اضافة_مطور @user${SIGNATURE}`);
            return;
        }
        
        const newDeveloper = mentionedUsers[0];
        const userId = newDeveloper.id._serialized;
        
        // التحقق إذا كان المستخدم مطورًا بالفعل
        if (state.admins.has(userId)) {
            await message.reply(`⚠️ هذا المستخدم مطور بالفعل.${SIGNATURE}`);
            return;
        }
        
        // إضافة المطور إلى قاعدة البيانات
        const result = await saveData('developers', {
            userid: userId,
            name: newDeveloper.pushname || newDeveloper.name || "مطور"
        });
        
        if (result) {
            // إضافة المطور إلى الذاكرة
            state.admins.add(userId);
            
            await message.reply(`✅ تمت إضافة @${newDeveloper.id.user} كمطور بنجاح.${SIGNATURE}`);
            
            // إرسال إشعار للمطور الجديد
            await client.sendMessage(userId, `🎉 تمت إضافتك كمطور في البوت!${SIGNATURE}`);
        } else {
            await message.reply(`⚠️ حدث خطأ أثناء إضافة المطور.${SIGNATURE}`);
        }
    } catch (error) {
        console.error('[❌] Error in add developer command:', error);
        await message.reply(`⚠️ حدث خطأ غير متوقع.${SIGNATURE}`);
    }
}

/**
 * @description يعرض إحصائيات البوت.
 * @param {Message} message - كائن الرسالة.
 * @param {Client} client - عميل واتساب.
 */
async function handleStatsCommand(message, client) {
    try {
        // التحقق من صلاحية المالك
        if (!(await checkPermission(message, client, 'owner'))) {
            return;
        }
        
        const uptime = Date.now() - state.stats.startTime;
        const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        
        const statsText = `
📊 *إحصائيات البوت*

⏱️ *وقت التشغيل:* ${days} يوم, ${hours} ساعة, ${minutes} دقيقة
📨 *الرسائل المعالجة:* ${state.stats.messagesProcessed}
🔧 *الأوامر المنفذة:* ${state.stats.commandsExecuted}
❌ *الأخطاء:* ${state.stats.errors}
👥 *المجموعات:* ${state.groupsMetadata.size}
👑 *المطورين:* ${state.admins.size}
📚 *الشعب:* ${state.sections.size}
🏫 *الفصول:* ${state.classes.size}
📖 *المواد:* ${state.subjects.size}
👨‍🏫 *الأساتذة:* ${state.professors.size}
👥 *الأفواج:* ${state.groupsData.size}${SIGNATURE}`;
        
        await message.reply(statsText);
    } catch (error) {
        console.error('[❌] Error in stats command:', error);
        await message.reply(`⚠️ حدث خطأ غير متوقع.${SIGNATURE}`);
    }
}

/**
 * @description يعيد تشغيل البوت.
 * @param {Message} message - كائن الرسالة.
 * @param {Client} client - عميل واتساب.
 */
async function handleRestartCommand(message, client) {
    try {
        // التحقق من صلاحية المالك
        if (!(await checkPermission(message, client, 'owner'))) {
            return;
        }
        
        await message.reply(`🔄 جاري إعادة تشغيل البوت...${SIGNATURE}`);
        
        // تعيين علامة إعادة التشغيل
        state.isRestarting = true;
        
        // إغلاق البوت
        await client.destroy();
        
        // الخروج من العملية
        process.exit(0);
    } catch (error) {
        console.error('[❌] Error in restart command:', error);
        await message.reply(`⚠️ حدث خطأ أثناء إعادة التشغيل.${SIGNATURE}`);
    }
}

/**
 * @description يعرض صلاحيات المستخدم.
 * @param {Message} message - كائن الرسالة.
 * @param {Client} client - عميل واتساب.
 */
async function handlePermissionsCommand(message, client) {
    try {
        const userInfo = await getUserInfo(message);
        
        if (!userInfo) {
            await message.reply(`⚠️ حدث خطأ أثناء الحصول على معلومات المستخدم.${SIGNATURE}`);
            return;
        }
        
        const permissionsText = `
🔍 *حالة صلاحياتك:*

المستخدم: ${userInfo.name}
المعرف: ${userInfo.id}

👑 *المالك:* ${userInfo.isOwner ? '✅ نعم' : '❌ لا'}
🔧 *المطور:* ${userInfo.isDeveloper ? '✅ نعم' : '❌ لا'}
👮 *مشرف:* ${userInfo.isAdmin ? '✅ نعم' : '❌ لا'}${SIGNATURE}`;
        
        await message.reply(permissionsText);
    } catch (error) {
        console.error('[❌] Error in permissions command:', error);
        await message.reply(`⚠️ حدث خطأ غير متوقع.${SIGNATURE}`);
    }
}

module.exports = {
    '!اضافة_مطور': handleAddDeveloperCommand,
    '!add_developer': handleAddDeveloperCommand,
    '!احصائيات': handleStatsCommand,
    '!stats': handleStatsCommand,
    '!اعادة_تشغيل': handleRestartCommand,
    '!restart': handleRestartCommand,
    '!صلاحياتي': handlePermissionsCommand,
    '!my_permissions': handlePermissionsCommand,
};