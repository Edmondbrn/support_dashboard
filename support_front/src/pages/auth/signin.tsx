import { Btn } from "@/components/shared/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { appRoutes } from "@/config";
import useSignin from "@/hooks/auth/useSignin";



/**
 * Component which ask the information to connect
 * @returns 
 */
export default function Signin() {

    const {
        form,
        setForm,
        isLoading,
        submitSignin,
        navigate
    } = useSignin();

    return (

        <div className="min-h-screen flex flex-col justify-center items-center">
            <Card className=" w-1/2 bg-glass text-white">
                <CardHeader>
                    <CardTitle className=" text-xl font-semibold mb-2">Signin</CardTitle>
                </CardHeader>
                
                <CardContent>
                    <FieldGroup>

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
                        </Field>


                        <Field>
                            <Btn 
                                version="primary" 
                                onClick={() => submitSignin()}
                                isLoading={isLoading}
                            >
                                Connect
                            </Btn>
                        </Field>
                    </FieldGroup>

                    <div className="flex justify-center pt-3 gap-3 ">
                        <span className="text-gray-400">No account yet ?</span>
                        <button className="cursor-pointer hover:underline font-semibold text-gray-200" onClick={() => navigate(appRoutes.AUTH_SIGNUP)}>Signup</button>
                    </div>

                </CardContent>
            </Card>
            

        </div>
    )
}