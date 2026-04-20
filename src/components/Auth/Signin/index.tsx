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

      <p className="mt-4 text-center text-sm text-dark-5 dark:text-dark-6">
        New client?{" "}
        <Link href="/client-registration" className="font-medium text-primary">
          Create an account
        </Link>
      </p>
    </>
  );
}
