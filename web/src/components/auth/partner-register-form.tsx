"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mapAuthUserToStored, parseApiError, registerPartnerRequest } from "@/lib/auth-api";
import { setSession } from "@/lib/auth-storage";
import { getPostAuthRedirect } from "@/lib/roles";
import { partnerRegisterFormSchema, type PartnerRegisterFormValues } from "@/lib/validations/auth";

export type PartnerAccountType = "seller" | "delivery";

export function PartnerRegisterForm({ accountType }: { accountType: PartnerAccountType }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [proposalFile, setProposalFile] = useState<File | null>(null);
  const [proposalTouched, setProposalTouched] = useState(false);

  const form = useForm<PartnerRegisterFormValues>({
    resolver: zodResolver(partnerRegisterFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      about: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: PartnerRegisterFormValues) {
    setServerError(null);
    setProposalTouched(true);
    if (!proposalFile) {
      setServerError("Please upload a proposal (PDF or image, max 10MB).");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("name", values.name);
      fd.append("phone", values.phone);
      fd.append("password", values.password);
      fd.append("email", values.email);
      fd.append("about", values.about);
      fd.append("accountType", accountType);
      fd.append("proposal", proposalFile);

      const data = await registerPartnerRequest(fd);
      const user = mapAuthUserToStored(data.user as Record<string, unknown>);
      setSession({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user,
      });
      router.push(getPostAuthRedirect(user));
      router.refresh();
    } catch (e) {
      setServerError(parseApiError(e));
    }
  }

  const title = accountType === "seller" ? "Apply as a seller" : "Apply as a delivery partner";
  const description =
    accountType === "seller"
      ? "We need your email, a short pitch, and a proposal document. You can sign in after submitting, but listings stay locked until an admin approves your shop."
      : "Share your email, experience, and a short proposal (PDF or image). The delivery dashboard unlocks after admin approval and activation.";

  return (
    <Card className="border-border/60 shadow-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-semibold tracking-tight">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input autoComplete="name" placeholder="Your name" className="rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      className="rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>We use this to contact you about your application.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input autoComplete="tel" placeholder="+251…" className="rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="about"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>About you</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={
                        accountType === "seller"
                          ? "Describe your shop, what you sell, and any licenses or experience…"
                          : "Your delivery experience, vehicle or coverage area, availability…"
                      }
                      className="min-h-[120px] rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>At least a few sentences (20+ characters).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label htmlFor="partner-proposal-upload">Proposal upload</Label>
              <Input
                id="partner-proposal-upload"
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp,application/pdf"
                className="cursor-pointer rounded-xl file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm"
                onChange={(e) => {
                  setProposalTouched(true);
                  setProposalFile(e.target.files?.[0] ?? null);
                }}
              />
              <p className="text-xs text-muted-foreground">
                PDF or image (JPEG, PNG, WebP), maximum 10MB. Business plan, license scan, or capability summary.
              </p>
              {proposalTouched && !proposalFile ? (
                <p className="text-sm font-medium text-destructive">Choose a file to continue.</p>
              ) : null}
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
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
              {form.formState.isSubmitting ? "Submitting application…" : "Submit application"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-2 border-t border-border/60 pt-6">
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/register/buyer" className="font-medium text-foreground underline-offset-4 hover:underline">
            Shopper signup
          </Link>
          <span className="mx-1.5 text-border">·</span>
          {accountType === "seller" ? (
            <Link href="/register/delivery" className="font-medium text-foreground underline-offset-4 hover:underline">
              Delivery signup instead
            </Link>
          ) : (
            <Link href="/register/seller" className="font-medium text-foreground underline-offset-4 hover:underline">
              Seller signup instead
            </Link>
          )}
        </p>
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
