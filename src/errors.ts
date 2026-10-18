export class FossaPayError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FossaPayError";
  }
}

export class FossaPayApiError extends FossaPayError {
  readonly status: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly details?: unknown;

  constructor(options: {
    message: string;
    status: number;
    code?: string;
    requestId?: string;
    details?: unknown;
  }) {
    super(options.message);
    this.name = "FossaPayApiError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.details = options.details;
  }
}

export class FossaPayConnectionError extends FossaPayError {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "FossaPayConnectionError";
    this.cause = cause;
  }
}
