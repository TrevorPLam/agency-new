// Main logger creation and types
export {
  createLogger,
  createContextualLogger,
  type LoggerOptions,
  type LoggerContext,
  type ContextualLogger,
} from './logger';

// Context management
export {
  createContextManager,
  getCurrentContext,
  runWithContext,
  runWithContextAsync,
  type ContextManager,
} from './context';

// PII redaction
export {
  createRedactionSerializer,
  redactValue,
  containsPii,
} from './redact';

// Re-export createLogger as default
export { createLogger as default } from './logger';
