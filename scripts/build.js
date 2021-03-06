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
    <script src="https://cdn.jsdelivr.net/npm/contentful-management@5.3.2/dist/contentful-management.browser.min.js"></script>
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
        <a href="/blog/index.html" style="text-decoration:none;color:white;">Blog</a> |
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

function buildPage({ fields }) {
  // console.log("buildPage", JSON.stringify(fields));
  // console.log("buildPage", Object.keys(fields));
  buildLayout({
    slug: fields.slug,
    title: fields.title,
    metaDescription: fields.metaDescription,
    body: marked(fields.body),
  });
}

function buildPost({ sys, fields }) {
  // console.log("buildPost", JSON.stringify(fields));
  // console.log("buildPost", Object.keys(fields));
  // console.log("buildPost", JSON.stringify(sys));
  // console.log("buildPost", Object.keys(sys));
  const body = `<div>
  <div>${marked(fields.description)}</div>
  ${buildComments(fields.comments)}
  ${addComment({ spaceId: sys.space.sys.id, postId: sys.id })}
</div>`;
  buildLayout({
    slug: `blog/${fields.slug}`,
    title: fields.title,
    metaDescription: fields.metaDescription,
    body: body,
  });
}

function buildComments(comments) {
  if (comments) {
    return `<div>
  <hr style="height:0.25em;background-color:gold;border:none;" />
  <h3>Comments</h3>
  <ol>${comments.map(buildComment).join("")}</ol>
  <hr style="height:0.25em;background-color:orange;border:none;" />
</div>`;
  }
  return "";
}

function buildComment({ fields }) {
  // console.log("buildComment", Object.keys(fields));
  return `<li>${fields.comment}</li>`;
}

function addComment({ spaceId, postId }) {
  // console.log("addComment", spaceId, postId);
  return `
  <form onsubmit="addComment(event)">
    <label>
      <h4>Add Comment</h4>
      <textarea name="comment" rows="3" style="width:100%;border:1px solid darkorange;"></textarea>
    </label>
    <br /><br />
    <button type="submit" style="line-height:2em;width:100%;padding:10px;background-color:gold;color:orange;font-weight:bold;font-size:1.25em;">
      Submit
    </button>
  </form>
  <script type="text/javascript">
    async function addComment(event) {
      event.preventDefault();
      const formData = new FormData(event.target);
      const comment = formData.get("comment");
      // console.log("addComment", event, formData, comment);
      const postId = "${postId}";
      const client = contentfulManagement.createClient({
        accessToken: "CFPAT-b10c43cb0eca8d4c7f7fa92e8115119f6001abe028826b6fa859a907ebd31bba"
      });
      // console.log("client", client);
      const space = await client.getSpace("${spaceId}");
      // console.log("space", space);
      const environment = await space.getEnvironment("master");
      // console.log("environment", environment);
      const commentEntry = await environment.createEntry(
        "comment", 
        { fields: { comment: { "en-US": comment } } }
      );
      await commentEntry.publish();
      // console.log("commentEntry", commentEntry);
      const postEntry = await environment.getEntry(postId);
      // console.log("postEntry", postEntry);
      // console.log("postEntry.fields.title", postEntry.fields.title);
      // console.log("postEntry.fields.comments", postEntry.fields.comments);
      // console.log("postEntry.fields.comments['en-US']", postEntry.fields.comments['en-US']);
      postEntry.fields.comments['en-US'].push({
        sys: {
          type: "Link",
          linkType: "Entry",
          id: commentEntry.sys.id
        }
      });
      const updatedPostEntry = await postEntry.update();
      // console.log("updatedPostEntry", updatedPostEntry);
      await updatedPostEntry.publish();
    }
  </script>
`;
}

function buildBlog({ items }) {
  // console.log("buildBlog", JSON.stringify(items));
  // console.log("buildBlog", Object.keys(items[0]));
  const body = `<ol>
    ${items.map(
      ({ fields }) => `<li><a href="/blog/${fields.slug}.html">${fields.title}</a></li>`
    ).join("")}
</ol>`;
  buildLayout({
    slug: "blog/index",
    title: "OrangeSlice Blog",
    metaDescription: "A Blog",
    body: body,
  });
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

  const pages = await client.getEntries({ content_type: "page" });
  // console.log("pages", JSON.stringify(pages));
  
  const posts = await client.getEntries({ content_type: "post" });
  // console.log("posts", JSON.stringify(posts));
  
  clear(); // clear the public directory
  mkdir("blog");
  pages.items.map(buildPage);
  posts.items.map(buildPost);
  buildBlog(posts);

  console.log("OK");
  return true;
}

main();
