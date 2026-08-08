import { signout } from "@/apis/auth";
import { appRoutes } from "@/config";
import { Button } from "@base-ui/react";
import { useNavigate } from "react-router";




export default function Home() {

    const navigate = useNavigate();

    return (
        <>
            <p className="text-white">Home</p>
            <Button className="text-white" onClick={() => {signout(); navigate(appRoutes.AUTH_SIGNIN)}}>
                Signout 
            </Button>
        </>
    )
}