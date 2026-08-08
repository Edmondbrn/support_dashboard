import { signin } from "@/apis/auth";
import { appRoutes } from "@/config";
import { showErrorToast } from "@/utils/showToast";
import { useState } from "react";
import { useNavigate } from "react-router";

interface SigninForm {
    email: string,
    password: string
}


export default function useSignin() {


    const [form, setForm] = useState<SigninForm>({email: "", password: ""})
    const [isLoading, setLoading] = useState<boolean>(false);
    const navigate = useNavigate();


    /**
     * Send the request to login and handle navigation
     * @returns 
     */
    async function submitSignin() {

        const missingField = Object.entries(form).find(([, val]) => val.trim() === "");
        if (missingField) {
            showErrorToast(`Missing field: ${missingField.at(0)}`);
            return;
        }

        
        setLoading(true);
        const res = await signin(form.email, form.password);
        setLoading(false);

        if (res.status === "fail") {
            showErrorToast(`Error when connecting to your account: ${res.errorMsg}`);
            return;
        }

        // redirect to home page
        navigate(appRoutes.HOME);
    }



    return {
        submitSignin,
        form,
        setForm,
        isLoading
    };
}