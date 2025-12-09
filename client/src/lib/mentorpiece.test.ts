import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  callLLM, 
  MODELS, 
  LANGUAGES, 
  getTranslationPrompt, 
  getCritiquePrompt 
} from './mentorpiece';

// ============================================================================
// СЕКЦИЯ 1: MOCKING
// ============================================================================
// Мы мокаем глобальную функцию fetch, чтобы не делать реальных запросов к API.
// Это позволяет экономить трафик, токены и делает тесты быстрыми и предсказуемыми.
const fetchMock = vi.fn();
global.fetch = fetchMock;

// ============================================================================
// СЕКЦИЯ 2: ТЕСТЫ ДЛЯ КОНСТАНТ
// ============================================================================
// Проверяем, что константы определены правильно и содержат ожидаемые значения.
// Это важно для предотвращения случайных изменений в конфигурации.

describe('Constants - MODELS', () => {
  it('should have correct model name for translation (Qwen)', () => {
    // Проверяем, что модель для перевода имеет правильное название
    expect(MODELS.TRANSLATE).toBe('Qwen/Qwen3-VL-30B-A3B-Instruct');
  });

  it('should have correct model name for critique (Claude)', () => {
    // Проверяем, что модель для критики имеет правильное название
    expect(MODELS.CRITIQUE).toBe('claude-sonnet-4-5-20250929');
  });

  it('should have exactly 2 models defined', () => {
    // Проверяем, что определено ровно 2 модели
    expect(Object.keys(MODELS)).toHaveLength(2);
  });
});

describe('Constants - LANGUAGES', () => {
  it('should contain at least 5 languages', () => {
    // Минимальное количество языков для полноценного приложения
    expect(LANGUAGES.length).toBeGreaterThanOrEqual(5);
  });

  it('should include English as a language option', () => {
    // Английский должен быть в списке
    const hasEnglish = LANGUAGES.some(lang => lang.value === 'English');
    expect(hasEnglish).toBe(true);
  });

  it('should include Russian as a language option', () => {
    // Русский должен быть в списке (основной язык пользователей)
    const hasRussian = LANGUAGES.some(lang => lang.value === 'Russian');
    expect(hasRussian).toBe(true);
  });

  it('each language should have value and label properties', () => {
    // Проверяем структуру каждого объекта языка
    LANGUAGES.forEach(lang => {
      expect(lang).toHaveProperty('value');
      expect(lang).toHaveProperty('label');
      expect(typeof lang.value).toBe('string');
      expect(typeof lang.label).toBe('string');
    });
  });
});

// ============================================================================
// СЕКЦИЯ 3: ТЕСТЫ ДЛЯ HELPER-ФУНКЦИЙ (Prompt Generators)
// ============================================================================
// Эти функции формируют промпты для AI-моделей. Важно проверить,
// что они корректно включают пользовательский ввод в шаблон.

describe('Helper Functions - getTranslationPrompt', () => {
  it('should include the source text in the prompt', () => {
    const result = getTranslationPrompt('Привет мир', 'English');
    // Проверяем, что исходный текст включен в промпт
    expect(result).toContain('Привет мир');
  });

  it('should include the target language in the prompt', () => {
    const result = getTranslationPrompt('Hello', 'French');
    // Проверяем, что целевой язык указан в промпте
    expect(result).toContain('French');
  });

  it('should instruct to provide only translation without extra text', () => {
    const result = getTranslationPrompt('Test', 'German');
    // Проверяем наличие инструкции "только перевод"
    expect(result).toContain('ONLY the translation');
  });

  it('should handle empty text gracefully', () => {
    const result = getTranslationPrompt('', 'English');
    // Функция должна вернуть строку даже для пустого текста
    expect(typeof result).toBe('string');
    expect(result).toContain('English');
  });

  it('should handle special characters in text', () => {
    const specialText = 'Привет! "Тест" <script>alert(1)</script>';
    const result = getTranslationPrompt(specialText, 'English');
    // Специальные символы должны быть включены как есть
    expect(result).toContain(specialText);
  });
});

describe('Helper Functions - getCritiquePrompt', () => {
  it('should include original text in the prompt', () => {
    const result = getCritiquePrompt('Original', 'Translated');
    expect(result).toContain('Original');
  });

  it('should include translated text in the prompt', () => {
    const result = getCritiquePrompt('Original', 'Translated');
    expect(result).toContain('Translated');
  });

  it('should ask for a 1-10 scale evaluation', () => {
    const result = getCritiquePrompt('A', 'B');
    // Проверяем, что промпт запрашивает оценку по шкале
    expect(result).toMatch(/1.*10|scale/i);
  });

  it('should mention quality aspects (grammar, tone, accuracy)', () => {
    const result = getCritiquePrompt('Test', 'Test translation');
    // Проверяем упоминание критериев оценки
    expect(result.toLowerCase()).toMatch(/grammar|tone|accuracy/);
  });
});

// ============================================================================
// СЕКЦИЯ 4: ТЕСТЫ ДЛЯ ФУНКЦИИ callLLM
// ============================================================================

describe('callLLM - API Integration', () => {
  
  // Перед каждым тестом очищаем моки, чтобы тесты не влияли друг на друга
  beforeEach(() => {
    fetchMock.mockClear();
  });

  // Scenario: Positive Test
  // Проверка успешного выполнения функции (API возвращает 200 OK).
  it('should return response text when API call is successful', async () => {
    // Arrange (Подготовка)
    const mockResponse = { response: "Translated text" };
    
    // Настраиваем мок: fetch должен вернуть успешный ответ с нашим JSON
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => mockResponse,
    });

    // Act (Действие)
    const result = await callLLM("test-model", "test-prompt");

    // Assert (Проверка)
    expect(result).toBe("Translated text");
  });

  it('should call correct API endpoint', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ response: "OK" }),
    });

    await callLLM("test-model", "test-prompt");

    // Проверяем, что fetch был вызван с правильным URL
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mentorpiece.org/v1/process-ai-request",
      expect.anything()
    );
  });

  it('should send correct request body structure', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ response: "OK" }),
    });

    await callLLM("my-model", "my-prompt");

    // Проверяем структуру тела запроса
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_name: "my-model", prompt: "my-prompt" })
      })
    );
  });

  it('should use POST method', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ response: "OK" }),
    });

    await callLLM("model", "prompt");

    const [, options] = fetchMock.mock.calls[0];
    expect(options.method).toBe("POST");
  });

  // Scenario: Error Handling (API Error)
  it('should throw error when API returns 4xx status', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({ message: "Invalid request" }),
    });

    await expect(callLLM("test-model", "test-prompt"))
      .rejects
      .toThrow("Invalid request");
  });

  it('should throw error when API returns 5xx status', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ message: "Something went wrong" }),
    });

    await expect(callLLM("test-model", "test-prompt"))
      .rejects
      .toThrow("Something went wrong");
  });

  it('should handle API error without message field', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      statusText: "Service Unavailable",
      json: async () => ({}), // Пустой объект без message
    });

    // Должен использовать fallback сообщение
    await expect(callLLM("test-model", "test-prompt"))
      .rejects
      .toThrow(/503|Service Unavailable/);
  });

  // Scenario: Error Handling (Network Error)
  it('should throw error when network request fails', async () => {
    fetchMock.mockRejectedValue(new Error("Network Error"));

    await expect(callLLM("test-model", "test-prompt"))
      .rejects
      .toThrow("Network Error");
  });

  it('should throw error on connection timeout', async () => {
    fetchMock.mockRejectedValue(new Error("Connection timed out"));

    await expect(callLLM("test-model", "test-prompt"))
      .rejects
      .toThrow("Connection timed out");
  });

  it('should handle JSON parse error gracefully', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => { throw new Error("Invalid JSON"); },
    });

    // Даже если JSON не парсится, функция должна выбросить осмысленную ошибку
    await expect(callLLM("test-model", "test-prompt"))
      .rejects
      .toThrow();
  });
});

// ============================================================================
// СЕКЦИЯ 5: ИНТЕГРАЦИОННЫЕ ТЕСТЫ (Полный цикл)
// ============================================================================

describe('Integration - Full Translation Flow', () => {
  beforeEach(() => {
    fetchMock.mockClear();
  });

  it('should correctly handle translation workflow', async () => {
    // Мокаем успешный ответ
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ response: "Bonjour le monde" }),
    });

    // Формируем промпт и отправляем
    const prompt = getTranslationPrompt("Hello world", "French");
    const result = await callLLM(MODELS.TRANSLATE, prompt);

    // Проверяем результат
    expect(result).toBe("Bonjour le monde");
    
    // Проверяем, что использовалась правильная модель
    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.model_name).toBe(MODELS.TRANSLATE);
  });

  it('should correctly handle critique workflow', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ response: "9/10 - Excellent translation" }),
    });

    const prompt = getCritiquePrompt("Hello", "Bonjour");
    const result = await callLLM(MODELS.CRITIQUE, prompt);

    expect(result).toBe("9/10 - Excellent translation");
    
    const [, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.model_name).toBe(MODELS.CRITIQUE);
  });
});
