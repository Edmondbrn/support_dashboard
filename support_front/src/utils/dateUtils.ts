

/**
 * Splite timestamp string and onlt extract the date
 * @param timeStamp 
 * @returns 
 */
export function timeStampToDate(timeStamp : string) {
    return timeStamp.split("T").at(0);
}