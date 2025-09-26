// commands/search-commands.js

const { SIGNATURE } = require('../config');
const state = require('../state');

/**
 * @description يبحث عن محاضرة معينة.
 * @param {Message} message - كائن الرسالة.
 * @param {Client} client - عميل واتساب.
 */
async function handleSearchCommand(message, client) {
    const searchTerm = message.body.replace(/^!بحث|^!search/i, '').trim();
    
    if (!searchTerm) {
        await message.reply(`⚠️ يرجى كتابة كلمة البحث. مثال: !بحث رياضيات${SIGNATURE}`);
        return;
    }
    
    await message.react('🔍');
    
    try {
        // هنا يمكن إضافة البحث في قاعدة البيانات
        // للتجربة، سنقوم بالبحث في البيانات المحملة في الذاكرة
        
        const results = [];
        
        // البحث في المواد
        for (const [id, subject] of state.subjects) {
            if (subject.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                // الحصول على الفصل
                const classObj = state.classes.get(subject.class_id);
                if (classObj) {
                    // الحصول على الشعبة
                    const section = state.sections.get(classObj.section_id);
                    if (section) {
                        results.push({
                            type: 'مادة',
                            name: subject.name,
                            section: section.name,
                            class: classObj.name
                        });
                    }
                }
            }
        }
        
        if (results.length === 0) {
            await message.reply(`⚠️ لم يتم العثور على نتائج لبحثك عن "${searchTerm}".${SIGNATURE}`);
            return;
        }
        
        let resultText = `🔍 *نتائج البحث عن "${searchTerm}":*\n\n`;
        
        results.forEach((result, index) => {
            resultText += `${index + 1}. *${result.type}:* ${result.name}\n`;
            resultText += `   الشعبة: ${result.section}\n`;
            resultText += `   الفصل: ${result.class}\n\n`;
        });
        
        resultText += `💡 لتحميل محاضرة من هذه النتائج، استخدم أمر !تحميل.${SIGNATURE}`;
        
        await message.reply(resultText);
    } catch (error) {
        console.error('[❌] Error in search command:', error);
        await message.reply(`⚠️ حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى لاحقًا.${SIGNATURE}`);
    }
}

module.exports = {
    '!بحث': handleSearchCommand,
    '!search': handleSearchCommand,
};