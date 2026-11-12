import { useState } from "react";
import { Link } from "react-router";
import toast from "react-hot-toast";
import { useForgotPasswordMutation } from "~/redux/api";
import { errorMessage } from "~/utils/format";

export default function ForgotPasswordPage() {
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await forgotPassword({ email }).unwrap();
      setSent(true);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-gray-900">Reset password</h1>
      {sent ? (
        <div className="mt-4 rounded-lg bg-green-50 p-4 text-sm text-green-800">
          If an account exists for <strong>{email}</strong>, a reset link has
          been sent. In development, the link is printed in the API console.
        </div>
      ) : (
        <>
          <p className="mt-1 text-sm text-gray-500">
            We'll email you a link to set a new password.
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        </>
      )}
      <p className="mt-6 text-center text-sm text-gray-600">
        <Link to="/auth/login" className="font-medium text-indigo-600 hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
