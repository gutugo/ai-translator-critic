# AI Translator & Critic - Состояние проекта

## Что сделано

### Приложение
- **Frontend**: React + TypeScript + TailwindCSS + Shadcn/UI
- **Функционал**: Перевод текста через API MentorPiece + Критика перевода двумя AI моделями
- **Модели**: Qwen для перевода, Claude для критики
- **API**: https://api.mentorpiece.org/v1/process-ai-request (без авторизации)

### Автотесты (Доработки v2.0)
1. **Unit-тесты (Vitest)** - `client/src/lib/mentorpiece.test.ts`
   - 28 тестов, все проходят
   - Тесты констант MODELS, LANGUAGES
   - Тесты helper-функций (getTranslationPrompt, getCritiquePrompt)
   - Тесты API (callLLM) с mocking fetch
   - Интеграционные тесты полного цикла

2. **E2E-тесты (Cypress)** - `cypress/e2e/translator_critic.cy.js`
   - 25+ тестов
   - Initial Page Load (5 тестов)
   - Language Selection (5 тестов)
   - Text Input (4 теста)
   - Loading State (2 теста)
   - Happy Path (4 теста)
   - Error Handling (4 теста)
   - Accessibility (4 теста)
   - Performance (2 теста)

3. **Документация** - `AQA_README.txt`
   - Полная документация по тестам
   - Инструкции по запуску
   - Best Practices

## Ключевые файлы
- `client/src/lib/mentorpiece.ts` - API модуль
- `client/src/pages/Home.tsx` - Главная страница
- `vitest.config.ts` - Конфиг Vitest
- `cypress.config.js` - Конфиг Cypress

## Команды запуска тестов
```bash
npx vitest run        # Unit-тесты
npx cypress run       # E2E-тесты
```

## Известные проблемы
- `vitest.config.ts` имеет LSP warning (не критично, тесты работают)
- Cypress требует системные зависимости (установлены)
