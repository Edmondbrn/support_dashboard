

type ApiCallStatus = "success" | "fail";

export interface ApiCallResponse {
    status : ApiCallStatus,
    errorMsg? : string,
    errorCode?: string,
    data?: unknown,
}