const fs = require("fs-extra");
const path = require("path");
const marked = require("marked");
const locale = "en-US";

function configure() {
  // default configuration
  let config = { spaceId: null, contentDeliveryAccessToken: null, contentPreviewAccessToken: null };
  
  // get configuration file
  const configurationFile = "../config/contentful.json";
  try {
    config = require(configurationFile);
  } catch (e) {
    console.log(`No configration file found at ${configurationFile}`);
  }

  // get environment variables
  if (process.env.CONTENTFUL_SPACE_ID) {
    config.spaceId = process.env.CONTENTFUL_SPACE_ID;
  }
  if (process.env.CONTENTFUL_CONTENT_DELIVERY_ACCESS_TOKEN) {
    config.contentDeliveryAccessToken = process.env.CONTENTFUL_CONTENT_DELIVERY_ACCESS_TOKEN;
  }
  if (process.env.CONTENTFUL_CONTENT_PREVIEW_ACCESS_TOKEN) {
    config.contentPreviewAccessToken = process.env.CONTENTFUL_CONTENT_PREVIEW_ACCESS_TOKEN;
  }

  // validate configuration
  if (
    config.spaceId === null || 
    config.contentDeliveryAccessToken === null || 
    config.contentPreviewAccessToken === null
  ) {
    throw new Error(
      `Could not find Contentful configuration values for 
      spaceId, contentDeliveryAccessToken, or contentPreviewAccessToken: 
      ${config}`
    );
  }

  return config;
}

function publicDirectory() {
  return path.join(path.resolve(path.dirname(".")), "public");
}

function clear() {
  fs.emptyDirSync(publicDirectory())
}

function write(filename, content) {
  fs.writeSync(fs.openSync(path.join(publicDirectory(), filename), "w"), content);
}

function mkdir(directory) {
  fs.ensureDirSync(path.join(publicDirectory(), directory));
}

function build({ entries, assets, deletedEntries, deletedAssets }) {
  const locale = "en-US";
  entries.forEach(buildEntry);
  // console.log("entries", entries);
  // console.log("entry", entries[0].fields);
  // console.log("entry", entries[0].sys.contentType.sys.id);
  // console.log("this", this);
  // console.log("parsedEntries", this.parseEntries(entries).items);
  // console.log("assets", assets);
  // console.log("asset", JSON.stringify(assets[0]));
  // console.log("deletedEntries", deletedEntries);
  // console.log("deletedAssets", deletedAssets);
}

function buildEntry({ sys, fields }) {
  const id = sys.contentType.sys.id;
  // console.log("buildEntry", id);
  switch (id) {
    case "page":
      return buildPage(fields);
    case "post":
      return buildPost(fields);
  }
}

function buildLayout({ slug, title, metaDescription, body }) {
  const content = `<html>
  <head>
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${metaDescription}">
    <style type="text/css">
      a {
        font-weight: 100;
      }
      a:link, a:visited {
        color: darkorange;
      }
      a:hover {
        color: orange;
      }
      a:active {
        color: gold;
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:darkorange;font-family:helvetica,arial,sans-serif;">
    <a href="/" style="text-decoration:none;">
      <h1 style="margin:0;padding:10px;line-height:1.75em;background-color:darkorange;color:white;text-align:center;">
        orangeslice
      </h1>
    </a>
    <nav>
      <div style="padding:10px;link-height:1.5em;background-color:orange;color:ghostwhite;text-align:center;">
        <a href="/about.html" style="text-decoration:none;color:white;">About</a> |
        <a href="/services.html" style="text-decoration:none;color:white;">Services</a> |
        <a href="/clients.html" style="text-decoration:none;color:white;">Clients</a> |
        <a href="/contact.html" style="text-decoration:none;color:white;">Contact</a>
      </div>
    </nav>
    <header>
      <h2 style="margin:0;padding:20px;line-height:1.25em;background-color:gold;color:darkorange;">
        <div style="max-width:600px;margin-left:auto;margin-right:auto;">
          ${title}
        </div>
      </h2>
    </header>
    <main>
      <div style="padding:20px;line-height:1.25em;background-color:white;color:darkorange;">
        <div style="max-width:600px;margin-left:auto;margin-right:auto;">
          ${body}
        </div>
      </div>
    </main>
    <footer>
      <div style="padding:20px;line-height:1.75em;background-color:darkorange;color:white;text-align:center;">
        Orange Slice &copy; orangeslice
      </div>
    </footer>
  </body>
</html>`;
  write(`${slug}.html`, content);
}

function buildPage(fields) {
  // console.log("buildPage", Object.keys(fields));
  buildLayout({
    slug: fields.slug[locale],
    title: fields.title[locale],
    metaDescription: fields.metaDescription[locale],
    body: marked(fields.body[locale]),
  });
}

function buildPost(fields) {
  console.log("buildPost", Object.keys(fields));
  const body = `<div>
  <div>${marked(fields.description[locale])}</div>
  <div>
    <h3>Comments</h3>
    
  </div>
</div>`;
  buildLayout({
    slug: `blog/${fields.slug[locale]}`,
    title: fields.title[locale],
    metaDescription: fields.metaDescription[locale],
    body: body,
  });
}

function buildComment(fields) {
  console.log("buildComment", Object.keys(fields));
  return `<div>
  TODO: the comment
</div>`;
}

async function main() {
  const contentful = require("contentful");
  fs.ensureDirSync(path.join("config"));
  const config = configure();
  // console.log("config", config);
  const client = contentful.createClient({
    space: config.spaceId,
    accessToken: config.contentDeliveryAccessToken,
  });

  // let syncOptions = { initial: true };

  // const locales = await client.getLocales();
  // console.log("locales", locales);

  // const delta = await client.sync(syncOptions);
  // console.log("delta", JSON.stringify(delta));
  // console.log("delta", Object.keys(delta));
  
  const entries = await client.getEntries();
  console.log("entries", JSON.stringify(entries));

  const posts = await client.getEntries({ content_type: "post" });
  console.log("posts", JSON.stringify(posts));
  
  clear(); // clear the public directory
  mkdir("blog");
  build(entries);

  console.log("OK");
  return true;
}

main();
