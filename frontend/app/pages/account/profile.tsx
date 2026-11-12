import { useState } from "react";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import { LogOut, KeyRound, User } from "lucide-react";
import {
  useChangePasswordMutation,
  useGetMeQuery,
  useLogoutMutation,
  useUpdateProfileMutation,
} from "~/redux/api";
import { errorMessage } from "~/utils/format";

export default function ProfilePage() {
  const { data: user } = useGetMeQuery();
  const [updateProfile, { isLoading: savingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: savingPassword }] = useChangePasswordMutation();
  const [logout] = useLogoutMutation();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<{ name: string; phone: string } | null>(null);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirm: "",
  });

  const p = profile ?? { name: user?.name ?? "", phone: user?.phone ?? "" };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({ name: p.name, phone: p.phone || undefined }).unwrap();
      toast.success("Profile updated");
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      await changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      }).unwrap();
      toast.success("Password changed");
      setPasswords({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleLogout = async () => {
    await logout().unwrap();
    navigate("/");
  };

  if (!user) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form onSubmit={saveProfile} className="card h-fit p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
          <User size={15} /> Profile details
        </h2>
        <div className="mt-4 space-y-3">
          <div>
            <label className="label">Full name</label>
            <input
              className="input"
              value={p.name}
              onChange={(e) => setProfile({ ...p, name: e.target.value })}
              required
              minLength={2}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-gray-50" value={user.email} disabled />
          </div>
          <div>
            <label className="label">Phone</label>
            <input
              className="input"
              value={p.phone}
              onChange={(e) => setProfile({ ...p, phone: e.target.value })}
              placeholder="01XXXXXXXXX"
            />
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            {savingProfile ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      <div className="space-y-6">
        <form onSubmit={savePassword} className="card p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <KeyRound size={15} /> Change password
          </h2>
          <div className="mt-4 space-y-3">
            <div>
              <label className="label">Current password</label>
              <input
                type="password"
                className="input"
                required
                autoComplete="current-password"
                value={passwords.currentPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, currentPassword: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">New password</label>
              <input
                type="password"
                className="input"
                required
                minLength={8}
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(e) =>
                  setPasswords({ ...passwords, newPassword: e.target.value })
                }
              />
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <input
                type="password"
                className="input"
                required
                autoComplete="new-password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
              />
            </div>
            <button type="submit" disabled={savingPassword} className="btn-primary">
              {savingPassword ? "Updating..." : "Update password"}
            </button>
            <p className="text-xs text-gray-400">
              Changing your password signs out other devices.
            </p>
          </div>
        </form>

        <button type="button" onClick={handleLogout} className="btn-danger">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </div>
  );
}
