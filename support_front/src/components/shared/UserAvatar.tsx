import type { UserRole } from "@/apis/types"
import { twJoin } from "tailwind-merge"


interface UserAvatarProps {
    initials : string
    username: string,
    role?: UserRole
    className?: string
}


/**
 * Display the user's initials in a rounded div
 * @param props 
 * @returns 
 */
export default function UserAvatar(props : UserAvatarProps) {
    const color = props.role === "admin" ? "bg-purple-500" : "bg-red-500"
    return (
        <span 
            title={props.username} 
            className={
                twJoin(["\
                    flex size-8 items-center justify-center \
                    rounded-full text-xs font-semibold text-white \
                    ring-1 ring-white/10", 
                    color, props.className])}
        >
            {props.initials}
        </span>
    )
}