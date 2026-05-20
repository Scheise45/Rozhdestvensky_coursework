// ============================================
// 1. Базовые функции загрузки файлов
// ============================================

async function loadTxtFile(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Ошибка HTTP: ${response.status}`);
        const text = await response.text();
        return text;
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        return null;
    }
}

// ============================================
// 2. Биография (с содержанием, цитатами, картинками)
// ============================================

let biographyContents = [];

async function loadBiography() {
    const container = document.getElementById('biography-content');
    const navContainer = document.getElementById('biography-nav');

    if (!container) return;

    container.innerHTML = '⏳ Загрузка биографии...';

    const content = await loadTxtFile('../data/biography.txt');

    if (!content) {
        container.innerHTML = '❌ Не удалось загрузить биографию. Проверьте наличие файла data/biography.txt';
        return;
    }

    // --- 2.1 Парсим оглавление [CONTENTS]...[ENDCONTENTS] ---
    const contentsMatch = content.match(/\[CONTENTS\]([\s\S]*?)\[ENDCONTENTS\]/);
    if (contentsMatch && navContainer) {
        biographyContents = contentsMatch[1]
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.startsWith('['));

        navContainer.innerHTML = `
            <div class="biography-toc">
                <h3>📑 Содержание</h3>
                <ul>
                    ${biographyContents.map(title => {
                        const sectionId = title.replace(/[^а-яА-ЯёЁa-zA-Z0-9]/g, '_');
                        return `<li><a href="#" onclick="window.scrollToSection('${sectionId}'); return false;">${title}</a></li>`;
                    }).join('')}
                </ul>
            </div>
        `;
    } else if (navContainer) {
        navContainer.innerHTML = '<div class="biography-toc"><p>📑 Оглавление не найдено</p></div>';
    }

    // --- 2.2 Убираем блок CONTENTS из текста ---
    let htmlContent = content.replace(/\[CONTENTS\][\s\S]*?\[ENDCONTENTS\]/, '');

    // --- 2.3 Заменяем [H2]...[/H2] на заголовки с id ---
    htmlContent = htmlContent.replace(/\[H2\]([\s\S]*?)\[\/H2\]/g, (match, title) => {
        const sectionId = title.replace(/[^а-яА-ЯёЁa-zA-Z0-9]/g, '_');
        return `<h2 id="${sectionId}" class="bio-section">${title}</h2>`;
    });

    // --- 2.4 Заменяем [CITATE]...[/CITATE] на цитаты ---
    htmlContent = htmlContent.replace(/\[CITATE\]([\s\S]*?)\[\/CITATE\]/g, '<blockquote class="bio-quote">$1</blockquote>');

    // --- 2.5 Заменяем [IMG:номер] на картинки ---
    htmlContent = htmlContent.replace(/\[IMG:(\d+)\]/g, (match, num) => {
        return `<img src="../images/photo_${num}.png" class="bio-img" alt="Фото ${num}" onerror="this.src='https://via.placeholder.com/400x300?text=Фото+${num}'">`;
    });

    // --- 2.6 Преобразуем переносы строк в <br> ТОЛЬКО для обычного текста ---
    const lines = htmlContent.split('\n');
    let result = '';

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Пропускаем пустые строки, которые идут перед/после тегов
        const isTagLine = line.trim().startsWith('<h2') ||
                          line.trim().startsWith('</h2>') ||
                          line.trim().startsWith('<blockquote') ||
                          line.trim().startsWith('</blockquote>') ||
                          line.trim().startsWith('<img');

        if (isTagLine) {
            result += line + '\n';
        } else if (line.trim().length === 0) {
            // Добавляем один <br> для пустых строк, но не больше
            if (result.length > 0 && !result.endsWith('<br>\n') && !result.endsWith('>\n')) {
                result += '<br>\n';
            }
        } else {
            // Обычный текст - заменяем на текст + <br>
            result += line.trim() + '<br>\n';
        }
    }

    container.innerHTML = result;
}

// Функция плавного скролла к разделу (глобально доступна)
window.scrollToSection = function(sectionId) {
    const element = document.getElementById(sectionId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

// ============================================
// 3. Стихи
// ============================================

async function loadPoem(filename, titleElementId, textElementId) {
    const titleEl = document.getElementById(titleElementId);
    const textEl = document.getElementById(textElementId);

    if (!titleEl || !textEl) {
        console.error('Элементы не найдены', titleElementId, textElementId);
        return;
    }

    titleEl.textContent = '⏳ Загрузка...';
    textEl.innerHTML = '<em>Загрузка стихотворения...</em>';

    const content = await loadTxtFile(`../data/poems/${filename}`);

    if (content) {
        let displayTitle = filename.replace('.txt', '');
        const titleMap = {
            'malo': 'Человеку надо мало…',
            'rekvium': 'Реквием (Вечная слава героям)',
            'echo': 'Эхо любви',
            'kraski': 'Баллада о красках',
            'pozvoni': 'Позвони мне, позвони',
            'tobe': 'Только тебе',
            'pervymi': 'Если вы есть — будьте первыми',
            'lyubvi': 'Всё начинается с любви',
            'on_ona': 'Он и она'
        };
        displayTitle = titleMap[displayTitle] || displayTitle;

        titleEl.textContent = displayTitle;
        textEl.innerHTML = content.replace(/\n/g, '<div class="line-break"></div>');    } else {
        titleEl.textContent = '❌ Ошибка загрузки';
        textEl.innerHTML = `❌ Не удалось загрузить стихотворение "${filename}".<br><br>
        🔍 Проверьте:<br>
        1. Файл существует в папке <strong>data/poems/${filename}</strong><br>
        2. Вы открываете сайт через веб-сервер (не напрямую file://)<br>
        3. В консоли браузера (F12) нет ошибок CORS`;
    }
}

async function loadDefaultPoem() {
    await loadPoem('malo.txt', 'poemTitle', 'poemText');
}

// ============================================
// 4. Вспомогательная функция для фото (если нужно)
// ============================================

// Функция для принудительной замены формата фото (jpg -> png)
// Вызовите её вручную, если нужно поменять все фото на PNG
function switchPhotoFormatToPNG() {
    const allImages = document.querySelectorAll('.bio-img');
    allImages.forEach(img => {
        const currentSrc = img.src;
        if (currentSrc.includes('.jpg')) {
            img.src = currentSrc.replace('.jpg', '.png');
        }
    });
}
