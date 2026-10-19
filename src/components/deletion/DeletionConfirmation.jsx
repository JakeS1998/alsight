import React, { useRef } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from '@/components/ui/alert-dialog';
import HoldDeleteButton from '@/components/deletion/HoldDeleteButton';
import { cancelDeletion, confirmDeletion } from '@/components/deletion/deletionStore';
export default function DeletionConfirmation({ operation }) {
  const cancel = useRef(null);
  return <AlertDialog open={!!operation} onOpenChange={open => { if (!open) cancelDeletion(); }}>
    <AlertDialogContent onOpenAutoFocus={event => { event.preventDefault(); cancel.current?.focus(); }}>
      <AlertDialogHeader><AlertDialogTitle>Confirm deletion</AlertDialogTitle>
        <AlertDialogDescription className="whitespace-pre-wrap break-words">You are about to delete {operation?.label}. Are you sure?{operation?.description ? `\n\n${operation.description}` : ''}</AlertDialogDescription>
      </AlertDialogHeader>
      <p className="text-xs text-muted-foreground">Press and hold Delete for 300 milliseconds. You will have 5 seconds to undo.</p>
      <AlertDialogFooter><AlertDialogCancel ref={cancel} className="border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-destructive-foreground">Cancel</AlertDialogCancel>
        {operation && <HoldDeleteButton key={operation.key} onConfirm={confirmDeletion}/>}
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}