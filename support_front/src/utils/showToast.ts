import { toast } from "sonner"



export function showErrorToast(description : string) {
    toast.error(description, {position:"top-right", style: {
        backgroundColor: "#D9534F",
        borderColor: "black",
        backdropFilter: "blur(4px)",
    }});
}
// bg-white/10 border border-white/10 backdrop-blur-md shadow-2xl

export function showInfoToast(description : string) {
    toast.info(description, {position:"top-right", style: {
        backgroundColor: "#54B4D3",
        borderColor: "black",
        backdropFilter: "blur(4px)",
    }});
}


export function showWarningToast(description : string) {
    toast.warning(description, {position:"top-right", style: {
        backgroundColor: "#EDBD53",
        borderColor: "black",
        backdropFilter: "blur(4px)",
    }});
}


export function showSuccessToast(description : string) {
    toast.success(description, {position:"top-right", style: {
        backgroundColor: "#53ED98",
        borderColor: "black",
        backdropFilter: "blur(4px)",
    }});
}