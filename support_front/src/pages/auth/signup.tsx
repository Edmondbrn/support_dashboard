import { Btn } from "@/components/shared/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import useSignup from "@/hooks/auth/useSignup";



/**
 * Component which ask the information to create an account
 * @returns 
 */
export default function SignUp() {

    const {
        form,
        setForm,
        setIsPasswordEqual,
        isFormReady,
        submitSignup,
        isLoading
    } = useSignup();

    return (

        <div className="min-h-screen flex flex-col justify-center items-center">
            <Card className=" w-1/2 bg-glass text-white">
                <CardHeader>
                    <CardTitle className=" text-xl font-semibold mb-2">Signup form</CardTitle>
                </CardHeader>
                
                <CardContent>
                    <FieldGroup>
                        <Field>
                            <FieldLabel htmlFor="fieldgroup-name">Username</FieldLabel>
                            <Input 
                                className="border-white/30" 
                                id="fieldgroup-name" 
                                placeholder="John Smith"
                                onChange={(e) => setForm({...form, username: e.target.value})}
                                maxLength={50}
                                minLength={1}
                            />
                        </Field>
                        <Field>
                            <FieldLabel htmlFor="fieldgroup-email">Email</FieldLabel>
                            <Input className="border-white/30"
                                id="fieldgroup-email"
                                type="email"
                                placeholder="name@example.com"
                                onChange={(e) => setForm({...form, email: e.target.value})}
                                maxLength={50}
                                minLength={1}
                            />
                            <FieldDescription className="text-slate-200 text-sm">
                                This address will be used for notifications and updates
                            </FieldDescription>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="fieldgroup-password">Password</FieldLabel>
                            <Input className="border-white/30"
                                id="fieldgroup-password"
                                type="password"
                                placeholder="P@ssw0rd"
                                onChange={(e) => setForm({...form, password: e.target.value})}
                                maxLength={50}
                                minLength={8}
                            />
                            <FieldDescription className="text-slate-200 text-sm">
                                The password must contain:
                                <br/>
                                <span>- 8 characters</span>
                                <br/>
                                <span>- A special character</span>
                                <br/>
                                <span>- An upper character</span>
                                <br/>
                                <span>- A number</span>
                            </FieldDescription>
                        </Field>

                        <Field>
                            <FieldLabel htmlFor="fieldgroup-confirm-password">Confirm password</FieldLabel>
                            <Input className="border-white/30"
                                id="fieldgroup-confirm-password"
                                type="password"
                                placeholder="P@ssw0rd"
                                minLength={8}
                                maxLength={50}
                                onChange={(e) => setIsPasswordEqual(e.target.value === form.password)}
                            />
                        </Field>


                        <Field>
                            <Btn 
                                version="primary" 
                                disabled={!isFormReady().ready} 
                                onClick={() => submitSignup()}
                                isLoading={isLoading}
                            >
                                Submit
                            </Btn>
                        </Field>
                    </FieldGroup>
                </CardContent>
            </Card>

        </div>
    )
}