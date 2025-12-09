describe('AI Translator & Critic Flow', () => {
  // Перед каждым тестом мы настраиваем окружение
  beforeEach(() => {
    // 1. MOCKING СЕТЕВЫХ ЗАПРОСОВ
    // Мы используем cy.intercept(), чтобы перехватить запросы к реальному API.
    // Это изолирует тесты от внешнего мира, экономит деньги и делает тесты стабильными.

    // Mock 1: Перехват запроса на ПЕРЕВОД (Translate)
    // Мы ищем запрос, в теле которого есть model_name для перевода.
    cy.intercept('POST', 'https://api.mentorpiece.org/v1/process-ai-request', (req) => {
      if (req.body.model_name === 'Qwen/Qwen3-VL-30B-A3B-Instruct') {
        req.reply({
          statusCode: 200,
          body: { response: "Mocked Translation: The sun is shining." },
          delay: 500 // Добавляем небольшую задержку для реалистичности
        });
      }
    }).as('translateRequest'); // Даем алиас этому перехвату, чтобы потом ждать его

    // Mock 2: Перехват запроса на ОЦЕНКУ (Critique)
    // Мы ищем запрос, в теле которого есть model_name для критики.
    cy.intercept('POST', 'https://api.mentorpiece.org/v1/process-ai-request', (req) => {
      if (req.body.model_name === 'claude-sonnet-4-5-20250929') {
        req.reply({
          statusCode: 200,
          body: { response: "Mocked Grade: 9/10. Fluent and accurate." },
          delay: 500
        });
      }
    }).as('critiqueRequest');
  });

  it('should successfully translate text and provide critique', () => {
    // 1. Открываем приложение
    cy.visit('/');

    // 2. Ввод текста
    // Находим textarea по placeholder или типу и вводим текст
    cy.get('textarea[placeholder="Enter text to translate..."]')
      .should('be.visible')
      .type('Солнце светит.');

    // 3. Выбор языка
    // В текущей реализации (shadcn select) это немного сложнее, чем обычный select
    // Сначала открываем выпадающий список
    cy.contains('Select Language').click();
    // Выбираем опцию (English)
    cy.contains('English').click();

    // 4. Нажатие кнопки "Translate & Critique"
    // Примечание: В текущей реализации одна кнопка запускает оба процесса последовательно
    cy.contains('button', 'Translate & Critique').click();

    // 5. Проверка отправки запроса на перевод
    // cy.wait('@alias') ждет завершения перехваченного запроса
    cy.wait('@translateRequest').its('request.body').should('include', {
      prompt: "Translate the following text into English. Provide ONLY the translation, no introductory or concluding remarks.\n\nText to translate:\nСолнце светит."
    });

    // 6. Ожидание и проверка отображения перевода
    // Проверяем, что мокнутый ответ отобразился на странице
    cy.contains('Mocked Translation: The sun is shining.')
      .should('be.visible');

    // 7. Проверка отправки запроса на оценку
    // Так как процессы идут последовательно, второй запрос уйдет после получения первого ответа
    cy.wait('@critiqueRequest').its('request.body').should('include', {
      model_name: 'claude-sonnet-4-5-20250929'
    });

    // 8. Ожидание и проверка отображения оценки
    cy.contains('Mocked Grade: 9/10. Fluent and accurate.')
      .should('be.visible');
  });

  it('should handle API errors gracefully', () => {
    // Переопределяем моки для этого теста, чтобы они возвращали ошибку
    cy.intercept('POST', 'https://api.mentorpiece.org/v1/process-ai-request', {
      statusCode: 500,
      body: { message: "Internal Server Error from Mock" },
      delay: 100
    }).as('failedRequest');

    cy.visit('/');

    cy.get('textarea[placeholder="Enter text to translate..."]').type('Error test');
    cy.contains('button', 'Translate & Critique').click();

    // Ждем, пока запрос завершится ошибкой
    cy.wait('@failedRequest');

    // Проверяем, что появилось сообщение об ошибке (Toast)
    // Shadcn toast обычно появляется в div с role="status" или похожем
    cy.contains('Internal Server Error from Mock').should('be.visible');
  });
});
