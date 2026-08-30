import useMessages from "@/hooks/messages/useMessages";
import { Input } from "@base-ui/react";
import { FileText, InboxIcon, SendHorizontalIcon, X } from "lucide-react";
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
        selectedFile,
        previewUrl,
        handleDraftChange,
        handleFileSelection
    } = useMessages();

    // file upload tools
    const {
        fileInputRef
    } = useMessageFileUploader()


    const buildFilePreview = () => {
        if (!selectedFile) {return null;}

        if (previewUrl) {
            return (
                <div className="w-full md:w-1/4 h-32 flex flex-col items-center bg-white/20 rounded-xl">
                    <button className="ml-auto cursor-pointer" onClick={() => handleFileSelection(null)}>
                        <X/>
                    </button>
                    <img className="object-cover w-full h-full" src={previewUrl} alt="Attached_image"></img>
                </div>
            );
        }

        return (
            <div className="w-full md:w-1/4 flex flex-col min-w-0 items-center bg-white/20 rounded-xl p-2 overflow-hidden">
                <button className="ml-auto cursor-pointer" onClick={() => handleFileSelection(null)}>
                    <X/>
                </button>
                <FileText size={64} className="text-red-600"/>
                <span className="w-full block text-sm text-gray-200 truncate">
                    {selectedFile?.name ?? "Attached file"}
                </span>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-start gap-3 border border-gray-400 rounded-2xl p-2">

            {/* Selected file preview */}
            {buildFilePreview()}

            {/* Input selection */}
            <div className="flex items-center w-full gap-3 py-3">
                <button className="cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <InboxIcon size={32} className="text-slate-400" />
                    <FileSelector 
                        fileInputRef={fileInputRef}
                        selectedFile={selectedFile}
                        setSelectedFile={handleFileSelection}
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
        </div>
    )

}