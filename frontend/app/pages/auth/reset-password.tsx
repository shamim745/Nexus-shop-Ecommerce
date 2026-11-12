import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import toast from "react-hot-toast";
import { useResetPasswordMutation } from "~/redux/api";
import { errorMessage } from "~/utils/format";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await resetPassword({ token, password }).unwrap();
      toast.success("Password updated — please sign in");
      navigate("/auth/login", { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  if (!token) {
    return (
      <div className="card p-6 text-center text-sm text-red-600">
        Missing reset token. Request a new link from the{" "}
        <Link to="/auth/forgot-password" className="font-medium underline">
          forgot password page
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="card p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-gray-900">Choose a new password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="label">
            New password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="label">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            required
            className="input"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Repeat password"
          />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
