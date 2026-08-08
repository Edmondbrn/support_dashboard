import { appRoutes } from "@/config";
import { useState } from "react";
import { Link } from "react-router";



export default function NavBar() {

    const [activeIdx, setActiveIdx] = useState<number>(0);

    return (
        <nav className='flex flex-col md:flex-row gap-10 justify-center p-5'>
            <Link to={appRoutes.HOME} onClick={() => setActiveIdx(0)} className={activeIdx === 0 ? "text-orange-300": ""}>Home</Link>
            <Link to={appRoutes.HOME} onClick={() => setActiveIdx(1)} className={activeIdx === 1 ? "text-orange-300": ""}>Tickets</Link>
            <Link to={appRoutes.HOME} onClick={() => setActiveIdx(2)} className={activeIdx === 2 ? "text-orange-300": ""}>Create ticket</Link>
            <Link to={appRoutes.HOME} onClick={() => setActiveIdx(3)} className={activeIdx === 3 ? "text-orange-300": ""}>Messages</Link>
        </nav>
    )
}