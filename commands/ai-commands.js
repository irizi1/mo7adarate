// commands/ai-commands.js

const { AI_API_KEY, SIGNATURE } = require('../config');
const { logError } = require('../utils');
const fetch = require('node-fetch');

/**
 * @description يرسل سؤالًا للذكاء الاصطناعي ويعيد الإجابة.
 * @param {Message} message - كائن الرسالة.
 * @param {Client} client - عميل واتساب.
 */
async function handleAICommand(message, client) {
    const question = message.body.replace(/^!سؤال|^!question/i, '').trim();
    
    if (!question) {
        await message.reply(`⚠️ يرجى كتابة سؤالك بعد الأمر. مثال: !سؤال ما هو الذكاء الاصطناعي؟${SIGNATURE}`);
        return;
    }
    
    if (!AI_API_KEY || AI_API_KEY === 'YOUR_AI_API_KEY') {
        await message.reply(`⚠️ لم يتم إعداد مفتاح API للذكاء الاصطناعي. يرجى التواصل مع المالك.${SIGNATURE}`);
        return;
    }
    
    await message.react('🤖');
    
    try {
        // استخدام OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: question }],
                max_tokens: 1000
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        const answer = data.choices[0].message.content;
        
        await message.reply(`🤖 *الإجابة:*\n\n${answer}${SIGNATURE}`);
    } catch (error) {
        logError(error, 'AI command');
        await message.reply(`⚠️ حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى لاحقًا.${SIGNATURE}`);
    }
}

/**
 * @description يترجم النص المرسل.
 * @param {Message} message - كائن الرسالة.
 * @param {Client} client - عميل واتساب.
 */
async function handleTranslateCommand(message, client) {
    const text = message.body.replace(/^!ترجمة|^!translate/i, '').trim();
    
    if (!text) {
        await message.reply(`⚠️ يرجى كتابة النص الذي تريد ترجمته. مثال: !ترجمة Hello world${SIGNATURE}`);
        return;
    }
    
    await message.react('🌐');
    
    try {
        // استخدام OpenAI API للترجمة
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ 
                    role: 'user', 
                    content: `ترجم النص التالي إلى العربية: "${text}"` 
                }],
                max_tokens: 1000
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        const translation = data.choices[0].message.content;
        
        await message.reply(`🌐 *الترجمة:*\n\n${translation}${SIGNATURE}`);
    } catch (error) {
        logError(error, 'translate command');
        await message.reply(`⚠️ حدث خطأ أثناء الترجمة. يرجى المحاولة مرة أخرى لاحقًا.${SIGNATURE}`);
    }
}

/**
 * @description يلخص النص المرسل.
 * @param {Message} message - كائن الرسالة.
 * @param {Client} client - عميل واتساب.
 */
async function handleSummarizeCommand(message, client) {
    const text = message.body.replace(/^!تلخيص|^!summarize/i, '').trim();
    
    if (!text) {
        await message.reply(`⚠️ يرجى كتابة النص الذي تريد تلخيصه. مثال: !تلخيص نص طويل هنا...${SIGNATURE}`);
        return;
    }
    
    await message.react('📝');
    
    try {
        // استخدام OpenAI API للتلخيص
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [{ 
                    role: 'user', 
                    content: `لخص النص التالي باختصار: "${text}"` 
                }],
                max_tokens: 1000
            })
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error.message);
        }
        
        const summary = data.choices[0].message.content;
        
        await message.reply(`📝 *الملخص:*\n\n${summary}${SIGNATURE}`);
    } catch (error) {
        logError(error, 'summarize command');
        await message.reply(`⚠️ حدث خطأ أثناء التلخيص. يرجى المحاولة مرة أخرى لاحقًا.${SIGNATURE}`);
    }
}

module.exports = {
    '!سؤال': handleAICommand,
    '!question': handleAICommand,
    '!ترجمة': handleTranslateCommand,
    '!translate': handleTranslateCommand,
    '!تلخيص': handleSummarizeCommand,
    '!summarize': handleSummarizeCommand,
};