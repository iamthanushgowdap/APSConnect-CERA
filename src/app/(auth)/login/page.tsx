"use client";

import { useForm } from "react-hook-form";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from '@/components/ui/password-input';
import { useToast } from "@/hooks/use-toast";
import { useAuth, User } from "@/components/auth-provider";
import { ShootingStars } from "@/components/ui/shooting-stars";

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    // Simple email validation
    const { email, password } = data;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      form.setError("email", {
        type: "manual",
        message: "Please enter a valid email address.",
      });
      return;
    }

    setIsLoading(true);
    try {
      let targetRoute = "/dashboard";
      let loggedInUser: User;

      // Sign in with email (assuming signIn expects email as username)
      loggedInUser = await signIn({
        username: email,
        password,
      });

      // Redirect based on user role (assuming User object has role property)
      if (loggedInUser.role === "admin") {
        targetRoute = "/admin";
      } else if (loggedInUser.role === "faculty") {
        targetRoute = "/faculty";
      } else {
        targetRoute = "/dashboard"; // Student default
      }

      toast({
        title: "Login Successful",
        description: `Welcome back${loggedInUser.displayName ? `, ${loggedInUser.displayName}` : ''}!`,
        duration: 3000,
      });
      router.push(targetRoute);

    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or an unexpected error occurred. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <ShootingStars />
      <div className="container mx-auto px-4 py-8 pt-28 pb-48 min-h-screen" style={{ backgroundColor: 'hsl(var(--background))', fontFamily: "'Poppins', sans-serif" }}>
      <div className="flex justify-center">
        {/* Background Shapes */}
        <div className="background relative" style={{
          width: '320px',
          height: '425px', // Updated to match new form height
          margin: '0 auto'
        }}>
          <div className="shape" style={{
            height: '120px',
            width: '120px',
            position: 'absolute',
            borderRadius: '50%',
            background: 'linear-gradient(#1845ad, #23a2f6)',
            left: '-40px',
            top: '-40px'
          }}></div>
          <div className="shape" style={{
            height: '120px',
            width: '120px',
            position: 'absolute',
            borderRadius: '50%',
            background: 'linear-gradient(to right, #ff512f, #f09819)',
            right: '-30px', // Moved from -20px to -30px (about 3% to the right)
            bottom: '-40px'
          }}></div>

          {/* Glassmorphism Form */}
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            style={{
              height: '425px', // Reduced from 450px to 425px (25px increase instead of 50px)
              width: '320px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              position: 'relative',
              borderRadius: '10px',
              backdropFilter: 'blur(15px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              padding: '35px 30px',
              color: 'hsl(var(--foreground))',
              fontFamily: "'Poppins', sans-serif",
              zIndex: 10,
              marginTop: '5px' // Reduced from 10px to 5px
            }}
          >
        <h3 style={{
          fontSize: '32px',
          fontWeight: '500',
          lineHeight: '42px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          Login Here
        </h3>

        <Form {...form}>
          <div style={{ marginTop: '30px' }}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{
                    display: 'block',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: 'hsl(var(--foreground))',
                    marginBottom: '8px'
                  }}>
                    Email
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="Enter your email address"
                      style={{
                        display: 'block',
                        height: '50px',
                        width: '100%',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '3px',
                        padding: '0 10px',
                        fontSize: '14px',
                        fontWeight: '300',
                        color: 'hsl(var(--foreground))',
                        border: '1px solid rgba(255,255,255,0.3)',
                        outline: 'none'
                      }}
                      suppressHydrationWarning
                    />
                  </FormControl>
                  <FormMessage style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }} />
                </FormItem>
              )}
            />
          </div>

          <div style={{ marginTop: '30px' }}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel style={{
                    display: 'block',
                    fontSize: '16px',
                    fontWeight: '500',
                    color: 'hsl(var(--foreground))',
                    marginBottom: '8px'
                  }}>
                    Password
                  </FormLabel>
                  <FormControl>
                    <PasswordInput
                      {...field}
                      placeholder="Password"
                      style={{
                        display: 'block',
                        height: '50px',
                        width: '100%',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '3px',
                        padding: '0 10px',
                        fontSize: '14px',
                        fontWeight: '300',
                        color: 'hsl(var(--foreground))',
                        border: '1px solid rgba(255,255,255,0.3)',
                        outline: 'none'
                      }}
                      suppressHydrationWarning
                    />
                  </FormControl>
                  <FormMessage style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }} />
                </FormItem>
              )}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '55px', // Reduced from 60px to 55px
              width: '100%',
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              padding: '15px 0',
              fontSize: '18px',
              fontWeight: '600',
              borderRadius: '5px',
              border: 'none',
              cursor: 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>

          {/* Social buttons removed as per original design but can be added later */}
          {/*
          <div className="social" style={{ marginTop: '30px', display: 'flex' }}>
            <div style={{ background: 'red', width: '150px', borderRadius: '3px', padding: '5px 10px 10px 5px', backgroundColor: 'rgba(255,255,255,0.27)', color: '#eaf0fb', textAlign: 'center' }}>
              <i className="fab fa-google" style={{ marginRight: '4px' }}></i> Google
            </div>
            <div style={{ background: 'red', width: '150px', borderRadius: '3px', padding: '5px 10px 10px 5px', backgroundColor: 'rgba(255,255,255,0.27)', color: '#eaf0fb', textAlign: 'center', marginLeft: '25px' }}>
              <i className="fab fa-facebook" style={{ marginRight: '4px' }}></i> Facebook
            </div>
          </div>
          */}

          <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '14px' }}>
            <p style={{ color: 'hsl(var(--foreground))', marginBottom: '10px' }}>
              Don&apos;t have an account?{" "}
              <Link href="/register" style={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', textDecoration: 'underline' }}>
                Register here
              </Link>
            </p>
            <p style={{ color: 'hsl(var(--foreground))' }}>
              <Link href="/forgot-password" style={{ color: 'hsl(var(--foreground))', fontWeight: 'bold', textDecoration: 'underline' }}>
                Forgot password?
              </Link>
            </p>
          </div>
        </Form>
        </form>
        </div>
      </div>
    </div>
    </>
  );
}