Static Site hosted on Netlify with content from Contentful.

# Configure
Create a configuration file in `config/contentful.json`;

```
{
  "spaceId": "...",
  "contentDeliveryAccessToken": "...",
  "contentPreviewAccessToken": "...",
}

```

# Build
Build using the Contentful Sync API
https://www.contentful.com/developers/docs/javascript/tutorials/using-the-sync-api-with-js/
```
npm run build
```

# Static Site
A static site will be generated in `public/`.

# Serve
```
npm start
```

# Webhooks
Configure settings for Continuous Deployment from a Git repository
https://app.netlify.com/sites/orangeslice/settings/deploys

Configure a build webhook in Settings > Webhooks
https://github.com/richard-flosi/orangeslice/settings/hooks

Add a Webhook to Netlify when Contentful content changes
https://www.contentful.com/developers/docs/tutorials/general/automate-site-builds-with-webhooks/

# Netlify Forms
https://app.netlify.com/sites/orangeslice/forms
Docs: https://www.netlify.com/docs/form-handling/
