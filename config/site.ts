export const siteConfig = {
  name: "OmniDoc",
  description: "Smart PDF editor with AI capabilities",
  url: "https://omnidoc.ai",
  ogImage: "https://omnidoc.ai/og.jpg",
  links: {
    github: "https://github.com/omnidoc/omnidoc",
  },
} as const;

export type SiteConfig = typeof siteConfig;
