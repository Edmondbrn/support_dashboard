import { twJoin } from "tailwind-merge"


interface UserAvatarProps {
    initials : string
    className?: string
}


/**
 * Display the user's initials in a rounded div
 * @param props 
 * @returns 
 */
export default function UserAvatar(props : UserAvatarProps) {
    return (
        <span className={twJoin(["flex size-8 items-center justify-center rounded-full bg-red-500 text-xs font-semibold text-white ring-1 ring-white/10", props.className])}>
            {props.initials}
        </span>
    )
}