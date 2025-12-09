import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { callLLM } from './mentorpiece';

// 1. MOCKING (Обязательно)
// Мы мокаем глобальную функцию fetch, чтобы не делать реальных запросов к API.
// Это позволяет экономить трафик, токены и делает тесты быстрыми и предсказуемыми.
const fetchMock = vi.fn();
global.fetch = fetchMock;

describe('mentorpiece.ts - Unit Tests', () => {
  
  // Перед каждым тестом очищаем моки, чтобы тесты не влияли друг на друга
  beforeEach(() => {
    fetchMock.mockClear();
  });

  // Scenario: Positive Test
  // Проверка успешного выполнения функции (API возвращает 200 OK).
  it('callLLM should return response text when API call is successful', async () => {
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
    // Проверяем, что fetch был вызван с правильным URL и параметрами
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.mentorpiece.org/v1/process-ai-request",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model_name: "test-model", prompt: "test-prompt" })
      })
    );
  });

  // Scenario: Error Handling (API Error)
  // Проверяем, что функция выбрасывает ошибку, если API возвращает статус не 200.
  it('callLLM should throw error when API returns 4xx/5xx status', async () => {
    // Arrange
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ message: "Something went wrong" }),
    });

    // Act & Assert
    // Используем reject.toThrow для проверки асинхронных ошибок
    await expect(callLLM("test-model", "test-prompt"))
      .rejects
      .toThrow("Something went wrong");
  });

  // Scenario: Error Handling (Network Error)
  // Проверяем, что функция корректно пробрасывает исключения сети (например, оффлайн).
  it('callLLM should throw error when network request fails', async () => {
    // Arrange
    fetchMock.mockRejectedValue(new Error("Network Error"));

    // Act & Assert
    await expect(callLLM("test-model", "test-prompt"))
      .rejects
      .toThrow("Network Error");
  });
});
