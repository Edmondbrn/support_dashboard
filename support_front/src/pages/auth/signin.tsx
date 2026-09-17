import { Btn } from "@/components/shared/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { appRoutes } from "@/config";
import { useDemoAccounts } from "@/hooks/auth/useDemoAccounts";
import useSignin from "@/hooks/auth/useSignin";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";



/**
 * Component which ask the information to connect
 * @returns 
 */
export default function Signin() {
    useDocumentTitle("Sign in");

    const {
        form,
        setForm,
        isLoading,
        demoLoadingEmail,
        submitSignin,
        navigate
    } = useSignin();

    const { data: demoAccounts = [], isPending: isDemoAccountsLoading } = useDemoAccounts();

    // display order: client, agent, admin
    const orderedDemoAccounts = [...demoAccounts].sort((a, b) => {
        const order = ["client1", "agent1", "admin"];
        return order.indexOf(a.label) - order.indexOf(b.label);
    });

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
                                value={form.email}
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
                                value={form.password}
                                onChange={(e) => setForm({...form, password: e.target.value})}
                                maxLength={50}
                                minLength={8}
                            />
                        </Field>


                        <Field>
                            <Btn 
                                version="primary" 
                                onClick={() => submitSignin()}
                                isLoading={isLoading && demoLoadingEmail === null}
                            >
                                Connect
                            </Btn>
                        </Field>

                        {orderedDemoAccounts.length > 0 && (
                            <Field>
                                <div className="flex items-center gap-3 pt-1">
                                    <span className="h-px flex-1 bg-white/20" />
                                    <span className="text-sm text-gray-400">Or try a demo account</span>
                                    <span className="h-px flex-1 bg-white/20" />
                                </div>
                                <div className="flex flex-col md:flex-row justify-center gap-3">
                                    {orderedDemoAccounts.map((account) => (
                                        <Btn
                                            key={account.id}
                                            version="secondary"
                                            onClick={() => submitSignin(account.email, account.password_plain)}
                                            isLoading={isDemoAccountsLoading || demoLoadingEmail === account.email}
                                        >
                                            {account.label}
                                        </Btn>
                                    ))}
                                </div>
                            </Field>
                        )}
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
