import type { BaseUIEvent } from "@base-ui/react";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

type BtnVersion = "primary" | "secondary" | "danger";

interface BtnProps {
    children: React.ReactNode,
    version: BtnVersion,
    onClick?: (() => void) | ((e : BaseUIEvent<React.MouseEvent<HTMLButtonElement, MouseEvent>>) => void),
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
            case "danger":
                return "bg-red-500 hover:bg-red-600 cursor-pointer";
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