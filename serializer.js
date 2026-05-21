// ========== ЯДРО АЛГОРИТМА ==========

/**
 * Сериализация массива чисел в компактную ASCII-строку
 * @param {number[]} numbers - массив чисел от 1 до 300
 * @returns {string} сжатая строка
 */
function serialize(numbers) {
  if (!numbers || numbers.length === 0) return "";

  // Валидация чисел
  for (let num of numbers) {
    if (num < 1 || num > 300) {
      throw new Error(`Число ${num} вне допустимого диапазона (1-300)`);
    }
  }

  // Упаковка: 9 бит на число
  let packed = 0n;
  for (let i = 0; i < numbers.length; i++) {
    packed = (packed << 9n) | BigInt(numbers[i] - 1);
  }

  const totalBits = numbers.length * 9;
  const byteLength = Math.ceil(totalBits / 8);

  // BigInt → байтовый массив (big-endian)
  const bytes = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    const shift = BigInt((byteLength - 1 - i) * 8);
    bytes[i] = Number((packed >> shift) & 0xFFn);
  }

  return base85Encode(bytes);
}

/**
 * Десериализация из ASCII-строки обратно в массив чисел
 * @param {string} str - сжатая строка
 * @returns {number[]} массив чисел
 */
function deserialize(str) {
  if (!str || str.length === 0) return [];

  const bytes = base85Decode(str);

  // Байты → BigInt
  let packed = 0n;
  for (let i = 0; i < bytes.length; i++) {
    packed = (packed << 8n) | BigInt(bytes[i]);
  }

  const totalBits = bytes.length * 8;
  const numCount = Math.floor(totalBits / 9);
  const numbers = [];

  for (let i = numCount - 1; i >= 0; i--) {
    const val = Number((packed >> BigInt(i * 9)) & 0x1FFn);
    numbers.push(val + 1);
  }

  return numbers;
}

// ========== BASE85 (ASCII85) ==========

function base85Encode(bytes) {
  const n = bytes.length;
  const r = n % 4;
  const padded = new Uint8Array(n + (4 - r) % 4);
  padded.set(bytes);

  let result = "";
  for (let i = 0; i < padded.length; i += 4) {
    let word = 0;
    word |= padded[i] << 24;
    word |= padded[i + 1] << 16;
    word |= padded[i + 2] << 8;
    word |= padded[i + 3];

    if (word === 0 && i + 4 <= n) {
      result += "z";
    } else {
      const block = [0, 0, 0, 0, 0];
      for (let j = 4; j >= 0; j--) {
        block[j] = word % 85;
        word = Math.floor(word / 85);
      }
      for (let j = 0; j < 5; j++) {
        result += String.fromCharCode(block[j] + 33);
      }
    }
  }

  const outLen = Math.ceil((n * 5) / 4);
  return result.slice(0, outLen);
}

function base85Decode(str) {
  const bytes = [];
  let i = 0;

  while (i < str.length) {
    if (str[i] === 'z') {
      bytes.push(0, 0, 0, 0);
      i++;
      continue;
    }

    const block = [0, 0, 0, 0, 0];
    for (let j = 0; j < 5; j++) {
      if (i + j >= str.length) break;
      block[j] = str.charCodeAt(i + j) - 33;
    }

    let word = 0;
    for (let j = 0; j < 5; j++) {
      word = word * 85 + block[j];
    }

    bytes.push((word >> 24) & 0xFF);
    bytes.push((word >> 16) & 0xFF);
    bytes.push((word >> 8) & 0xFF);
    bytes.push(word & 0xFF);

    i += 5;
  }

  while (bytes.length > 0 && bytes[bytes.length - 1] === 0) {
    bytes.pop();
  }

  return new Uint8Array(bytes);
}

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

function simpleSerialize(numbers) {
  return numbers.join(',');
}

function compressionRatio(original, compressed) {
  return (original.length / compressed.length).toFixed(2);
}

function parseInput(str) {
  // Разделяем по запятым, пробелам, табуляции
  const parts = str.split(/[,\s]+/);
  const numbers = [];
  for (let part of parts) {
    if (part.trim() === "") continue;
    const num = parseInt(part.trim(), 10);
    if (isNaN(num)) continue;
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

    // Сравнение множеств (порядок не важен)
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
    results.push(runSingleTest(testCase));
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
                    <div class="test-desc">Ошибка: ${result.error}</div>
                </div>
            `;
    } else {
      const badgeClass = result.valid ? 'success' : 'error';
      const badgeText = result.valid ? '✓ ВЕРНО' : '✗ ОШИБКА';
      html += `
                <div class="test-card">
                    <div class="test-name">
                        ${result.name}
                        <span class="badge ${badgeClass}">${badgeText}</span>
                    </div>
                    <div class="test-desc">
                        Чисел: ${result.count}<br>
                        Простая: ${result.simpleLen} симв.<br>
                        Сжатая: ${result.compressedLen} симв.<br>
                        <strong>Коэффициент: ${result.ratio}x</strong>
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
  if (validResults.length === 0) return;

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
    showResult('error', 'Ошибка', 'Введите хотя бы одно число');
    return;
  }

  try {
    const compressed = serialize(numbers);
    const simple = simpleSerialize(numbers);
    const ratio = compressionRatio(simple, compressed);

    showResult('success', '✅ Сериализация выполнена', `
            <div class="result-item">
                <div class="result-label">Исходные числа</div>
                <div class="result-value">${numbers.slice(0, 20).join(', ')}${numbers.length > 20 ? '...' : ''}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Простая строка (${simple.length} симв.)</div>
                <div class="result-value">${simple.slice(0, 100)}${simple.length > 100 ? '...' : ''}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Сжатая строка (${compressed.length} симв.)</div>
                <div class="result-value" style="font-family: monospace;">${compressed}</div>
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
                <div class="result-label">Сжатая строка</div>
                <div class="result-value">${compressed}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Восстановленные числа (${numbers.length} шт.)</div>
                <div class="result-value">${numbers.slice(0, 30).join(', ')}${numbers.length > 30 ? '...' : ''}</div>
            </div>
            <div class="result-item">
                <div class="result-label">Простая строка (${simple.length} симв.)</div>
                <div class="result-value">${simple.slice(0, 100)}${simple.length > 100 ? '...' : ''}</div>
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

// Загружаем тесты при старте
window.addEventListener('DOMContentLoaded', () => {
  runAllTests();
});
