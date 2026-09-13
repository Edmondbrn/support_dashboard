
/**
 * Generate a unique path for the message storage
 * @param ticketId 
 * @param fileName 
 * @returns 
 */
export const getFilePath = (ticketId : string, fileName: string) => `${ticketId}/${crypto.randomUUID()}-${fileName}`