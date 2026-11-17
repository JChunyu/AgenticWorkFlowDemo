/**
 * Error codes are the only failure vocabulary shared across layers.
 * `pipeline` layers emit codes; `view` maps them to localized copy.
 */
export enum ErrorCode {
  EmptyContent = 'empty-content',
  ParseFailed = 'parse-failed',
  RenderFailed = 'render-failed',
  OverBudget = 'over-budget',
}

export interface AppError {
  readonly code: ErrorCode;
  readonly detail?: string;
}

export function appError(code: ErrorCode, detail?: string): AppError {
  return detail === undefined ? { code } : { code, detail };
}

export type Result<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly error: AppError };

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail<T>(code: ErrorCode, detail?: string): Result<T> {
  return { ok: false, error: appError(code, detail) };
}
