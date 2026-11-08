import "server-only";
import { ApiError } from "@google/genai";
import type { Locale } from "@/lib/i18n/config";

type ErrorCode = "TIMEOUT" | "CANCELLED" | "RATE_LIMIT" | "AUTH_ERROR" | "INVALID_REQUEST" | "MODEL_UNAVAILABLE" | "NETWORK_ERROR" | "UPSTREAM_UNAVAILABLE" | "CONTENT_BLOCKED" | "OUTPUT_LIMIT" | "INCOMPLETE_RESPONSE" | "EMPTY_RESPONSE" | "LOCAL_SAVE_FAILED" | "AI_ERROR";
export class AssistantError extends Error {
  constructor(public readonly code: ErrorCode) { super(code); }
}

export function describeAssistantError(error: unknown, locale: Locale) {
  let code: ErrorCode = error instanceof AssistantError ? error.code : "AI_ERROR";
  if (error instanceof ApiError) {
    if (error.status === 400) code = "INVALID_REQUEST";
    else if (error.status === 429) code = "RATE_LIMIT";
    else if (error.status === 401 || error.status === 403) code = "AUTH_ERROR";
    else if (error.status === 404) code = "MODEL_UNAVAILABLE";
    else if (error.status === 408 || error.status === 504) code = "TIMEOUT";
    else if (error.status >= 500) code = "UPSTREAM_UNAVAILABLE";
  } else if (error instanceof Error && ["AbortError", "TimeoutError"].includes(error.name)) code = "TIMEOUT";
  else if (error instanceof TypeError) code = "NETWORK_ERROR";
  const messages: Record<ErrorCode, [string, string]> = {
    TIMEOUT: ["Gemini took too long to respond. Try again or choose a faster GEMINI_MODEL in .env. The timeout can be adjusted with GEMINI_TIMEOUT_MS.", "Gemini phản hồi quá lâu. Hãy thử lại hoặc chọn GEMINI_MODEL nhanh hơn trong .env. Có thể chỉnh thời gian chờ bằng GEMINI_TIMEOUT_MS."],
    CANCELLED: ["Response stopped.", "Đã dừng phản hồi."],
    RATE_LIMIT: ["Gemini rate limit reached. Check your API quota and retry later.", "Đã chạm giới hạn Gemini API. Kiểm tra quota và thử lại sau."],
    AUTH_ERROR: ["Google rejected API access. Check GEMINI_API_KEY and this project's Gemini API permissions.", "Google từ chối quyền truy cập API. Kiểm tra GEMINI_API_KEY và quyền Gemini API của project."],
    INVALID_REQUEST: ["Gemini rejected the request. Check the API key and model settings in .env.", "Gemini từ chối yêu cầu. Kiểm tra API key và cấu hình model trong .env."],
    MODEL_UNAVAILABLE: ["The configured Gemini model is unavailable. Check GEMINI_MODEL and model access in Google AI Studio.", "Model Gemini đã chọn không khả dụng. Kiểm tra GEMINI_MODEL và quyền dùng model trong Google AI Studio."],
    NETWORK_ERROR: ["The server could not connect to Gemini. Check the network or proxy and try again.", "Server không kết nối được Gemini. Kiểm tra mạng hoặc proxy rồi thử lại."],
    UPSTREAM_UNAVAILABLE: ["Gemini is temporarily unavailable. Please retry later.", "Gemini tạm thời không khả dụng. Hãy thử lại sau."],
    CONTENT_BLOCKED: ["Gemini blocked this response. Try rephrasing your question.", "Gemini đã chặn phản hồi này. Hãy thử diễn đạt lại câu hỏi."],
    OUTPUT_LIMIT: ["The response reached its output limit. Ask for a shorter answer.", "Phản hồi đạt giới hạn đầu ra. Hãy yêu cầu câu trả lời ngắn hơn."],
    INCOMPLETE_RESPONSE: ["Gemini ended the stream before completing the answer. Please retry.", "Gemini ngắt luồng trước khi hoàn thành câu trả lời. Hãy thử lại."],
    EMPTY_RESPONSE: ["Gemini returned no answer text. Please retry.", "Gemini không trả về nội dung câu trả lời. Hãy thử lại."],
    LOCAL_SAVE_FAILED: ["The answer could not be saved locally. Check write access to .data.", "Không lưu được câu trả lời trên máy. Kiểm tra quyền ghi thư mục .data."],
    AI_ERROR: ["Gemini could not complete the request. Check the API configuration and try again.", "Gemini không hoàn thành được yêu cầu. Kiểm tra cấu hình API rồi thử lại."],
  };
  return { code, message: messages[code][locale === "vi" ? 1 : 0] };
}
