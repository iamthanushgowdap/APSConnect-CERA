"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Facebook, Instagram, Linkedin, Send } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

function Footerdemo() {
  return (
    <footer className="relative border-t bg-background text-foreground transition-colors duration-300">
      <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <h2 className="mb-4 text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              APSConnect
            </h2>
            <p className="mb-6 text-muted-foreground">
              Empowering education through seamless communication and collaboration for APS College students.
            </p>
            <form className="relative">
              <Input
                type="email"
                placeholder="Enter your email for updates"
                className="pr-12 backdrop-blur-sm"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105"
              >
                <Send className="h-4 w-4" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
            <div className="absolute -right-4 top-0 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Academic Tools</h3>
            <nav className="space-y-2 text-sm">
              <a href="/cera" className="block transition-colors hover:text-primary">
                CERA AI Assistant
              </a>
              <a href="/student/attendance" className="block transition-colors hover:text-primary">
                Attendance Tracker
              </a>
              <a href="/student/timetable" className="block transition-colors hover:text-primary">
                Class Timetable
              </a>
              <a href="/student/assignments" className="block transition-colors hover:text-primary">
                Assignments
              </a>
              <a href="/student/study-materials" className="block transition-colors hover:text-primary">
                Study Materials
              </a>
            </nav>
          </div>
          <div>
            <h3 className="mb-4 text-lg font-semibold">Community</h3>
            <nav className="space-y-2 text-sm">
              <a href="/events" className="block transition-colors hover:text-primary">
                Campus Events
              </a>
              <a href="/clubs" className="block transition-colors hover:text-primary">
                Student Clubs
              </a>
              <a href="/student/fundraising" className="block transition-colors hover:text-primary">
                Fundraising
              </a>
              <a href="/alumni" className="block transition-colors hover:text-primary">
                Alumni Network
              </a>
              <a href="/student/report-concern" className="block transition-colors hover:text-primary">
                Report Concerns
              </a>
            </nav>
          </div>
          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold">Connect With Us</h3>
            <div className="mb-6 flex space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Facebook className="h-4 w-4" />
                      <span className="sr-only">Facebook</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Follow APS College on Facebook</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Instagram className="h-4 w-4" />
                      <span className="sr-only">Instagram</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Follow APS College on Instagram</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <Linkedin className="h-4 w-4" />
                      <span className="sr-only">LinkedIn</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Connect with APS College on LinkedIn</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-center md:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2024 APS College. All rights reserved. | Powered by APSConnect
          </p>
          <nav className="flex gap-4 text-sm">
            <a href="/privacy" className="transition-colors hover:text-primary">
              Privacy Policy
            </a>
            <a href="/terms" className="transition-colors hover:text-primary">
              Terms of Service
            </a>
            <a href="/support" className="transition-colors hover:text-primary">
              Support
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export { Footerdemo }
