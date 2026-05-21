// ========== ЯДРО АЛГОРИТМА ==========

/**
 * Сериализация массива чисел в компактную ASCII-строку
 * Используем: 9 бит на число → упаковка в байты → Base64
 */
function serialize(numbers) {
  if (!numbers || numbers.length === 0) return "";

  // Валидация
  for (let num of numbers) {
    if (num < 1 || num > 300) {
      throw new Error(`Число ${num} вне диапазона (1-300)`);
    }
  }

  // Упаковываем все числа в битовый поток (9 бит на число)
  const bits = [];
  for (let num of numbers) {
    const val = num - 1; // 0..299
    for (let b = 8; b >= 0; b--) {
      bits.push((val >> b) & 1);
    }
  }

  // Добиваем до кратности 8
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  // Преобразуем биты в байты
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) {
      byte = (byte << 1) | bits[i + j];
    }
    bytes.push(byte);
  }

  // Кодируем в Base64 (надежно и везде работает)
  const binaryString = String.fromCharCode(...bytes);
  const base64 = btoa(binaryString);

  // Добавляем префикс с количеством чисел (для корректной десериализации)
  const countHex = numbers.length.toString(16).padStart(4, '0');
  return countHex + base64;
}

/**
 * Десериализация из строки обратно в массив чисел
 */
function deserialize(serializedStr) {
  if (!serializedStr || serializedStr.length < 4) return [];

  // Извлекаем количество чисел (первые 4 символа — hex)
  const countHex = serializedStr.slice(0, 4);
  const expectedCount = parseInt(countHex, 16);
  const base64 = serializedStr.slice(4);

  // Декодируем Base64
  const binaryString = atob(base64);
  const bytes = [];
  for (let i = 0; i < binaryString.length; i++) {
    bytes.push(binaryString.charCodeAt(i));
  }

  // Преобразуем байты в биты
  const bits = [];
  for (let byte of bytes) {
    for (let b = 7; b >= 0; b--) {
      bits.push((byte >> b) & 1);
    }
  }

  // Извлекаем числа по 9 бит
  const numbers = [];
  for (let i = 0; i < bits.length && numbers.length < expectedCount; i += 9) {
    if (i + 9 > bits.length) break;
    let val = 0;
    for (let j = 0; j < 9; j++) {
      val = (val << 1) | bits[i + j];
    }
    numbers.push(val + 1);
  }

  return numbers;
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function simpleSerialize(numbers) {
  return numbers.join(',');
}

function compressionRatio(original, compressed) {
  if (compressed.length === 0) return "0";
  return (original.length / compressed.length).toFixed(2);
}

function parseInput(str) {
  const parts = str.split(/[,\s]+/);
  const numbers = [];
  for (let part of parts) {
    if (part.trim() === "") continue;
    const num = parseInt(part.trim(), 10);
    if (isNaN(num)) continue;
    if (num < 1 || num > 300) continue;
    numbers.push(num);
  }
  return numbers;
}

// ========== ГЕНЕРАТОРЫ ТЕСТОВ ==========

function randomNumbers(count, min = 1, max = 300) {
  const nums = [];
  for (let i = 0; i < count; i++) {
    nums.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return nums;
}

function allOneDigit() {
  const nums = [];
  for (let i = 1; i <= 9; i++) nums.push(i);
  return nums;
}

function allTwoDigit() {
  const nums = [];
  for (let i = 10; i <= 99; i++) nums.push(i);
  return nums;
}

function allThreeDigit() {
  const nums = [];
  for (let i = 100; i <= 300; i++) nums.push(i);
  return nums;
}

function eachNumberThreeTimes() {
  const nums = [];
  for (let i = 1; i <= 300; i++) {
    nums.push(i, i, i);
  }
  return nums;
}

// ========== ТЕСТЫ ==========

const testCases = [
  { name: "Короткий пример", generator: () => [1, 300, 237, 188] },
  { name: "Случайные 50 чисел", generator: () => randomNumbers(50) },
  { name: "Случайные 100 чисел", generator: () => randomNumbers(100) },
  { name: "Случайные 500 чисел", generator: () => randomNumbers(500) },
  { name: "Случайные 1000 чисел", generator: () => randomNumbers(1000) },
  { name: "Граничный: все 1-значные (1-9)", generator: allOneDigit },
  { name: "Граничный: все 2-значные (10-99)", generator: allTwoDigit },
  { name: "Граничный: все 3-значные (100-300)", generator: allThreeDigit },
  { name: "Каждое число ×3 (всего 900)", generator: eachNumberThreeTimes }
];

function runSingleTest(testCase) {
  try {
    const numbers = testCase.generator();
    const simple = simpleSerialize(numbers);
    const compressed = serialize(numbers);
    const decompressed = deserialize(compressed);

    // Сравнение содержимого (порядок не важен)
    const sortedOrig = [...numbers].sort((a, b) => a - b);
    const sortedDecomp = [...decompressed].sort((a, b) => a - b);
    const isValid = JSON.stringify(sortedOrig) === JSON.stringify(sortedDecomp);

    const ratio = compressionRatio(simple, compressed);

    return {
      name: testCase.name,
      count: numbers.length,
      simpleLen: simple.length,
      compressedLen: compressed.length,
      ratio: ratio,
      valid: isValid,
      compressed: compressed
    };
  } catch (error) {
    console.error(`Ошибка в тесте ${testCase.name}:`, error);
    return {
      name: testCase.name,
      error: error.message,
      valid: false
    };
  }
}

function runAllTests() {
  const results = [];
  for (let testCase of testCases) {
    const result = runSingleTest(testCase);
    results.push(result);
  }
  displayTestResults(results);
  updateStats(results);
}

function displayTestResults(results) {
  const container = document.getElementById('testResults');
  if (!container) return;

  let html = '<div class="test-grid">';
  for (let result of results) {
    if (result.error) {
      html += `
                <div class="test-card">
                    <div class="test-name">❌ ${result.name}</div>
                    <div class="test-desc" style="color: red;">Ошибка: ${result.error}</div>
                </div>
            `;
    } else {
      const badgeClass = result.valid ? 'success' : 'error';
      const badgeText = result.valid ? '✓ ВЕРНО' : '✗ ОШИБКА';
      const ratioColor = parseFloat(result.ratio) >= 2 ? '#28a745' : (parseFloat(result.ratio) >= 1.5 ? '#ffc107' : '#dc3545');
      html += `
                <div class="test-card">
                    <div class="test-name">
                        ${result.name}
                        <span class="badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="test-desc">
                        📊 Чисел: ${result.count}<br>
                        📝 Простая: ${result.simpleLen} симв.<br>
                        🗜️ Сжатая: ${result.compressedLen} симв.<br>
                        <strong style="color: ${ratioColor};">📈 Коэффициент: ${result.ratio}x</strong>
                    </div>
                </div>
            `;
    }
  }
  html += '</div>';
  container.innerHTML = html;
}

function clearTests() {
  const container = document.getElementById('testResults');
  if (container) container.innerHTML = '';
}

function updateStats(results) {
  const validResults = results.filter(r => !r.error && r.valid);
  if (validResults.length === 0) {
    const statsArea = document.getElementById('statsArea');
    if (statsArea) statsArea.innerHTML = '<p style="color: #666;">Нет данных для статистики</p>';
    return;
  }

  const avgRatio = validResults.reduce((sum, r) => sum + parseFloat(r.ratio), 0) / validResults.length;
  const bestRatio = Math.max(...validResults.map(r => parseFloat(r.ratio)));
  const worstRatio = Math.min(...validResults.map(r => parseFloat(r.ratio)));
  const avgCompressedLen = validResults.reduce((sum, r) => sum + r.compressedLen, 0) / validResults.length;

  const statsHtml = `
        <div class="stats">
            <div class="stat-card">
                <div class="stat-label">Средний коэффициент</div>
                <div class="stat-value">${avgRatio.toFixed(2)}x</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Лучший коэффициент</div>
                <div class="stat-value">${bestRatio.toFixed(2)}x</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Худший коэффициент</div>
                <div class="stat-value">${worstRatio.toFixed(2)}x</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Средняя длина сжатой строки</div>
                <div class="stat-value">${Math.round(avgCompressedLen)}</div>
            </div>
        </div>
    `;

  const statsArea = document.getElementById('statsArea');
  if (statsArea) statsArea.innerHTML = statsHtml;
}

// ========== UI ОБРАБОТЧИКИ ==========

function processSerialize() {
  const input = document.getElementById('inputNumbers').value;
  const numbers = parseInput(input);

  if (numbers.length === 0) {
    showResult('error', 'Ошибка', 'Введите хотя бы одно число (1-300)');
    return;
  }

  try {
    const compressed = serialize(numbers);
    const simple = simpleSerialize(numbers);
    const ratio = compressionRatio(simple, compressed);

    showResult('success', '✅ Сериализация выполнена', `
            <div class="result-item">
                <div class="result-label">Исходные числа (${numbers.length} шт.)</div>
                <div class="result-value">${numbers.slice(0, 20).join(', ')}${numbers.length > 20 ? '...' : ''}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Простая строка (${simple.length} симв.)</div>
                <div class="result-value" style="word-break: break-all;">${simple.slice(0, 200)}${simple.length > 200 ? '...' : ''}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Сжатая строка (${compressed.length} симв.)</div>
                <div class="result-value" style="font-family: monospace; word-break: break-all;">${compressed}</div>
            </div>
            <div class="stat-card" style="background: linear-gradient(135deg, #28a745, #20c997);">
                <div class="stat-label">Коэффициент сжатия</div>
                <div class="stat-value">${ratio}x</div>
            </div>
        `);
  } catch (error) {
    showResult('error', 'Ошибка сериализации', error.message);
  }
}

function processDeserialize() {
  const input = document.getElementById('inputNumbers').value;
  const compressed = input.trim();

  if (!compressed) {
    showResult('error', 'Ошибка', 'Введите сжатую строку');
    return;
  }

  try {
    const numbers = deserialize(compressed);
    const simple = simpleSerialize(numbers);

    showResult('success', '✅ Десериализация выполнена', `
            <div class="result-item">
                <div class="result-label">Сжатая строка (${compressed.length} симв.)</div>
                <div class="result-value" style="font-family: monospace;">${compressed}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Восстановленные числа (${numbers.length} шт.)</div>
                <div class="result-value">${numbers.slice(0, 30).join(', ')}${numbers.length > 30 ? '...' : ''}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Простая строка (${simple.length} симв.)</div>
                <div class="result-value" style="word-break: break-all;">${simple.slice(0, 200)}${simple.length > 200 ? '...' : ''}</div>
            </div>
        `);
  } catch (error) {
    showResult('error', 'Ошибка десериализации', error.message);
  }
}

function showResult(type, title, content) {
  const container = document.getElementById('resultArea');
  const bgColor = type === 'success' ? '#d4edda' : '#f8d7da';
  const borderColor = type === 'success' ? '#28a745' : '#dc3545';

  container.innerHTML = `
        <div class="result" style="background: ${bgColor}; border-left: 4px solid ${borderColor};">
            <h3 style="color: ${borderColor};">${title}</h3>
            ${content}
        </div>
    `;
}

function clearAll() {
  document.getElementById('inputNumbers').value = '';
  document.getElementById('resultArea').innerHTML = '';
}

function loadExample() {
  document.getElementById('inputNumbers').value = '1, 300, 237, 188';
  processSerialize();
}

// Автозапуск тестов при загрузке
window.addEventListener('DOMContentLoaded', () => {
  console.log("Приложение загружено, запускаем тесты...");
  runAllTests();
});
