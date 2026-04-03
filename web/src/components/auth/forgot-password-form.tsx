"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
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
import { forgotPasswordRequest, parseApiError } from "@/lib/auth-api";
import { forgotPasswordFormSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { identifier: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null);
    setDevToken(null);
    try {
      const data = await forgotPasswordRequest(values.identifier);
      setDone(true);
      if (typeof data.resetToken === "string" && data.resetToken.length > 0) {
        setDevToken(data.resetToken);
      }
    } catch (e) {
      setServerError(parseApiError(e));
    }
  }

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">Reset password</CardTitle>
        <CardDescription>
          Enter the phone number or email on your account. In development, the API may return a link here; in
          production you would open the link from your email once outbound mail is configured.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {done ? (
          <div className="space-y-4 text-sm text-muted-foreground">
            <p>
              If an account matches that phone or email, password reset instructions have been recorded. Check your
              messages or use the link below when the API is in development mode.
            </p>
            {devToken ? (
              <div className="rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-foreground">
                <p className="font-medium text-primary">Development / QA</p>
                <p className="mt-2 break-all text-xs">
                  <Link
                    href={`/reset-password?token=${encodeURIComponent(devToken)}`}
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    Open set-new-password page
                  </Link>
                </p>
              </div>
            ) : null}
          </div>
        ) : (
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
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone or email</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete="username"
                        placeholder="+251… or you@example.com"
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
                {form.formState.isSubmitting ? "Sending…" : "Continue"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t border-border/60 pt-6">
        <Link href="/login" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}
