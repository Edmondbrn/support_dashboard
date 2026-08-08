

type ApiCallStatus = "success" | "fail";

export interface ApiCallResponse {
    status : ApiCallStatus,
    errorMsg? : string,
    data?: unknown,
}