import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './Home';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as mentorpiece from '@/lib/mentorpiece';

// Мокаем модуль mentorpiece, чтобы контролировать ответы от "AI"
vi.mock('@/lib/mentorpiece', async () => {
  const actual = await vi.importActual('@/lib/mentorpiece');
  return {
    ...actual,
    callLLM: vi.fn(),
  };
});

// Мокаем toast, так как он использует контекст, который может быть сложным для настройки
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

// Обертка для React Query (необходима, так как Home использует useMutation)
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Home Component Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Scenario: Positive Flow (Full Translation Cycle)
  it('should translate and critique text successfully', async () => {
    // Arrange
    // Настраиваем мок: первый вызов - перевод, второй - критика
    const mockCallLLM = vi.mocked(mentorpiece.callLLM);
    mockCallLLM
      .mockResolvedValueOnce("Bonjour le monde") // Перевод
      .mockResolvedValueOnce("Great translation, 10/10"); // Критика

    render(<Home />, { wrapper: createWrapper() });

    // Act
    // 1. Вводим текст
    const input = screen.getByPlaceholderText(/Enter text to translate/i);
    fireEvent.change(input, { target: { value: "Hello world" } });

    // 2. Нажимаем кнопку
    const button = screen.getByRole('button', { name: /Translate & Critique/i });
    fireEvent.click(button);

    // Assert
    // Ждем появления перевода
    await waitFor(() => {
      expect(screen.getByText("Bonjour le monde")).toBeInTheDocument();
    });

    // Ждем появления критики
    await waitFor(() => {
      expect(screen.getByText(/EVALUATION REPORT/i)).toBeInTheDocument();
      expect(screen.getByText("Great translation, 10/10")).toBeInTheDocument();
    });

    // Проверяем, что callLLM был вызван дважды (Перевод + Критика)
    expect(mockCallLLM).toHaveBeenCalledTimes(2);
  });

  // Scenario: Validation Error (Empty Input)
  it('should show error if input is empty', async () => {
    // Arrange
    // Мы ожидаем, что хук useMutation выбросит ошибку, которая попадет в onError и вызовет toast
    
    render(<Home />, { wrapper: createWrapper() });

    // Act
    const button = screen.getByRole('button', { name: /Translate & Critique/i });
    fireEvent.click(button);

    // Assert
    // Проверяем, что был вызван toast с ошибкой
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        variant: "destructive",
        description: "Please enter some text to translate."
      }));
    });
  });
});
