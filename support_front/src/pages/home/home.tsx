import { signout } from "@/apis/auth";
import { Button } from "@base-ui/react";




export default function Home() {

    return (
        <>
            <p className="text-white">Home</p>
            <Button className="text-white" onClick={() => signout()}>
                Signout 
            </Button>
        </>
    )
}