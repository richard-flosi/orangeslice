const fs = require("fs-extra");
const path = require("path");

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

function nextSyncToken() {
  let nextSyncToken = null;
  const nextSyncTokenFile = "../config/nextSyncToken.json";
  try {
    nextSyncToken = require(nextSyncTokenFile);
  } catch (e) {
    console.log(`No nextSyncToken file found at ${nextSyncTokenFile}`);
  }
  return nextSyncToken;
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
  // console.log(path.join(publicDirectory(), directory));
  fs.ensureDirSync(path.join(publicDirectory(), directory));
}

function build({ nextSyncToken, entries, assets, deletedEntries, deletedAssets }) {
  const locale = "en-US";
  // console.log("nextSyncToken", nextSyncToken);  
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
  }
}

function buildPage(fields) {
  const marked = require("marked");
  const locale = "en-US";
  // console.log("buildPage", Object.keys(fields));
  const content = `<html>
  <head>
    <title>${fields.title[locale]}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="${fields.metaDescription[locale]}">
  </head>
  <body style="margin:0;padding:0;background-color:black;font-family:helvetica,arial,sans-serif;">
    <a href="/" style="text-decoration:none;">
      <h1 style="margin:0;padding:10px;line-height:1.75em;background-color:black;color:white;text-align:center;">
        Mowebev
      </h1>
    </a>
    <nav>
      <div style="padding:10px;link-height:1.5em;background-color:gray;color:ghostwhite;text-align:center;">
        <a href="/about.html" style="text-decoration:none;color:white;">About</a> |
        <a href="/services.html" style="text-decoration:none;color:white;">Services</a> |
        <a href="/clients.html" style="text-decoration:none;color:white;">Clients</a> |
        <a href="/contact.html" style="text-decoration:none;color:white;">Contact</a>
      </div>
    </nav>
    <header>
      <h2 style="margin:0;padding:20px;line-height:1.25em;background-color:silver;color:black;">
        ${fields.title[locale]}
      </h2>
    </header>
    <main>
      <div style="padding:20px;line-height:1.25em;background-color:white;color:black;">
        ${marked(fields.body[locale])}
      </div>
    </main>
    <footer>
      <div style="padding:20px;line-height:1.75em;background-color:black;color:white;text-align:center;">
        Modern Web Development &copy; Mowebev
      </div>
    </footer>
  </body>
</html>`;
  write(`${fields.slug[locale]}.html`, content);
  // console.log("page", fields.title[locale], fields.slug[locale], fields.body[locale].substring(0,10), fields.metaDescription[locale].substring(0, 10));
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

  const syncToken = nextSyncToken();
  let syncOptions = { initial: true };
  if (syncToken) {
    syncOptions = { nextSyncToken: syncToken.nextSyncToken };
  } else {
    // if we don't have a token,
    // then clear the public directory
    clear();
  }

  // const locales = await client.getLocales();
  // console.log("locales", locales);

  const delta = await client.sync(syncOptions);
  // console.log("delta", JSON.stringify(delta));
  // console.log("delta", Object.keys(delta));

  fs.writeSync(
    fs.openSync(path.join("config", "nextSyncToken.json"), "w"), 
    JSON.stringify({ nextSyncToken: delta.nextSyncToken })
  );

  build(delta);

  // const nextDelta = await client.sync({ nextSyncToken: delta.nextSyncToken });
  // console.log("nextDelta", nextDelta);
  // console.log("Synced: ", delta.nextSyncToken === nextDelta.nextSyncToken);
  console.log("done.");
  return true;
}

main();

// TODO, import api keys from environment variable or configuration file
// TODO, does the entry for a post get updated when a related tag is updated or deleted?