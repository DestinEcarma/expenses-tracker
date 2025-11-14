type Nullable<T> = T | null;

const isBrowser = typeof window !== "undefined";

export { isBrowser, type Nullable };
