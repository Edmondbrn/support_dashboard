import React, { type RefObject } from "react";


interface FileSelectorProps {
    fileInputRef: RefObject<HTMLInputElement | null>,
    selectedFile: File | null,
    setSelectedFile: (file : File | null) => void,
}

export default function FileSelector(props : FileSelectorProps) {


    /**
     * Update File state when a file is selected
     * @param event 
     */
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            props.setSelectedFile(files[0]);
        }
    }


    return (
        <input
            type="file"
            ref={props.fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
        />
    )

}