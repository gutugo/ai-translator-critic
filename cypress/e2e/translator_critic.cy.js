// ============================================================================
// E2E ТЕСТЫ ДЛЯ AI TRANSLATOR & CRITIC
// ============================================================================
// Эти тесты проверяют пользовательский интерфейс и взаимодействие с API.
// Мы используем cy.intercept() для мокирования сетевых запросов,
// чтобы тесты были быстрыми, стабильными и не тратили токены AI.

describe('AI Translator & Critic - UI Tests', () => {

  // ==========================================================================
  // СЕКЦИЯ 1: ТЕСТЫ НАЧАЛЬНОГО СОСТОЯНИЯ UI
  // ==========================================================================
  // Проверяем, что все элементы интерфейса отображаются корректно при загрузке.

  describe('Initial Page Load', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should display the application title', () => {
      // Заголовок приложения должен быть виден
      cy.contains('AI Translator & Critic').should('be.visible');
    });

    it('should display the text input area', () => {
      // Поле ввода текста должно быть доступно
      cy.get('textarea[placeholder="Enter text to translate..."]')
        .should('be.visible')
        .and('be.empty');
    });

    it('should display the language selector', () => {
      // Селектор языка должен быть виден
      cy.get('button[role="combobox"]').should('be.visible');
    });

    it('should display the translate button', () => {
      // Кнопка перевода должна быть видимой и активной
      cy.contains('button', 'Translate & Critique')
        .should('be.visible')
        .and('not.be.disabled');
    });

    it('should show "Ready to translate" placeholder when no results', () => {
      // До выполнения перевода должен отображаться placeholder
      cy.contains('Ready to translate').should('be.visible');
    });
  });

  // ==========================================================================
  // СЕКЦИЯ 2: ТЕСТЫ ВЫБОРА ЯЗЫКА
  // ==========================================================================
  // Проверяем работу выпадающего списка с языками.

  describe('Language Selection', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should have English selected by default', () => {
      // По умолчанию выбран английский язык
      cy.get('button[role="combobox"]').should('contain.text', 'English');
    });

    it('should open language dropdown on click', () => {
      // Клик открывает выпадающий список
      cy.get('button[role="combobox"]').click();
      cy.get('[role="listbox"]').should('be.visible');
    });

    it('should display all available languages in dropdown', () => {
      cy.get('button[role="combobox"]').click();
      
      // Проверяем наличие ключевых языков
      const expectedLanguages = ['English', 'French', 'German', 'Spanish', 'Russian'];
      expectedLanguages.forEach(lang => {
        cy.get('[role="option"]').contains(lang).should('exist');
      });
    });

    it('should update selected language when option is clicked', () => {
      cy.get('button[role="combobox"]').click();
      cy.get('[role="option"]').contains('French').click();
      
      // После выбора французского, селектор должен показывать French
      cy.get('button[role="combobox"]').should('contain.text', 'French');
    });

    it('should close dropdown after selection', () => {
      cy.get('button[role="combobox"]').click();
      cy.get('[role="option"]').contains('German').click();
      
      // Dropdown должен закрыться
      cy.get('[role="listbox"]').should('not.exist');
    });
  });

  // ==========================================================================
  // СЕКЦИЯ 3: ТЕСТЫ ВВОДА ТЕКСТА
  // ==========================================================================

  describe('Text Input', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should accept text input', () => {
      const testText = 'Привет, мир!';
      cy.get('textarea').type(testText);
      cy.get('textarea').should('have.value', testText);
    });

    it('should accept long text', () => {
      const longText = 'Это очень длинный текст. '.repeat(50);
      cy.get('textarea').type(longText, { delay: 0 });
      cy.get('textarea').should('have.value', longText);
    });

    it('should accept special characters', () => {
      const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      cy.get('textarea').type(specialChars);
      cy.get('textarea').should('have.value', specialChars);
    });

    it('should accept multi-line text', () => {
      const multiLine = 'Первая строка{enter}Вторая строка{enter}Третья строка';
      cy.get('textarea').type(multiLine);
      cy.get('textarea').invoke('val').should('include', '\n');
    });
  });

  // ==========================================================================
  // СЕКЦИЯ 4: ТЕСТЫ LOADING STATE
  // ==========================================================================
  // Проверяем отображение индикатора загрузки во время запроса.

  describe('Loading State', () => {
    beforeEach(() => {
      // Мокаем API с задержкой, чтобы успеть увидеть loading state
      cy.intercept('POST', 'https://api.mentorpiece.org/v1/process-ai-request', (req) => {
        req.reply({
          statusCode: 200,
          body: { response: "Test response" },
          delay: 2000 // 2 секунды задержки
        });
      }).as('slowRequest');

      cy.visit('/');
    });

    it('should show loading indicator after clicking translate', () => {
      cy.get('textarea').type('Test text');
      cy.contains('button', 'Translate & Critique').click();
      
      // Проверяем появление индикатора загрузки
      cy.contains('Processing your text').should('be.visible');
    });

    it('should disable button during loading', () => {
      cy.get('textarea').type('Test text');
      cy.contains('button', 'Translate & Critique').click();
      
      // Кнопка должна быть заблокирована во время загрузки
      cy.get('button').contains('Translate & Critique').closest('button')
        .should('be.disabled');
    });
  });

  // ==========================================================================
  // СЕКЦИЯ 5: ОСНОВНОЙ СЦЕНАРИЙ (HAPPY PATH)
  // ==========================================================================

  describe('Successful Translation Flow', () => {
    beforeEach(() => {
      // Мокаем оба типа запросов в одном interceptor
      cy.intercept('POST', 'https://api.mentorpiece.org/v1/process-ai-request', (req) => {
        if (req.body.model_name === 'Qwen/Qwen3-VL-30B-A3B-Instruct') {
          req.alias = 'translateRequest';
          req.reply({
            statusCode: 200,
            body: { response: "Mocked Translation: The sun is shining." },
            delay: 300
          });
        } else if (req.body.model_name === 'claude-sonnet-4-5-20250929') {
          req.alias = 'critiqueRequest';
          req.reply({
            statusCode: 200,
            body: { response: "Mocked Grade: 9/10. Fluent and accurate." },
            delay: 300
          });
        }
      });

      cy.visit('/');
    });

    it('should successfully translate text and provide critique', () => {
      // 1. Вводим текст
      cy.get('textarea').type('Солнце светит.');

      // 2. Выбираем язык (English уже выбран по умолчанию)
      cy.get('button[role="combobox"]').click();
      cy.get('[role="option"]').contains('English').click();

      // 3. Нажимаем кнопку
      cy.contains('button', 'Translate & Critique').click();

      // 4. Ждем появления перевода
      cy.contains('Mocked Translation: The sun is shining.')
        .should('be.visible');

      // 5. Ждем появления критики
      cy.contains('Mocked Grade: 9/10. Fluent and accurate.')
        .should('be.visible');
    });

    it('should display Translation section header', () => {
      cy.get('textarea').type('Test');
      cy.contains('button', 'Translate & Critique').click();

      // Должен появиться заголовок секции перевода
      cy.contains('Translation').should('be.visible');
    });

    it('should display Evaluation Report section', () => {
      cy.get('textarea').type('Test');
      cy.contains('button', 'Translate & Critique').click();

      cy.contains('EVALUATION REPORT').should('be.visible');
    });

    it('should hide placeholder after getting results', () => {
      cy.get('textarea').type('Test');
      cy.contains('button', 'Translate & Critique').click();

      // Placeholder "Ready to translate" должен исчезнуть
      cy.contains('Ready to translate').should('not.exist');
    });
  });

  // ==========================================================================
  // СЕКЦИЯ 6: ОБРАБОТКА ОШИБОК
  // ==========================================================================

  describe('Error Handling', () => {
    it('should display error message on API failure (500)', () => {
      cy.intercept('POST', 'https://api.mentorpiece.org/v1/process-ai-request', {
        statusCode: 500,
        body: { message: "Internal Server Error" },
        delay: 100
      }).as('failedRequest');

      cy.visit('/');
      cy.get('textarea').type('Error test');
      cy.contains('button', 'Translate & Critique').click();

      // Ждем появления сообщения об ошибке
      cy.wait('@failedRequest');
      cy.contains('Internal Server Error').should('be.visible');
    });

    it('should display error message on API failure (401)', () => {
      cy.intercept('POST', 'https://api.mentorpiece.org/v1/process-ai-request', {
        statusCode: 401,
        body: { message: "Unauthorized" },
        delay: 100
      }).as('authError');

      cy.visit('/');
      cy.get('textarea').type('Auth test');
      cy.contains('button', 'Translate & Critique').click();

      cy.wait('@authError');
      cy.contains('Unauthorized').should('be.visible');
    });

    it('should handle network failure gracefully', () => {
      cy.intercept('POST', 'https://api.mentorpiece.org/v1/process-ai-request', {
        forceNetworkError: true
      }).as('networkError');

      cy.visit('/');
      cy.get('textarea').type('Network test');
      cy.contains('button', 'Translate & Critique').click();

      // Приложение не должно падать, должно показать ошибку
      // Toast с ошибкой сети
      cy.wait('@networkError');
      cy.get('[role="alert"]', { timeout: 10000 }).should('exist');
    });

    it('should allow retry after error', () => {
      // Первый запрос - ошибка
      let requestCount = 0;
      cy.intercept('POST', 'https://api.mentorpiece.org/v1/process-ai-request', (req) => {
        requestCount++;
        if (requestCount === 1) {
          req.reply({ statusCode: 500, body: { message: "First attempt failed" } });
        } else {
          req.reply({ statusCode: 200, body: { response: "Success on retry" } });
        }
      });

      cy.visit('/');
      cy.get('textarea').type('Retry test');
      
      // Первая попытка - ошибка
      cy.contains('button', 'Translate & Critique').click();
      cy.contains('First attempt failed').should('be.visible');
      
      // Вторая попытка - успех
      cy.contains('button', 'Translate & Critique').click();
      cy.contains('Success on retry').should('be.visible');
    });
  });

  // ==========================================================================
  // СЕКЦИЯ 7: ACCESSIBILITY ТЕСТЫ
  // ==========================================================================

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.visit('/');
    });

    it('should have focusable textarea', () => {
      cy.get('textarea').focus();
      cy.get('textarea').should('have.focus');
    });

    it('should have accessible button with text', () => {
      cy.contains('button', 'Translate & Critique')
        .should('have.attr', 'type');
    });

    it('should have combobox role for language selector', () => {
      cy.get('[role="combobox"]').should('exist');
    });

    it('should navigate with keyboard', () => {
      // Tab to textarea
      cy.get('body').tab();
      cy.focused().should('match', 'textarea, button, [tabindex]');
    });
  });

  // ==========================================================================
  // СЕКЦИЯ 8: ТЕСТЫ ПРОИЗВОДИТЕЛЬНОСТИ
  // ==========================================================================

  describe('Performance', () => {
    it('should load page within acceptable time', () => {
      const startTime = Date.now();
      cy.visit('/');
      cy.contains('AI Translator & Critic').should('be.visible').then(() => {
        const loadTime = Date.now() - startTime;
        // Страница должна загрузиться менее чем за 5 секунд
        expect(loadTime).to.be.lessThan(5000);
      });
    });

    it('should respond to user input without lag', () => {
      cy.visit('/');
      const testText = 'Quick typing test';
      
      const startTime = Date.now();
      cy.get('textarea').type(testText, { delay: 0 });
      cy.get('textarea').should('have.value', testText).then(() => {
        const inputTime = Date.now() - startTime;
        // Ввод должен быть обработан менее чем за 1 секунду
        expect(inputTime).to.be.lessThan(1000);
      });
    });
  });
});
