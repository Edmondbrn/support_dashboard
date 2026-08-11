import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";


type BtnVersion = "primary" | "secondary";

interface BtnProps {
    children: React.ReactNode,
    version: BtnVersion,
    onClick?: () => void,
    disabled?: boolean,
    isLoading?: boolean,
}


/**
 * Wrapper Component to handle custom btn style
 * @param props 
 * @returns 
 */
export function Btn(props : BtnProps) {


    const getBtnClass = () => {
        switch (props.version) {
            case "primary":
                return "bg-white/20 hover:bg-white/30 cursor-pointer";
            case "secondary":
                return "bg-orange hover:bg-orange-500 cursor-pointer";
        }
    } 


    return (
        <Button 
            className={getBtnClass()} 
            type="submit" 
            onClick={props.onClick}
            disabled={Boolean(props.disabled) || Boolean(props.isLoading)} 
        >   
            {props.isLoading && <Spinner data-icon="inline-start" />}
            {props.children}
        </Button>
    )
}