import Link from "next/link";
import GoogleSigninButton from "../GoogleSigninButton";
import SigninWithPassword from "../SigninWithPassword";

export default function Signin() {
  return (
    <>
      <div className="my-6 flex items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold text-dark dark:text-white sm:text-heading-3">
          Sign In!
        </h1>
      </div>

      <div>
        <SigninWithPassword />
      </div>
    </>
  );
}
