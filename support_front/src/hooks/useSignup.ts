import { signUp } from "@/apis/auth";
import { showErrorToast, showSuccessToast } from "@/utils/showToast";
import { useState } from "react";

interface SignupForm {
    email?: string,
    password?: string,
    username?: string
}

export default function useSignup() {


    const [form, setForm] = useState<SignupForm>({email: undefined, password: undefined, username: undefined})
    const [isPasswordsEqual, setIsPasswordEqual] = useState<boolean>(true);
    const [isLoading, setLoading] = useState<boolean>(false);

    /**
     * Check if all the fields are defined
     * @returns 
     */
    const isFormReady = () => {
        for (const [key, val] of Object.entries(form)) {
            if (!val || val.trim() === "") {
                return {ready: false, missing: key};
            }
        }
        return {ready: true, missing: undefined};
    }


    /**
     * Check if the password is strong enough
     * @returns 
     */
    const isPasswordStrong = () => {
        if (!form.password) {return false}

        const isLong = form.password.length >= 8;
        
        let hasLower = false;
        let hasUpper = false;
        let hasSpecial = false;
        for (const char of form.password) {
            if (char === char.toLowerCase()) {hasLower = true}
            if (char === char.toUpperCase()) {hasUpper = true}
            if ("@!&/\\?,.;:§%*£$€".includes(char)) {hasSpecial = true}

            if (hasLower && hasUpper && hasSpecial) {break;}
        }
        return hasLower && hasUpper && isLong && hasSpecial;
    }


    /**
     * Checl form conformity from clientside and call API
     * @returns 
     */
    async function submitSignup() {
        // check attributes
        const formState = isFormReady();
        if (!formState.ready) {
            showErrorToast(`Missing field: ${formState.missing}`);
            return;
        }

        // check password match
        if (!isPasswordsEqual) {
            showErrorToast("Passwords do not match");
            return;
        }
        
        // check password strength
        if (!isPasswordStrong()) {
            showErrorToast("Password too weak");
            return;
        }

        // send supabase request
        setLoading(true);
        const res = await signUp(form.email!, form.password!, form.username!);
        if (res.status === "success") {
            showSuccessToast("Account create successfully");
        } else {
            showErrorToast(`Error, cannot create the account because: ${res.errorMsg}`);
        }
        setLoading(false);
    }


    return {
        form,
        setForm,
        isPasswordsEqual,
        setIsPasswordEqual,
        submitSignup,
        isFormReady,
        isLoading,
        setLoading,
    };
}