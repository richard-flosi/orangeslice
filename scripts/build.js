const fs = require("fs-extra");
const path = require("path");

function configure() {
  // default configuration
  let config = { spaceId: null, contentDeliveryAccessToken: null, contentPreviewAccessToken: null };
  
  // get configuration file
  const configurationFile = "../config/contentful.js";  
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
  // console.log(path.join(publicDirectory(), directory));
  fs.mkdirSync(path.join(publicDirectory(), directory));
}

function build({ nextSyncToken, entries, assets, deletedEntries, deletedAssets }) {
  const locale = "en-US";
  // console.log("nextSyncToken", nextSyncToken);
  clear();
  const indexHtml = `<html>
  <head><title>hello world</title></head>
  <body>
    <h1>Hello World!</h1>
    <p>Welcome to Mowebev.</p>
    <h2><a href="/page/about.html">About</a></h2>
    <ul>
      <li><a href="/post/a-walk-in-the-park.html">A Walk in the Park</a></li>
      <li><a href="/post/beach-day.html">Beach Day</a></li>
      <li><a href="/post/puppies.html">Puppies</a></li>
      <li><a href="/post/sailing-around-the-bay.html">Sailing Around the Bay</a></li>
    </ul>
  </body>
</html>`;
  write("index.html", indexHtml);
  mkdir("page");
  mkdir("post");
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
    // case "tag":
    //   return buildTag(fields);
    case "page":
      return buildPage(fields);
    case "post":
      return buildPost(fields);
    // default:
    //   console.log("ignoring contentType id:", id);
  }
}

// ignoring tags
// function buildTag(fields) {
//   const locale = "en-US";
//   // console.log("buildTag", fields);
//   console.log("tag", fields.title[locale], fields.slug[locale]);
// }

function buildPage(fields) {
  const marked = require("marked");
  const locale = "en-US";
  // console.log("buildPage", Object.keys(fields));
  const content = `<html>
  <head>
    <title>${fields.title[locale]}</title>
  </head>
  <body>
    <a href="/">Home</a>
    <h1>${fields.title[locale]}</h1>
    <i>${fields.slug[locale]}</i>
    <p>${marked(fields.body[locale])}</p>
    <p>${fields.metaDescription[locale]}</p>
  </body>
</html>`;
  write(`page/${fields.slug[locale]}.html`, content);
  // console.log("page", fields.title[locale], fields.slug[locale], fields.body[locale].substring(0,10), fields.metaDescription[locale].substring(0, 10));
}

function buildPost(fields) {
  const locale = "en-US";
  // console.log("buildPost", Object.keys(fields));
  const content = `<html>
  <head>
    <title>${fields.title[locale]}</title>
  </head>
  <body>
    <a href="/">Home</a>
    <h1>${fields.title[locale]}</h1>
    <i>${fields.slug[locale]}</i>
    <b>${fields.publishDate[locale]}</b>
    <p>${fields.body[locale]}</p>
    <p>${fields.tags[locale].map((tag) => tag.fields.title[locale]).join(", ")}</p>
    <p>${fields.heroImage[locale].fields.title[locale]}</p>
    <img 
      src="${fields.heroImage[locale].fields.file[locale].url}" 
      alt="${fields.heroImage[locale].fields.title[locale]}"
    />
  </body>
</html>`;
  write(`post/${fields.slug[locale]}.html`, content);
  // console.log("post", fields.title[locale], fields.slug[locale], fields.publishDate[locale], fields.body[locale].substring(0, 10));
  // console.log("    ", "tags", "[ ", fields.tags[locale].map((tag) => tag.fields.title[locale]).join(", "), " ]");
  // console.log("    ", "heroImage", "title", fields.heroImage[locale].fields.title[locale]);
  // console.log("    ", "heroImage", "url", fields.heroImage[locale].fields.file[locale].url.substring(0, 20));
}

async function main() {
  const contentful = require("contentful");
  const config = configure();
  // console.log("config", config);
  const client = contentful.createClient({
    space: config.spaceId,
    accessToken: config.contentDeliveryAccessToken,
  });
  // const locales = await client.getLocales();
  // console.log("locales", locales);
  const delta = await client.sync({ initial: true });
  // console.log("delta", delta);
  // console.log("delta", Object.keys(delta));
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