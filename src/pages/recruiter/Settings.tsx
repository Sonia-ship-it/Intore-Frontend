import { AppHeader } from '@/components/layout/AppHeader';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { Moon, Sun, User, Bell, Shield, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { isDark, toggle } = useTheme();
  const { user } = useAuthStore();

  return (
    <>
      <AppHeader title="Settings" />
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-5">

        {/* Profile */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
            <div className="w-8 h-8 rounded-lg bg-[#4B7BFF]/10 flex items-center justify-center">
              <User className="h-4 w-4 text-[#4B7BFF]" />
            </div>
            <h3 className="font-semibold text-sm">Profile</h3>
          </div>
          <div className="p-6 space-y-4">
            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#4B7BFF] flex items-center justify-center text-white font-black text-lg">
                {(user?.name || 'U').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">{user?.name || '—'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || '—'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium">Full Name
                <input defaultValue={user?.name} className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all" />
              </label>
              <label className="block text-sm font-medium">Email
                <input defaultValue={user?.email} className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all" />
              </label>
            </div>
            <div className="flex justify-end">
              <Button size="sm" className="gap-2"><Save className="h-3.5 w-3.5" /> Save Changes</Button>
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
            <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              {isDark ? <Moon className="h-4 w-4 text-violet-500" /> : <Sun className="h-4 w-4 text-violet-500" />}
            </div>
            <h3 className="font-semibold text-sm">Appearance</h3>
          </div>
          <div className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground mt-0.5">Currently using {isDark ? 'dark' : 'light'} mode</p>
            </div>
            <button
              onClick={toggle}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border hover:bg-muted transition-colors text-sm font-medium"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Bell className="h-4 w-4 text-amber-500" />
            </div>
            <h3 className="font-semibold text-sm">Notifications</h3>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'New applicants', desc: 'Get notified when someone applies to your jobs' },
              { label: 'Screening complete', desc: 'Alert when AI screening finishes' },
              { label: 'Weekly digest', desc: 'Summary of activity every Monday' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <button className="w-10 h-6 rounded-full bg-[#4B7BFF] relative transition-colors">
                  <span className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Shield className="h-4 w-4 text-emerald-500" />
            </div>
            <h3 className="font-semibold text-sm">Security</h3>
          </div>
          <div className="p-6 space-y-4">
            <label className="block text-sm font-medium">Current Password
              <input type="password" placeholder="••••••••" className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm font-medium">New Password
                <input type="password" placeholder="••••••••" className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all" />
              </label>
              <label className="block text-sm font-medium">Confirm Password
                <input type="password" placeholder="••••••••" className="mt-1 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#4B7BFF]/20 focus:border-[#4B7BFF] transition-all" />
              </label>
            </div>
            <div className="flex justify-end">
              <Button size="sm" variant="outline">Update Password</Button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
