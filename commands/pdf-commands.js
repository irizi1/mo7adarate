// pdf-commands.js

const fs = require('fs');
const path = require('path');
const PdfPrinter = require('pdfmake');
const { MessageMedia } = require('whatsapp-web.js'); // أضف هذا السطر
const { FONTS_DIR, SIGNATURE } = require('../config');
const { isAdmin } = require('../utils');
const db = require('../database');

/**
 * @description التحقق من وجود الخطوط المطلوبة لإنشاء PDF.
 * @returns {boolean} `true` إذا كانت الخطوط موجودة.
 */
function checkFonts() {
    const regularFont = path.join(FONTS_DIR, 'Amiri-Regular.ttf');
    const boldFont = path.join(FONTS_DIR, 'Amiri-Bold.ttf');
    
    if (!fs.existsSync(FONTS_DIR)) fs.mkdirSync(FONTS_DIR);
    
    if (!fs.existsSync(regularFont) || !fs.existsSync(boldFont)) {
        console.log('[❌] Amiri fonts not found in fonts directory. PDF generation might fail.');
        return false;
    }
    
    return true;
}

/**
 * @description ينشئ جدول المحاضرات كملف PDF مع تصميم أنيق وجذاب.
 * @param {Array} lecturesData - مصفوفة بيانات المحاضرات.
 * @returns {Promise<MessageMedia>} كائن MessageMedia يحتوي على ملف PDF.
 */
async function generateLecturesTablePDF(lecturesData) {
    if (!checkFonts()) {
        throw new Error('الخطوط المطلوبة لإنشاء PDF غير موجودة.');
    }

    const fonts = {
        Amiri: {
            normal: path.join(FONTS_DIR, 'Amiri-Regular.ttf'),
            bold: path.join(FONTS_DIR, 'Amiri-Bold.ttf'),
            italics: path.join(FONTS_DIR, 'Amiri-Regular.ttf'), // استخدام الخط العادي للإمالة
            bolditalics: path.join(FONTS_DIR, 'Amiri-Bold.ttf') // استخدام الخط العريض للإمالة العريضة
        }
    };

    const printer = new PdfPrinter(fonts);
    
    // إنشاء رأس الجدول مع تنسيق جذاب
    const headerRow = [
        { text: 'التسلسل', style: 'tableHeader', alignment: 'center' },
        { text: 'الشعبة', style: 'tableHeader', alignment: 'center' },
        { text: 'الفصل', style: 'tableHeader', alignment: 'center' },
        { text: 'المادة', style: 'tableHeader', alignment: 'center' },
        { text: 'رقم المحاضرة', style: 'tableHeader', alignment: 'center' },
        { text: 'الأستاذ', style: 'tableHeader', alignment: 'center' },
        { text: 'التاريخ', style: 'tableHeader', alignment: 'center' }
    ];
    
    const body = [headerRow];

    // إنشاء صفوف الجدول مع تنسيق بديل
    lecturesData.forEach(function(lecture, index) {
        const date = lecture.created_at ? 
            new Date(lecture.created_at).toLocaleDateString('ar-EG') : 
            'غير محدد';
        
        // تلوين الصفوف بالتناوب
        const rowStyle = index % 2 === 0 ? 'evenRow' : 'oddRow';
        
        const row = [
            { text: (index + 1).toString(), style: rowStyle, alignment: 'center' },
            { text: lecture.section_name || 'غير محدد', style: rowStyle, alignment: 'center' },
            { text: lecture.class_name || 'غير محدد', style: rowStyle, alignment: 'center' },
            { text: lecture.subject_name || 'غير محدد', style: rowStyle, alignment: 'center' },
            { text: lecture.lecture_number?.toString() || 'غير محدد', style: rowStyle, alignment: 'center' },
            { text: lecture.professor_name || 'غير محدد', style: rowStyle, alignment: 'center' },
            { text: date, style: rowStyle, alignment: 'center' }
        ];
        
        body.push(row);
    });

    const docDefinition = {
        // إضافة خلفية للصفحة
        background: function(currentPage, pageSize) {
            return [
                {
                    canvas: [
                        {
                            type: 'rect',
                            x: 0,
                            y: 0,
                            w: pageSize.width,
                            h: pageSize.height,
                            color: '#f8f9fa'
                        }
                    ]
                }
            ];
        },
        
        // محتوى المستند
        content: [
            // العنوان الرئيسي
            {
                text: 'جدول المحاضرات',
                style: 'mainTitle',
                alignment: 'center',
                margin: [0, 20, 0, 10]
            },
            
            // خط فاصل
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 40,
                        y1: 0,
                        x2: 540,
                        y2: 0,
                        lineWidth: 2,
                        lineColor: '#4a69bd'
                    }
                ],
                margin: [0, 0, 0, 20]
            },
            
            // معلومات إضافية
            {
                columns: [
                    {
                        text: `تاريخ الإصدار: ${new Date().toLocaleDateString('ar-EG')}`,
                        style: 'infoText',
                        alignment: 'right'
                    },
                    {
                        text: `عدد المحاضرات: ${lecturesData.length}`,
                        style: 'infoText',
                        alignment: 'left'
                    }
                ],
                margin: [0, 0, 0, 20]
            },
            
            // الجدول
            {
                table: {
                    headerRows: 1,
                    widths: [40, 80, 70, 90, 70, 90, 70],
                    body: body
                },
                layout: {
                    hLineWidth: function(i, node) {
                        return (i === 0 || i === node.table.body.length) ? 2 : 1;
                    },
                    vLineWidth: function(i, node) {
                        return (i === 0 || i === node.table.widths.length) ? 2 : 1;
                    },
                    hLineColor: function(i, node) {
                        return i === 0 ? '#4a69bd' : '#e0e0e0';
                    },
                    vLineColor: function(i, node) {
                        return i === 0 ? '#4a69bd' : '#e0e0e0';
                    },
                    fillColor: function(rowIndex) {
                        return rowIndex % 2 === 0 ? '#ffffff' : '#f5f6fa';
                    },
                    paddingLeft: function(i) {
                        return i === 0 ? 10 : 5;
                    },
                    paddingRight: function(i, node) {
                        return i === node.table.widths.length - 1 ? 10 : 5;
                    },
                    paddingTop: function() {
                        return 8;
                    },
                    paddingBottom: function() {
                        return 8;
                    }
                },
                margin: [0, 0, 0, 30]
            },
            
            // تذييل الصفحة
            {
                text: 'تم إنشاؤه بواسطة نظام إدارة المحاضرات',
                style: 'footer',
                alignment: 'center',
                margin: [0, 20, 0, 0]
            }
        ],
        
        // أنماط التنسيق
        styles: {
            mainTitle: {
                fontSize: 26,
                bold: true,
                color: '#2c3e50',
                font: 'Amiri',
                decoration: 'underline',
                decorationStyle: 'double',
                decorationColor: '#4a69bd'
            },
            tableHeader: {
                fontSize: 12,
                bold: true,
                color: '#ffffff',
                fillColor: '#4a69bd',
                font: 'Amiri',
                margin: [5, 5, 5, 5]
            },
            evenRow: {
                fontSize: 10,
                color: '#2c3e50',
                font: 'Amiri',
                margin: [5, 5, 5, 5]
            },
            oddRow: {
                fontSize: 10,
                color: '#2c3e50',
                font: 'Amiri',
                fillColor: '#f5f6fa',
                margin: [5, 5, 5, 5]
            },
            infoText: {
                fontSize: 10,
                color: '#7f8c8d',
                font: 'Amiri'
            },
            footer: {
                fontSize: 8,
                color: '#95a5a6',
                font: 'Amiri'
            }
        },
        
        // إعدادات الصفحة
        pageOrientation: 'landscape',
        pageSize: 'A4',
        pageMargins: [20, 30, 20, 30]
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    
    return new Promise(function(resolve, reject) {
        const chunks = [];
        pdfDoc.on('data', function(chunk) {
            chunks.push(chunk);
        });
        pdfDoc.on('end', function() {
            const buffer = Buffer.concat(chunks);
            const media = new MessageMedia(
                'application/pdf',
                buffer.toString('base64'),
                `جدول_المحاضرات_${new Date().toISOString().split('T')[0]}.pdf`
            );
            resolve(media);
        });
        pdfDoc.on('error', reject);
        pdfDoc.end();
    });
}

/**
 * @description ينشئ تقريراً إحصائياً للمحاضرات كملف PDF.
 * @param {Object} statsData - بيانات الإحصائيات.
 * @returns {Promise<MessageMedia>} كائن MessageMedia يحتوي على ملف PDF.
 */
async function generateStatisticsPDF(statsData) {
    if (!checkFonts()) {
        throw new Error('الخطوط المطلوبة لإنشاء PDF غير موجودة.');
    }

    const fonts = {
        Amiri: {
            normal: path.join(FONTS_DIR, 'Amiri-Regular.ttf'),
            bold: path.join(FONTS_DIR, 'Amiri-Bold.ttf'),
            italics: path.join(FONTS_DIR, 'Amiri-Regular.ttf'),
            bolditalics: path.join(FONTS_DIR, 'Amiri-Bold.ttf')
        }
    };

    const printer = new PdfPrinter(fonts);
    
    // إنشاء محتوى التقرير
    const content = [
        // العنوان الرئيسي
        {
            text: 'تقرير إحصائي للمحاضرات',
            style: 'mainTitle',
            alignment: 'center',
            margin: [0, 20, 0, 10]
        },
        
        // خط فاصل
        {
            canvas: [
                {
                    type: 'line',
                    x1: 40,
                    y1: 0,
                    x2: 540,
                    y2: 0,
                    lineWidth: 2,
                    lineColor: '#e74c3c'
                }
            ],
            margin: [0, 0, 0, 20]
        },
        
        // معلومات التقرير
        {
            text: `تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}`,
            style: 'infoText',
            alignment: 'right',
            margin: [0, 0, 0, 10]
        },
        
        // الإحصائيات العامة
        {
            text: 'الإحصائيات العامة',
            style: 'sectionTitle',
            margin: [0, 20, 0, 10]
        },
        
        {
            ul: [
                `إجمالي عدد المحاضرات: ${statsData.totalLectures}`,
                `عدد الشعب: ${statsData.totalSections}`,
                `عدد المواد: ${statsData.totalSubjects}`,
                `عدد الأساتذة: ${statsData.totalProfessors}`
            ],
            style: 'statsList',
            margin: [0, 0, 0, 20]
        },
        
        // إحصائيات الشعب
        {
            text: 'تفصيل الشعب',
            style: 'sectionTitle',
            margin: [0, 0, 0, 10]
        }
    ];
    
    // إضافة تفاصيل كل شعبة
    statsData.sections.forEach(function(section) {
        content.push({
            text: section.name,
            style: 'subsectionTitle',
            margin: [0, 10, 0, 5]
        });
        
        content.push({
            ul: [
                `عدد المحاضرات: ${section.total}`,
                `عدد المواد: ${section.subjects.size}`
            ],
            style: 'statsList',
            margin: [0, 0, 0, 10]
        });
        
        // إضافة تفاصيل المواد
        section.subjects.forEach(function(count, subject) {
            content.push({
                text: `   - ${subject}: ${count} محاضرة`,
                style: 'subjectDetail'
            });
        });
    });
    
    // تذييل الصفحة
    content.push({
        text: 'تم إنشاؤه بواسطة نظام إدارة المحاضرات',
        style: 'footer',
        alignment: 'center',
        margin: [0, 20, 0, 0]
    });

    const docDefinition = {
        // إضافة خلفية للصفحة
        background: function(currentPage, pageSize) {
            return [
                {
                    canvas: [
                        {
                            type: 'rect',
                            x: 0,
                            y: 0,
                            w: pageSize.width,
                            h: pageSize.height,
                            color: '#fdfbfb'
                        }
                    ]
                }
            ];
        },
        
        // محتوى المستند
        content: content,
        
        // أنماط التنسيق
        styles: {
            mainTitle: {
                fontSize: 24,
                bold: true,
                color: '#c0392b',
                font: 'Amiri',
                decoration: 'underline',
                decorationStyle: 'double',
                decorationColor: '#e74c3c'
            },
            sectionTitle: {
                fontSize: 16,
                bold: true,
                color: '#2c3e50',
                font: 'Amiri',
                background: '#ecf0f1',
                padding: [5, 5, 5, 5],
                margin: [0, 10, 0, 5]
            },
            subsectionTitle: {
                fontSize: 14,
                bold: true,
                color: '#34495e',
                font: 'Amiri'
            },
            infoText: {
                fontSize: 10,
                color: '#7f8c8d',
                font: 'Amiri'
            },
            statsList: {
                fontSize: 12,
                color: '#2c3e50',
                font: 'Amiri',
                lineHeight: 1.5
            },
            subjectDetail: {
                fontSize: 10,
                color: '#34495e',
                font: 'Amiri'
            },
            footer: {
                fontSize: 8,
                color: '#95a5a6',
                font: 'Amiri'
            }
        },
        
        // إعدادات الصفحة
        pageOrientation: 'portrait',
        pageSize: 'A4',
        pageMargins: [20, 30, 20, 30]
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    
    return new Promise(function(resolve, reject) {
        const chunks = [];
        pdfDoc.on('data', function(chunk) {
            chunks.push(chunk);
        });
        pdfDoc.on('end', function() {
            const buffer = Buffer.concat(chunks);
            const media = new MessageMedia(
                'application/pdf',
                buffer.toString('base64'),
                `تقرير_إحصائي_${new Date().toISOString().split('T')[0]}.pdf`
            );
            resolve(media);
        });
        pdfDoc.on('error', reject);
        pdfDoc.end();
    });
}

/**
 * @description ينشئ شهادة حضور لمحاضرة معينة.
 * @param {Object} lectureData - بيانات المحاضرة.
 * @param {string} studentName - اسم الطالب.
 * @returns {Promise<MessageMedia>} كائن MessageMedia يحتوي على ملف PDF.
 */
async function generateAttendanceCertificate(lectureData, studentName) {
    if (!checkFonts()) {
        throw new Error('الخطوط المطلوبة لإنشاء PDF غير موجودة.');
    }

    const fonts = {
        Amiri: {
            normal: path.join(FONTS_DIR, 'Amiri-Regular.ttf'),
            bold: path.join(FONTS_DIR, 'Amiri-Bold.ttf'),
            italics: path.join(FONTS_DIR, 'Amiri-Regular.ttf'),
            bolditalics: path.join(FONTS_DIR, 'Amiri-Bold.ttf')
        }
    };

    const printer = new PdfPrinter(fonts);

    const docDefinition = {
        // إضافة خلفية للصفحة
        background: function(currentPage, pageSize) {
            return [
                {
                    canvas: [
                        {
                            type: 'rect',
                            x: 0,
                            y: 0,
                            w: pageSize.width,
                            h: pageSize.height,
                            color: '#f8f9fa'
                        }
                    ]
                },
                {
                    canvas: [
                        {
                            type: 'rect',
                            x: 50,
                            y: 50,
                            w: pageSize.width - 100,
                            h: pageSize.height - 100,
                            color: '#ffffff',
                            lineWidth: 2,
                            lineColor: '#3498db'
                        }
                    ]
                }
            ];
        },
        
        // محتوى المستند
        content: [
            // العنوان الرئيسي
            {
                text: 'شهادة حضور',
                style: 'certificateTitle',
                alignment: 'center',
                margin: [0, 60, 0, 20]
            },
            
            // زخرفة
            {
                canvas: [
                    {
                        type: 'line',
                        x1: 150,
                        y1: 0,
                        x2: 400,
                        y2: 0,
                        lineWidth: 1,
                        lineColor: '#3498db'
                    }
                ],
                margin: [0, 0, 0, 30]
            },
            
            // النص الرئيسي
            {
                text: 'تشهد إدارة النظام بأن الطالب/ة:',
                style: 'certificateText',
                alignment: 'center',
                margin: [0, 0, 0, 10]
            },
            
            {
                text: studentName,
                style: 'studentName',
                alignment: 'center',
                margin: [0, 0, 0, 10]
            },
            
            {
                text: 'قد حضر/ت المحاضرة التالية:',
                style: 'certificateText',
                alignment: 'center',
                margin: [0, 0, 0, 10]
            },
            
            // تفاصيل المحاضرة
            {
                columns: [
                    {
                        text: `المادة: ${lectureData.subject_name}`,
                        style: 'lectureDetails',
                        alignment: 'right'
                    },
                    {
                        text: `رقم المحاضرة: ${lectureData.lecture_number}`,
                        style: 'lectureDetails',
                        alignment: 'left'
                    }
                ],
                margin: [0, 20, 0, 10]
            },
            
            {
                columns: [
                    {
                        text: `الأستاذ: ${lectureData.professor_name}`,
                        style: 'lectureDetails',
                        alignment: 'right'
                    },
                    {
                        text: `التاريخ: ${new Date(lectureData.created_at).toLocaleDateString('ar-EG')}`,
                        style: 'lectureDetails',
                        alignment: 'left'
                    }
                ],
                margin: [0, 0, 0, 40]
            },
            
            // التوقيع
            {
                columns: [
                    {
                        text: 'توقيع الإدارة',
                        style: 'signature',
                        alignment: 'right'
                    },
                    {
                        text: 'توقيع الطالب',
                        style: 'signature',
                        alignment: 'left'
                    }
                ],
                margin: [0, 0, 0, 20]
            }
        ],
        
        // أنماط التنسيق
        styles: {
            certificateTitle: {
                fontSize: 28,
                bold: true,
                color: '#2c3e50',
                font: 'Amiri',
                decoration: 'underline',
                decorationStyle: 'double',
                decorationColor: '#3498db'
            },
            certificateText: {
                fontSize: 14,
                color: '#2c3e50',
                font: 'Amiri'
            },
            studentName: {
                fontSize: 18,
                bold: true,
                color: '#3498db',
                font: 'Amiri',
                decoration: 'underline',
                decorationColor: '#3498db'
            },
            lectureDetails: {
                fontSize: 12,
                color: '#34495e',
                font: 'Amiri'
            },
            signature: {
                fontSize: 12,
                color: '#7f8c8d',
                font: 'Amiri'
            }
        },
        
        // إعدادات الصفحة
        pageOrientation: 'portrait',
        pageSize: 'A4',
        pageMargins: [20, 20, 20, 20]
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    
    return new Promise(function(resolve, reject) {
        const chunks = [];
        pdfDoc.on('data', function(chunk) {
            chunks.push(chunk);
        });
        pdfDoc.on('end', function() {
            const buffer = Buffer.concat(chunks);
            const media = new MessageMedia(
                'application/pdf',
                buffer.toString('base64'),
                `شهادة_حضور_${studentName}_${new Date().toISOString().split('T')[0]}.pdf`
            );
            resolve(media);
        });
        pdfDoc.on('error', reject);
        pdfDoc.end();
    });
}

/**
 * @description يعالج الأمر لإنشاء جدول محاضرات أنيق.
 * @param {Message} message - كائن الرسالة من whatsapp-web.js.
 * @param {Client} client - كائن عميل whatsapp-web.js.
 */
async function handleElegantTableCommand(message, client) {
    const chat = await message.getChat();
    if (!chat.isGroup) {
        await message.reply(`⚠️ هذا الأمر يعمل في المجموعات فقط!${SIGNATURE}`);
        return;
    }

    await message.react('📊');
    await message.reply(`🔄 *جاري إنشاء جدول المحاضرات الأنيق...*`);

    try {
        const lectures = await db.getAllLectures();
        
        if (lectures.length === 0) {
            await message.reply(`⚠️ لا توجد محاضرات لإنشاء جدول لها.${SIGNATURE}`);
            return;
        }
        
        const media = await generateLecturesTablePDF(lectures);
        
        await client.sendMessage(chat.id._serialized, media, {
            caption: `📊 *جدول المحاضرات الأنيق*\n\nتم إنشاء الجدول بنجاح بتصميم عصري وجذاب.${SIGNATURE}`
        });
    } catch (error) {
        console.error('[❌] Error generating elegant table:', error);
        await message.reply(`⚠️ حدث خطأ أثناء إنشاء جدول المحاضرات: ${error.message}${SIGNATURE}`);
    }
}

/**
 * @description يعالج الأمر لإنشاء تقرير إحصائي.
 * @param {Message} message - كائن الرسالة من whatsapp-web.js.
 * @param {Client} client - كائن عميل whatsapp-web.js.
 */
async function handleStatisticsCommand(message, client) {
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

    await message.react('📈');
    await message.reply(`🔄 *جاري إنشاء التقرير الإحصائي...*`);

    try {
        const lectures = await db.getAllLectures();
        
        if (lectures.length === 0) {
            await message.reply(`⚠️ لا توجد محاضرات لإنشاء تقرير إحصائي.${SIGNATURE}`);
            return;
        }
        
        // تجميع الإحصائيات
        const statsData = {
            totalLectures: lectures.length,
            totalSections: new Set(lectures.map(function(l) { return l.section_name; })).size,
            totalSubjects: new Set(lectures.map(function(l) { return l.subject_name; })).size,
            totalProfessors: new Set(lectures.map(function(l) { return l.professor_name; })).size,
            sections: []
        };
        
        // تجميع بيانات الشعب
        const sectionsMap = new Map();
        lectures.forEach(function(lecture) {
            if (!sectionsMap.has(lecture.section_name)) {
                sectionsMap.set(lecture.section_name, {
                    name: lecture.section_name,
                    total: 0,
                    subjects: new Map()
                });
            }
            
            const section = sectionsMap.get(lecture.section_name);
            section.total += 1;
            
            if (!section.subjects.has(lecture.subject_name)) {
                section.subjects.set(lecture.subject_name, 0);
            }
            
            section.subjects.set(lecture.subject_name, section.subjects.get(lecture.subject_name) + 1);
        });
        
        statsData.sections = Array.from(sectionsMap.values());
        
        const media = await generateStatisticsPDF(statsData);
        
        await client.sendMessage(chat.id._serialized, media, {
            caption: `📈 *التقرير الإحصائي*\n\nتم إنشاء التقرير بنجاح بتصميم احترافي.${SIGNATURE}`
        });
    } catch (error) {
        console.error('[❌] Error generating statistics:', error);
        await message.reply(`⚠️ حدث خطأ أثناء إنشاء التقرير الإحصائي: ${error.message}${SIGNATURE}`);
    }
}

/**
 * @description يعالج الأمر لإنشاء شهادة حضور.
 * @param {Message} message - كائن الرسالة من whatsapp-web.js.
 * @param {Client} client - كائن عميل whatsapp-web.js.
 */
async function handleCertificateCommand(message, client) {
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

    // استخراج اسم الطالب من الرسالة
    const studentName = message.body.split(' ').slice(1).join(' ').trim();
    if (!studentName) {
        await message.reply(`⚠️ يرجى إرسال اسم الطالب بعد الأمر. مثال: !شهادة أحمد محمد${SIGNATURE}`);
        return;
    }

    await message.react('📜');
    await message.reply(`🔄 *جاري إنشاء شهادة الحضور...*`);

    try {
        const lectures = await db.getAllLectures();
        
        if (lectures.length === 0) {
            await message.reply(`⚠️ لا توجد محاضرات لإنشاء شهادة.${SIGNATURE}`);
            return;
        }
        
        // اختيار آخر محاضرة
        const lastLecture = lectures[0];
        
        const media = await generateAttendanceCertificate(lastLecture, studentName);
        
        await client.sendMessage(chat.id._serialized, media, {
            caption: `📜 *شهادة الحضور*\n\nتم إنشاء شهادة حضور للطالب/ة ${studentName} بنجاح.${SIGNATURE}`
        });
    } catch (error) {
        console.error('[❌] Error generating certificate:', error);
        await message.reply(`⚠️ حدث خطأ أثناء إنشاء شهادة الحضور: ${error.message}${SIGNATURE}`);
    }
}

module.exports = {
    '!جدول_أنيق': handleElegantTableCommand,
    '!elegant_table': handleElegantTableCommand,
    '!تقرير_إحصائي': handleStatisticsCommand,
    '!statistics': handleStatisticsCommand,
    '!شهادة': handleCertificateCommand,
    '!certificate': handleCertificateCommand,
    generateLecturesTablePDF,
    generateStatisticsPDF,
    generateAttendanceCertificate,
};