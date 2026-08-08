import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";



/**
 * Component which ask the information to create an account
 * @returns 
 */
export default function SignUp() {


    return (
        <div className="rounded-xl bg-gray-900 bg-trans">

            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="fieldgroup-name">Username</FieldLabel>
                    <Input id="fieldgroup-name" placeholder="John Smith" />
                </Field>
                <Field>
                    <FieldLabel htmlFor="fieldgroup-email">Email</FieldLabel>
                    <Input
                        id="fieldgroup-email"
                        type="email"
                        placeholder="name@example.com"
                    />
                    <FieldDescription>
                    This address will be used for notifications and updates
                    </FieldDescription>
                </Field>
                <Field orientation="horizontal">
                    <Button type="submit">Submit</Button>
                </Field>
            </FieldGroup>

        </div>
    )
}