export class ApiResponseParseError extends Error {
  readonly status: number;

  constructor(response: Response, message: string) {
    super(message);
    this.name = "ApiResponseParseError";
    this.status = response.status;
  }
}

/**
 * Reads an API response as text first so an empty, truncated, or concatenated
 * backend response becomes a controlled application error instead of leaking a
 * native JSON SyntaxError into the Next.js error overlay.
 */
export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const rawBody = await response.text();
  const body = rawBody.replace(/^\uFEFF/, "").trim();

  if (!body) {
    throw new ApiResponseParseError(
      response,
      `API trả về nội dung rỗng (HTTP ${response.status}).`,
    );
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new ApiResponseParseError(
      response,
      `API trả về JSON không hợp lệ (HTTP ${response.status}).`,
    );
  }
}
