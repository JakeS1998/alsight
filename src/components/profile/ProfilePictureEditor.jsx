import React,{useRef,useState} from 'react';
import {Loader2} from 'lucide-react';
import {base44} from '@/api/base44Client';
import {useAuth} from '@/lib/AuthContext';
import {Button} from '@/components/ui/button';
import ProfilePicture from '@/components/profile/ProfilePicture';
import useDeletion from '@/components/deletion/useDeletion';

export default function ProfilePictureEditor() {
  const {user,updateProfilePicture}=useAuth();
  const input=useRef(null),deletion=useDeletion(`ProfilePicture:${user?.id}`);
  const pictureHidden=deletion.isHidden(user?.profile_picture_uri);
  const remove=()=>deletion.request({id:user.profile_picture_uri,label:'your profile picture',description:'This clears the picture from your profile without deleting your account.',onDelete:async()=>{await updateProfilePicture('');setMessage('Profile picture removed.');}});
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  const save=async file=>{
    setError('');setMessage('');
    if(file && (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size>5*1024*1024)) {
      setError('Choose a JPG, PNG or WebP image up to 5 MB.');return;
    }
    setBusy(true);
    try {
      const uri=file ? (await base44.integrations.Core.UploadPrivateFile({file})).file_uri : '';
      await updateProfilePicture(uri);
      setMessage(file ? 'Profile picture saved.' : 'Profile picture removed.');
    } catch(e) {setError(e.message || 'Could not update your profile picture.');}
    finally {setBusy(false);}
  };
  return <section aria-labelledby="profile-picture-heading" className="space-y-4 rounded-xl border border-border bg-card p-6">
    <h2 id="profile-picture-heading" className="text-base font-semibold">Profile picture</h2>
    <div className="flex flex-wrap items-center gap-5">
      <ProfilePicture user={pictureHidden?{...user,profile_picture_uri:''}:user} className="h-20 w-20 text-xl"/>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">JPG, PNG or WebP, up to 5 MB.</p>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Choose profile picture" disabled={busy} onChange={event=>{const file=event.target.files?.[0];event.target.value='';if(file) save(file);}}/>
        <div className="flex flex-wrap gap-2"><Button type="button" disabled={busy||pictureHidden} onClick={()=>input.current?.click()}>{busy && <Loader2 className="h-4 w-4 animate-spin"/>}{busy ? 'Saving…' : user?.profile_picture_uri ? 'Change picture' : 'Add picture'}</Button>{user?.profile_picture_uri && !pictureHidden && <Button type="button" variant="outline" disabled={busy} onClick={remove}>Remove picture</Button>}</div>
      </div>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="text-sm text-success">{message}</p>}
  </section>;
}