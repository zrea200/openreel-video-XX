import React, { useState, useCallback } from "react";
import { Lock, Eye, EyeOff, ShieldCheck, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@openreel/ui";
import { Input } from "@openreel/ui";
import { Button } from "@openreel/ui";

interface MasterPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "setup" | "unlock" | "change";
  onSubmit: (password: string, newPassword?: string) => Promise<boolean>;
}

export const MasterPasswordDialog: React.FC<MasterPasswordDialogProps> = ({
  isOpen,
  onClose,
  mode,
  onSubmit,
}) => {
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resetForm = useCallback(() => {
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowNewPassword(false);
    setError(null);
    setLoading(false);
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "setup") {
      if (password.length < 8) {
        setError("密码至少 8 个字符");
        return;
      }
      if (password !== confirmPassword) {
        setError("两次输入的密码不一致");
        return;
      }
    }

    if (mode === "change") {
      if (newPassword.length < 8) {
        setError("新密码至少 8 个字符");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("两次输入的新密码不一致");
        return;
      }
    }

    setLoading(true);
    try {
      const success = await onSubmit(
        password,
        mode === "change" ? newPassword : undefined,
      );
      if (success) {
        resetForm();
      } else {
        setError(
          mode === "unlock"
            ? "密码错误"
            : "操作失败，请检查当前密码。",
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "发生错误");
    } finally {
      setLoading(false);
    }
  }, [mode, password, newPassword, confirmPassword, onSubmit, resetForm]);

  const titles = {
    setup: "设置主密码",
    unlock: "解锁设置",
    change: "更改主密码",
  };

  const descriptions = {
    setup: "创建主密码以加密 API 密钥。密码不会存储，仅保留校验哈希。",
    unlock: "输入主密码以访问已加密的 API 密钥。",
    change: "更改主密码后，所有已存密钥将重新加密。",
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock size={18} className="text-primary" />
            {titles[mode]}
          </DialogTitle>
          <DialogDescription>{descriptions[mode]}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "change" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                当前密码
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="输入当前密码"
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {(mode === "setup" || mode === "unlock") && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">
                {mode === "setup" ? "密码" : "主密码"}
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    mode === "setup"
                      ? "至少 8 个字符"
                      : "输入主密码"
                  }
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {(mode === "setup" || mode === "change") && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-secondary">
                  {mode === "change" ? "新密码" : "确认密码"}
                </label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={mode === "change" ? newPassword : confirmPassword}
                    onChange={(e) =>
                      mode === "change"
                        ? setNewPassword(e.target.value)
                        : setConfirmPassword(e.target.value)
                    }
                    placeholder={
                      mode === "change"
                        ? "至少 8 个字符"
                        : "再次输入密码"
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {mode === "change" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-secondary">
                    确认新密码
                  </label>
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入新密码"
                  />
                </div>
              )}
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-error bg-error/10 px-3 py-2 rounded-lg">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          {mode === "setup" && (
            <div className="flex items-start gap-2 text-xs text-text-muted bg-background-secondary px-3 py-2 rounded-lg">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-primary" />
              <span>
                密码经 PBKDF2（10 万次迭代）派生加密密钥，API 密钥使用 AES-256-GCM
                加密。若忘记密码，已存密钥无法恢复。
              </span>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "处理中…"
                : mode === "setup"
                  ? "设置密码"
                  : mode === "unlock"
                    ? "解锁"
                    : "更改密码"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
