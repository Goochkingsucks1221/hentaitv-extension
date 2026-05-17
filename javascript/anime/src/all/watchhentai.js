class DefaultExtension extends MProvider {

    constructor() {
        super();
        this.client = new Client();
    }

    async request(url) {

        const res = await this.client.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": this.source.baseUrl
            }
        });

        return new Document(res.body);
    }

    async getPopular(page) {

    const doc = await this.request(
        `${this.source.baseUrl}/page/${page}/`
    );

    const list = [];

    const items = doc.select("article, .item, .bs");

    for (const item of items) {

        const a =
            item.selectFirst("a[href]");

        if (!a) continue;

        const link = a.attr("href");

        if (
            !link ||
            !link.startsWith("http")
        ) continue;

        const img =
            item.selectFirst("img");

        const title =
            img?.attr("alt") ||
            a.attr("title") ||
            item.selectFirst("h3")?.text?.trim() ||
            a.text.trim();

        let image =
            img?.attr("data-src") ||
            img?.attr("src") ||
            "";

        // Convert backdrop preview -> poster
        if (image.includes("timthumb")) {

            image = image
                .replace(
                    /timthumb\/backdrop\.php\?src=/,
                    ""
                )
                .replace(
                    /backdrop\d*\.(jpg|png|webp)/i,
                    "poster.jpg"
                );
        }

        console.log("TITLE:", title);
        console.log("LINK:", link);
        console.log("IMAGE:", image);

        list.push({
            name: title || "Unknown",
            imageUrl: image,
            link
        });
    }

    console.log("TOTAL:", list.length);

    return {
        list,
        hasNextPage: true
    };
}

    async getLatestUpdates(page) {
        return await this.getPopular(page);
    }

    async search(query, page, filters) {

    const doc = await this.request(
        `${this.source.baseUrl}/?s=${encodeURIComponent(query)}`
    );

    const list = [];

    const items = doc.select("article, .item, .bs");

    for (const item of items) {

        const a =
            item.selectFirst("a[href]");

        if (!a) continue;

        const link = a.attr("href");

        const img =
            item.selectFirst("img");

        const title =
            img?.attr("alt") ||
            a.attr("title") ||
            item.selectFirst("h3")?.text?.trim() ||
            a.text.trim();

        let image =
            img?.attr("data-src") ||
            img?.attr("src") ||
            "";

        // Convert backdrop preview -> poster
        if (image.includes("timthumb")) {

            image = image
                .replace(
                    /timthumb\/backdrop\.php\?src=/,
                    ""
                )
                .replace(
                    /backdrop\d*\.(jpg|png|webp)/i,
                    "poster.jpg"
                );
        }

        list.push({
            name: title || "Unknown",
            imageUrl: image,
            link
        });
    }

    return {
        list,
        hasNextPage: false
    };
}

    async getDetail(url) {

    const doc = await this.request(url);

    const title =
        doc.selectFirst("h1")?.text ||
        doc.selectFirst("title")?.text ||
        "Unknown";

    let image =
        doc.selectFirst("meta[property='og:image']")
            ?.attr("content") ||
        doc.selectFirst("img")
            ?.attr("src") ||
        "";

    // Convert backdrop -> poster
    if (image.includes("backdrop")) {

        image = image.replace(
            /backdrop\d*\.(jpg|png|webp)/i,
            "poster.jpg"
        );
    }

    const description =
        doc.selectFirst("meta[name='description']")
            ?.attr("content") ||
        "";

    const episodes = [];

    const epLinks = doc.select(
        "a[href*='episode']"
    );

    if (epLinks.length > 0) {

        for (const ep of epLinks) {

            episodes.push({
                name: ep.text.trim(),
                url: ep.attr("href")
            });
        }

    } else {

        episodes.push({
            name: "Episode 1",
            url
        });
    }

    return {
        name: title,
        imageUrl: image,
        description,
        episodes
    };
}

    async getVideoList(url) {

        const res = await this.client.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        const html = res.body;

        // iframe source
        let iframe =
            html.match(/<iframe[^>]+src=["']([^"']+)["']/i);

        if (!iframe) {
            return [];
        }

        let iframeUrl = iframe[1];

        if (iframeUrl.startsWith("//")) {
            iframeUrl = "https:" + iframeUrl;
        }

        const player = await this.client.get(iframeUrl, {
            headers: {
                "Referer": url,
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        const playerHtml = player.body;

        const video =
            playerHtml.match(
                /https?:\/\/[^"' ]+\.(m3u8|mp4)[^"' ]*/i
            );

        if (!video) {
            return [];
        }

        const videoUrl = video[0];

        return [{
            url: videoUrl,
            originalUrl: videoUrl,
            quality:
                videoUrl.includes(".m3u8")
                    ? "HLS"
                    : "MP4",
            headers: {
                "Referer": iframeUrl,
                "Origin": new URL(videoUrl).origin,
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        }];
    }

    async getPageList() {
        throw new Error("Not manga source");
    }

    getFilterList() {
        return [];
    }

    getSourcePreferences() {
        return [];
    }
}

extension = new DefaultExtension();
