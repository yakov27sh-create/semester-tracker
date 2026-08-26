import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";

import { useUserContext } from "@/entities/user/UserContext";

import { signOutUser } from "../auth";
import { EmailAuthForm } from "./EmailAuthForm";

function HeaderAuth({ className }: { className?: string }) {
  const ctx = useUserContext();
  const userProfile = ctx.profile;
  const isLoggedIn = ctx?.user?.id ? true : false;

  return (
    <div className={className}>
      {ctx?.loading ? (
        "loading.."
      ) : isLoggedIn ? (
        userProfile ? (
          <LoggedIn email={ctx.user?.email} />
        ) : (
          "loading..."
        )
      ) : (
        <NotLoggedIn />
      )}
    </div>
  );
}

export default HeaderAuth;

function NotLoggedIn() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>התחבר</Button>
      </DialogTrigger>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>התחברות</DialogTitle>
        </DialogHeader>
        <EmailAuthForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function LoggedIn({ email }: { email?: string }) {
  return (
    <div className="flex items-center gap-2">
      {email && <span className="text-sm text-muted-foreground">{email}</span>}
      <Button onClick={() => signOutUser()} variant={"outline"}>
        התנתק
      </Button>
    </div>
  );
}
