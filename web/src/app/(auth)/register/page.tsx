import { redirect } from "next/navigation";

/** Generic `/register` goes straight to shopper signup; seller and delivery use their own routes. */
export default function RegisterPage() {
  redirect("/register/buyer");
}
