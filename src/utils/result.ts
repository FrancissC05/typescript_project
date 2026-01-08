export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; reason: string; details?: unknown };
export type Result<T> = Ok<T> | Err;
