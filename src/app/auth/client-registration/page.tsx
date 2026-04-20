import { redirect } from "next/navigation";

export default function AuthClientRegistrationRedirect() {
  redirect("/client-registration");
}
