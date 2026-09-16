import { useAuth } from "@/hooks/context/useAuth";
import { LayoutDashboard } from "lucide-react";


/**
 * Base page which explains the role
 * @returns 
 */
export default function Home() {

    const { profile } = useAuth();

    if (!profile) {
        return (
            <div>
                <LayoutDashboard className="size-10 text-orange-300" />
                <p>There is a connection problem. Signout and signin again.</p>
            </div>
        )
    }

    let homeBody: React.ReactNode;
    switch (profile.role) {
        case "client":
            homeBody = (
                <>
                    <LayoutDashboard className="size-10 text-orange-300" />
                    <p className="text-lg font-medium text-white">Welcome back</p>
                    <p className="text-sm text-slate-400">As a client you can create a support ticket and wait for an agent to claim it. Then you will be able to talk with them to resolve your problems.</p>
                </>
            )
            break;
        case "agent":
            homeBody = (
                <>
                    <LayoutDashboard className="size-10 text-orange-300" />
                    <p className="text-lg font-medium text-white">Welcome back</p>
                    <p className="text-md text-slate-400">As an agent you can help client to resolve their issues.</p>
                    <ul className="text-start">
                        <li>You can claim an unassigned ticket</li>
                        <li>You can talk to the client to help resolving their issue</li>
                        <li>You can close or re-open any of your ticket</li>
                    </ul>
                </>
            )
            break;
        
        case "admin":
            homeBody = (
                <>
                    <LayoutDashboard className="size-10 text-orange-300" />
                    <p className="text-xl font-medium text-white">Welcome back</p>
                    <p className="text-md text-slate-400">As an admin you have the same access than an agent</p>
                    <ul className="text-start">
                        <li>You can claim an unassigned ticket</li>
                        <li>You can talk to the client to help resolving their issue</li>
                        <li>You can close or re-open any of your ticket</li>
                    </ul>

                    <p className="text-md text-slate-400">But also to to admin specific features</p>
                    <ul className="text-start">
                        <li>You can consult all tickets and reassign them to another agent if necessary</li>
                        <li>You have access to every discussion</li>
                        <li>You can manage user's account (roles, deletion)</li>
                    </ul>
                </>
            )
            break;
    }


    return (
        <div className="w-full max-w-7xl flex flex-col items-center gap-5 px-4 py-20  mx-auto sm:px-6">
            {homeBody}
        </div>
    );




}