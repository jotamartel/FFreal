// Type definitions for preact to satisfy @shopify/ui-extensions
declare namespace preact {
  type Key = string | number;
  type Ref<T> = ((instance: T | null) => void) | { current: T | null } | null;
  type ComponentChildren = any;
}

