import useMessages from "@/hooks/messages/useMessages";
import { Input } from "@base-ui/react";
import { InboxIcon, SendHorizontalIcon } from "lucide-react";
import { Spinner } from "../ui/spinner";
import FileSelector from "../shared/FileSelector";
import useMessageFileUploader from "@/hooks/messages/useMessageFileUploader";


/**
 * Component with the message input section and the send button
 * @returns 
 */
export default function MessageInput() {

    const {
        draft,
        messageMutation,
        handleDraftChange,
    } = useMessages();

    // file upload tools
    const {
        fileInputRef,
        selectedFile,
        setSelectedFile
    } = useMessageFileUploader()

    return (
        <div className="flex items-center w-full gap-3 px-5 py-3 border border-gray-400 rounded-2xl">
            <button className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <InboxIcon size={32} className="text-slate-400" />
                <FileSelector 
                    fileInputRef={fileInputRef}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                />
            </button>
            <Input
                className="border-white/30 w-full text-md py-3"
                type="text"
                placeholder="Type your message..."
                value={draft}
                maxLength={500}
                minLength={1}
                onChange={(e) => handleDraftChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") messageMutation.mutate(); }}
            />
            <button className="cursor-pointer transition-colors ease-in-out transiton-1000 bg-orange-400 hover:bg-orange-500 rounded p-1" onClick={() => messageMutation.mutate()}>
                {messageMutation.isPending 
                    ? <Spinner fontSize={32}/>
                    : <SendHorizontalIcon size={32}/> 
                }
            </button>
        </div>
    )

}