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
    const [demoLoadingEmail, setDemoLoadingEmail] = useState<string | null>(null);
    const navigate = useNavigate();


    /**
     * Send the request to login and handle navigation.
     * Accepts optional credentials so demo buttons can log in directly
     * with accounts fetched from the `demo_accounts` table.
     * @returns 
     */
    async function submitSignin(overrideEmail?: string, overridePassword?: string) {

        const email = overrideEmail ?? form.email;
        const password = overridePassword ?? form.password;

        const missingField = Object.entries({email, password}).find(([, val]) => val.trim() === "");
        if (missingField) {
            showErrorToast(`Missing field: ${missingField.at(0)}`);
            return;
        }

        
        const isDemoLogin = overrideEmail !== undefined;
        setLoading(true);
        if (isDemoLogin) {
            setDemoLoadingEmail(overrideEmail);
        }
        const res = await signin(email, password);
        setLoading(false);
        setDemoLoadingEmail(null);

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
        isLoading,
        demoLoadingEmail,
        navigate
    };
}