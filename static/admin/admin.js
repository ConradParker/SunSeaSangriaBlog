// Normalize the blog "series" relation value before saving.
//
// Each series lives at content/series/<folder>/_index.md, so the collection's
// path is "{{slug}}/_index". That makes Decap's relation widget resolve
// value_field {{slug}} to "<folder>/_index" rather than the bare folder name.
// Hugo keys the series taxonomy on the folder name, so an unnormalized value
// like "sun-sea-news/_index" spawns a duplicate taxonomy term (series shown
// twice) and drops the post off its real series page. Strip the suffix so posts
// always point at the canonical folder slug = Hugo's taxonomy key.
CMS.registerEventListener({
  name: "preSave",
  handler: ({ entry }) => {
    if (entry.get("collection") !== "blog") return;
    const series = entry.getIn(["data", "series"]);
    if (typeof series === "string" && series.endsWith("/_index")) {
      return entry.get("data").set("series", series.replace(/\/_index$/, ""));
    }
  },
});

// Decap CMS Editor Components for Image Shortcodes

// Clear Float - stops text wrapping around floating images
CMS.registerEditorComponent({
  id: "clear",
  label: "Clear Float",
  fields: [],
  pattern: /{{<\s*clear\s*>}}/,
  fromBlock: function(match) {
    return {};
  },
  toBlock: function(data) {
    return `{{< clear >}}`;
  },
  toPreview: function(data) {
    return `<div style="clear: both; border-top: 1px dashed #ccc; margin: 1rem 0; padding-top: 0.5rem; color: #999; font-size: 0.8em; text-align: center;">↑ Float cleared ↑</div>`;
  }
});

// Image Float
CMS.registerEditorComponent({
  id: "image-float",
  label: "Floating Image",
  fields: [
    { name: "src", label: "Image", widget: "image" },
    { name: "position", label: "Position", widget: "select", options: ["left", "right"], default: "left" },
    { name: "alt", label: "Alt Text", widget: "string", required: false },
    { name: "caption", label: "Caption", widget: "string", required: false },
    { name: "width", label: "Width", widget: "string", required: false, default: "40%", hint: "e.g. 40%, 300px" }
  ],
  pattern: /{{<\s*image-float\s+src="([^"]+)"\s+position="([^"]+)"(?:\s+alt="([^"]*)")?(?:\s+caption="([^"]*)")?(?:\s+width="([^"]*)")?\s*>}}(?:([\s\S]*?){{<\s*\/image-float\s*>}})?/,
  fromBlock: function(match) {
    return {
      src: match[1],
      position: match[2],
      alt: match[3] || "",
      caption: (match[6] || "").trim() || match[4] || "",
      width: match[5] || "40%"
    };
  },
  toBlock: function(data) {
    let shortcode = `{{< image-float src="${data.src}" position="${data.position}"`;
    if (data.alt) shortcode += ` alt="${data.alt}"`;
    if (data.width && data.width !== "40%") shortcode += ` width="${data.width}"`;
    shortcode += ` >}}`;
    if (data.caption) shortcode += data.caption;
    shortcode += `{{< /image-float >}}`;
    return shortcode;
  },
  toPreview: function(data) {
    const margin = data.position === "left" ? "0 1rem 1rem 0" : "0 0 1rem 1rem";
    return `<figure style="float: ${data.position}; width: ${data.width || '40%'}; margin: ${margin};">
      <img src="${data.src}" alt="${data.alt || ''}" style="width: 100%; border-radius: 4px;">
      ${data.caption ? `<figcaption style="font-size: 0.9em; color: #666; font-style: italic; margin-top: 0.5rem;">${data.caption}</figcaption>` : ''}
    </figure>`;
  }
});

// Image Full Width
CMS.registerEditorComponent({
  id: "image-full",
  label: "Full Width Image",
  fields: [
    { name: "src", label: "Image", widget: "image" },
    { name: "alt", label: "Alt Text", widget: "string", required: false },
    { name: "caption", label: "Caption", widget: "string", required: false },
    { name: "height", label: "Height", widget: "string", required: false, default: "500px", hint: "e.g. 500px, 50vh" }
  ],
  pattern: /{{<\s*image-full\s+src="([^"]+)"(?:\s+alt="([^"]*)")?(?:\s+caption="([^"]*)")?(?:\s+height="([^"]*)")?\s*>}}(?:([\s\S]*?){{<\s*\/image-full\s*>}})?/,
  fromBlock: function(match) {
    return {
      src: match[1],
      alt: match[2] || "",
      caption: (match[5] || "").trim() || match[3] || "",
      height: match[4] || "500px"
    };
  },
  toBlock: function(data) {
    let shortcode = `{{< image-full src="${data.src}"`;
    if (data.alt) shortcode += ` alt="${data.alt}"`;
    if (data.height && data.height !== "500px") shortcode += ` height="${data.height}"`;
    shortcode += ` >}}`;
    if (data.caption) shortcode += data.caption;
    shortcode += `{{< /image-full >}}`;
    return shortcode;
  },
  toPreview: function(data) {
    return `<figure style="width: 100%; margin: 1rem 0;">
      <img src="${data.src}" alt="${data.alt || ''}" style="width: 100%; height: ${data.height || '500px'}; object-fit: cover;">
      ${data.caption ? `<figcaption style="text-align: center; font-size: 0.9em; color: #666; font-style: italic; margin-top: 0.5rem;">${data.caption}</figcaption>` : ''}
    </figure>`;
  }
});

// Image Compare (Side-by-Side)
CMS.registerEditorComponent({
  id: "image-compare",
  label: "Side-by-Side Comparison",
  fields: [
    { name: "src1", label: "First Image", widget: "image" },
    { name: "src2", label: "Second Image", widget: "image" },
    { name: "alt1", label: "First Alt Text", widget: "string", required: false },
    { name: "alt2", label: "Second Alt Text", widget: "string", required: false },
    { name: "caption1", label: "First Caption", widget: "string", required: false },
    { name: "caption2", label: "Second Caption", widget: "string", required: false }
  ],
  pattern: /{{<\s*image-compare\s+src1="([^"]+)"\s+src2="([^"]+)"(?:\s+alt1="([^"]*)")?(?:\s+alt2="([^"]*)")?(?:\s+caption1="([^"]*)")?(?:\s+caption2="([^"]*)")?\s*>}}/,
  fromBlock: function(match) {
    return {
      src1: match[1],
      src2: match[2],
      alt1: match[3] || "",
      alt2: match[4] || "",
      caption1: match[5] || "",
      caption2: match[6] || ""
    };
  },
  toBlock: function(data) {
    const sanitize = (s) => (s || "").replace(/[\u201C\u201D\u201E\u201F"]/g, "'");
    let shortcode = `{{< image-compare src1="${data.src1}" src2="${data.src2}"`;
    if (data.alt1) shortcode += ` alt1="${sanitize(data.alt1)}"`;
    if (data.alt2) shortcode += ` alt2="${sanitize(data.alt2)}"`;
    if (data.caption1) shortcode += ` caption1="${sanitize(data.caption1)}"`;
    if (data.caption2) shortcode += ` caption2="${sanitize(data.caption2)}"`;
    shortcode += ` >}}`;
    return shortcode;
  },
  toPreview: function(data) {
    return `<div style="display: flex; gap: 1rem; margin: 1rem 0;">
      <figure style="flex: 1; margin: 0;">
        <img src="${data.src1}" alt="${data.alt1 || ''}" style="width: 100%; border-radius: 4px;">
        ${data.caption1 ? `<figcaption style="text-align: center; font-size: 0.9em; color: #666; font-style: italic; margin-top: 0.5rem;">${data.caption1}</figcaption>` : ''}
      </figure>
      <figure style="flex: 1; margin: 0;">
        <img src="${data.src2}" alt="${data.alt2 || ''}" style="width: 100%; border-radius: 4px;">
        ${data.caption2 ? `<figcaption style="text-align: center; font-size: 0.9em; color: #666; font-style: italic; margin-top: 0.5rem;">${data.caption2}</figcaption>` : ''}
      </figure>
    </div>`;
  }
});

// Image with Caption
CMS.registerEditorComponent({
  id: "image-caption",
  label: "Image with Caption",
  fields: [
    { name: "src", label: "Image", widget: "image" },
    { name: "alt", label: "Alt Text", widget: "string", required: false },
    { name: "caption", label: "Caption", widget: "string", required: false },
    { name: "align", label: "Alignment", widget: "select", options: ["left", "center", "right"], default: "center" },
    { name: "width", label: "Width", widget: "string", required: false, hint: "e.g. 80%, 600px" }
  ],
  pattern: /{{<\s*image-caption\s+src="([^"]+)"(?:\s+alt="([^"]*)")?(?:\s+caption="([^"]*)")?(?:\s+align="([^"]*)")?(?:\s+width="([^"]*)")?\s*>}}(?:([\s\S]*?){{<\s*\/image-caption\s*>}})?/,
  fromBlock: function(match) {
    return {
      src: match[1],
      alt: match[2] || "",
      caption: (match[6] || "").trim() || match[3] || "",
      align: match[4] || "center",
      width: match[5] || ""
    };
  },
  toBlock: function(data) {
    let shortcode = `{{< image-caption src="${data.src}"`;
    if (data.alt) shortcode += ` alt="${data.alt}"`;
    if (data.align && data.align !== "center") shortcode += ` align="${data.align}"`;
    if (data.width) shortcode += ` width="${data.width}"`;
    shortcode += ` >}}`;
    if (data.caption) shortcode += data.caption;
    shortcode += `{{< /image-caption >}}`;
    return shortcode;
  },
  toPreview: function(data) {
    let margin = "0 auto";
    if (data.align === "left") margin = "0 auto 0 0";
    if (data.align === "right") margin = "0 0 0 auto";
    return `<figure style="max-width: ${data.width || '100%'}; margin: ${margin};">
      <img src="${data.src}" alt="${data.alt || ''}" style="width: 100%; border-radius: 4px;">
      ${data.caption ? `<figcaption style="text-align: center; font-size: 0.9em; color: #666; font-style: italic; margin-top: 0.5rem;">${data.caption}</figcaption>` : ''}
    </figure>`;
  }
});

// Gallery
CMS.registerEditorComponent({
  id: "gallery",
  label: "Image Gallery",
  fields: [
    { name: "columns", label: "Columns", widget: "select", options: ["2", "3", "4"], default: "3" },
    { name: "ratio", label: "Aspect Ratio", widget: "select", options: ["1/1", "4/3", "16/9", "3/2"], default: "4/3" },
    { name: "images", label: "Images", widget: "text", hint: "One image per line: /path/to/image.jpg | Alt text | Caption" }
  ],
  pattern: /{{<\s*gallery\s+columns="(\d+)"(?:\s+ratio="([^"]*)")?\s*>}}\n([\s\S]*?)\n{{<\s*\/gallery\s*>}}/,
  fromBlock: function(match) {
    return {
      columns: match[1],
      ratio: match[2] || "4/3",
      images: match[3]
    };
  },
  toBlock: function(data) {
    let shortcode = `{{< gallery columns="${data.columns}"`;
    if (data.ratio && data.ratio !== "4/3") shortcode += ` ratio="${data.ratio}"`;
    shortcode += ` >}}\n${data.images}\n{{< /gallery >}}`;
    return shortcode;
  },
  toPreview: function(data) {
    const lines = (data.images || "").split("\n").filter(l => l.trim());
    const imgs = lines.map(line => {
      const parts = line.split("|").map(s => s.trim());
      const src = parts[0] || "";
      const alt = parts[1] || "";
      const caption = parts[2] || "";
      return `<figure style="margin: 0; position: relative; overflow: hidden;">
        <img src="${src}" alt="${alt}" style="width: 100%; aspect-ratio: ${data.ratio || '4/3'}; object-fit: cover; border-radius: 4px;">
        ${caption ? `<figcaption style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(transparent, rgba(0,0,0,0.7)); color: white; padding: 1rem 0.5rem 0.5rem; text-align: center;">${caption}</figcaption>` : ''}
      </figure>`;
    }).join("");
    return `<div style="display: grid; grid-template-columns: repeat(${data.columns}, 1fr); gap: 1rem;">${imgs}</div>`;
  }
});
