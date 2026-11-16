import { redirect } from "next/navigation";

// The wallet is gone (Chamba never pays workers); old links land on the profile.
export default function Billetera() {
  redirect("/perfil");
}
