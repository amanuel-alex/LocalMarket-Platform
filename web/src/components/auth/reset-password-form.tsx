"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { parseApiError, resetPasswordRequest } from "@/lib/auth-api";
import { resetPasswordFormSchema, type ResetPasswordFormValues } from "@/lib/validations/auth";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordFormValues) {
    setServerError(null);
    if (!token) {
      setServerError("Missing reset token. Open the link from your reset email or the forgot-password page.");
      return;
    }
    try {
      await resetPasswordRequest(token, values.password);
      router.push("/login");
      router.refresh();
    } catch (e) {
      setServerError(parseApiError(e));
    }
  }

  if (!token) {
    return (
      <Card className="border-border/60 shadow-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold tracking-tight">Invalid link</CardTitle>
          <CardDescription>
            This page needs a valid reset token in the URL. Request a new reset from forgot password.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/forgot-password">Forgot password</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">Choose a new password</CardTitle>
        <CardDescription>Use at least 8 characters.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError ? (
              <div
                role="alert"
                className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {serverError}
              </div>
            ) : null}

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="new-password"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full rounded-xl"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Updating…" : "Update password"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center border-t border-border/60 pt-6">
        <Link href="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
