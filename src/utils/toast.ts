/**
 * Toast notification utilities using daisyUI components.
 * Provides a simple API for displaying temporary notifications in the browser extension.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  /** The message to display in the toast */
  message: string;
  /** The type of toast which determines the visual style */
  type?: ToastType;
  /** How long the toast should be visible in milliseconds (default: 3000) */
  duration?: number;
  /** Position of the toast on screen (default: 'toast-bottom toast-end') */
  position?: string;
}

/**
 * CSS classes for different toast types
 */
const TOAST_TYPE_CLASSES: Record<ToastType, string> = {
  success: 'alert-success',
  error: 'alert-error',
  warning: 'alert-warning',
  info: 'alert-info',
};

/**
 * Default toast options
 */
const DEFAULT_OPTIONS: Partial<ToastOptions> = {
  type: 'info',
  duration: 3000,
  position: 'toast-bottom toast-end',
};

/**
 * Show a toast notification
 *
 * @param options - Toast configuration options
 * @example
 * ```ts
 * showToast({
 *   message: 'Operation completed successfully!',
 *   type: 'success',
 *   duration: 5000,
 *   position: 'toast-center'
 * });
 * ```
 */
export function showToast(options: ToastOptions): void {
  const config = { ...DEFAULT_OPTIONS, ...options };

  console.log('toast config', config);

  // Create toast container if it doesn't exist
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = `toast-container toast ${config.position} fixed z-50 pointer-events-none`;
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  const toastId = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  toast.id = toastId;
  toast.className = `alert ${TOAST_TYPE_CLASSES[config.type ?? 'info']} shadow-lg pointer-events-auto`;
  toast.innerHTML = `
    <span>${config.message}</span>
  `;

  // Add to container
  container.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    const element = document.getElementById(toastId);
    if (element) {
      element.style.animation = 'fadeOut 0.3s ease-out forwards';
      setTimeout(() => {
        element.remove();
        // Clean up container if empty
        if (container && container.children.length === 0) {
          container.remove();
        }
      }, 300);
    }
  }, config.duration);
}

/**
 * Debug function to test toast functionality
 */
export function testToast(): void {
  console.log('🧪 Testing toast functionality...');

  // Test basic toast
  showToast({
    message: 'Test toast - basic',
    type: 'info',
    duration: 5000,
  });

  // Test success toast
  setTimeout(() => {
    showToast({
      message: 'Test toast - success',
      type: 'success',
      duration: 4000,
    });
  }, 1000);

  // Test error toast
  setTimeout(() => {
    showToast({
      message: 'Test toast - error',
      type: 'error',
      duration: 3000,
    });
  }, 2000);
}
