
"use client";

import { SiteConfig } from "@/config/site";
import Link from "next/link";
import React, { useEffect, useState } from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SITE_SETTINGS_STORAGE_KEY = 'apsconnect_site_settings_v1';

interface SiteSettingsSocialLinks {
  socialfacebook?: string;
  socialtwitter?: string;
  sociallinkedin?: string;
  socialinstagram?: string;
  socialgithub?: string;
  contactemail?: string;
}

export function Footer() {
  const [socialLinks, setSocialLinks] = useState<SiteSettingsSocialLinks>({});
  const [contactEmail, setContactEmail] = useState<string>('');

  useEffect(() => {
    const loadSocialLinks = async () => {
      try {
        // Try to load from Supabase first (silently fail if table doesn't exist)
        let data, error;
        try {
          const result = await supabase
            .from('site_settings')
            .select('socialfacebook, socialtwitter, sociallinkedin, socialinstagram, socialgithub, contactemail')
            .single();
          data = result.data;
          error = result.error;
        } catch (e) {
          // Silently ignore if site_settings table doesn't exist
          data = null;
          error = null;
        }

        if (!error && data) {
          setSocialLinks(data);
          setContactEmail(data.contactemail || '');
        } else {
          // Fall back to localStorage
          if (typeof window !== 'undefined') {
            const storedSettings = localStorage.getItem(SITE_SETTINGS_STORAGE_KEY);
            if (storedSettings) {
              try {
                const parsed = JSON.parse(storedSettings) as SiteSettingsSocialLinks;
                setSocialLinks(parsed);
                setContactEmail(parsed.contactemail || '');
              } catch (e) {
                console.error("Failed to parse footer settings:", e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading footer settings:', error);
        // Fall back to localStorage
        if (typeof window !== 'undefined') {
          const storedSettings = localStorage.getItem(SITE_SETTINGS_STORAGE_KEY);
          if (storedSettings) {
            try {
              const parsed = JSON.parse(storedSettings) as SiteSettingsSocialLinks;
              setSocialLinks(parsed);
              setContactEmail(parsed.contactemail || '');
            } catch (e) {
              console.error("Failed to parse footer settings:", e);
            }
          }
        }
      }
    };

    loadSocialLinks();

    // Set up real-time subscription for social links
    const channel = supabase
      .channel('footer_social_links')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_settings'
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            const newData = payload.new as Record<string, any>;
            const newLinks: SiteSettingsSocialLinks = {};
            if (newData.socialfacebook !== undefined) newLinks.socialfacebook = newData.socialfacebook;
            if (newData.socialtwitter !== undefined) newLinks.socialtwitter = newData.socialtwitter;
            if (newData.sociallinkedin !== undefined) newLinks.sociallinkedin = newData.sociallinkedin;
            if (newData.socialinstagram !== undefined) newLinks.socialinstagram = newData.socialinstagram;
            if (newData.socialgithub !== undefined) newLinks.socialgithub = newData.socialgithub;
            if (newData.contactemail !== undefined) newLinks.contactemail = newData.contactemail;
            setSocialLinks(newLinks);
            if (newData.contactemail !== undefined) {
              setContactEmail(newData.contactemail || '');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const socialNavItems = [
    { platform: 'Facebook', href: socialLinks.socialfacebook, icon: Facebook },
    { platform: 'Twitter', href: socialLinks.socialtwitter, icon: Twitter },
    { platform: 'Instagram', href: socialLinks.socialinstagram, icon: Instagram },
    { platform: 'LinkedIn', href: socialLinks.sociallinkedin, icon: Linkedin },
    { platform: 'Github', href: socialLinks.socialgithub, icon: Github },
  ].filter(item => item.href && item.href.trim() !== '');


  return (
    <footer className="border-t border-border/40 bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-20 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} {SiteConfig.name}. All rights reserved.
          </p>
          {contactEmail && (
            <p className="text-center text-sm text-muted-foreground md:text-left">
              Contact: <a href={`mailto:${contactEmail}`} className="hover:text-primary transition-colors">
                {contactEmail}
              </a>
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
            <nav className="flex gap-4">
            {SiteConfig.footerNav?.map((item) => (
                <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-primary"
                >
                {item.title}
                </Link>
            ))}
            </nav>
            {socialNavItems.length > 0 && (
              <div className="flex gap-3">
                {socialNavItems.map((item) => (
                  <Link
                    key={item.platform}
                    href={item.href!}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.platform}
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    <item.icon className="h-5 w-5" />
                  </Link>
                ))}
              </div>
            )}
        </div>
      </div>
    </footer>
  );
}
