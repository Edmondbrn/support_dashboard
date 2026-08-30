import { getAttachmentSignedUrls } from "@/apis/messages";
import type { SignedUrl } from "@/apis/types";
import { Spinner } from "@/components/ui/spinner";
import { useQuery } from "@tanstack/react-query";
import { DownloadIcon, FileIcon } from "lucide-react";

interface MessageAttachmentProps {
    path: string,
    mimeType: string,
    name: string
}

/**
 * Component to display attachment in the conversation feed
 * @param props 
 * @returns 
 */
export default function MessageAttachment(props : MessageAttachmentProps) {

    // single downalod for now, can be batched using the same function if performances drop
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["attachment-signed-url", props.path],
        queryFn: async () => {
            const res = await getAttachmentSignedUrls([props.path]);
            if (res.status === "fail") throw new Error(res.errorMsg);
            return (res.data as SignedUrl[])[0].signedUrl as string;
        },
        staleTime: 4 * 60 * 1000, // a little before link expiration
    });

    if (isLoading) return <Spinner fontSize={20} />;
    if (isError || !data) return <button onClick={() => refetch()}>Reload</button>;

    // Images
    if (props.mimeType.startsWith("image/")) {
        return (
        <img
            src={data}
            alt={props.name}
            className="max-h-64 object-contain rounded-lg cursor-pointer"
            onError={() => refetch()} // reload signed URLs if expired
        />
        );
    }

    // Files
    return (
        <a href={data} download={props.name} className="flex items-center bg-white/20  p-2 rounded-xl text-gray-100 gap-2">
            <FileIcon size={28} /> {props.name} <DownloadIcon size={20}/>
        </a>
    );
}