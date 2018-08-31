Static Site hosted on Netlify with content from Contentful.

# Configure
Create a `contentful.js` configuration file in `config/contentful.json`;

```
module.exports = {
  spaceId: "...",
  contentDeliveryAccessToken: "...",
  contentPreviewAccessToken: "...",
};

```

# Build
```
npm run build
```

# Static Site
A static site will be generated in `public/`.

# Serve
```
npm start
```