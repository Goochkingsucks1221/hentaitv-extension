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

        const items = doc.select(
            "article, .page-item-detail, .c-tabs-item, .post"
        );

        for (const item of items) {

            const a = item.selectFirst("a[href]");

            if (!a) continue;

            const link = a.attr("href");

            if (!link || !link.startsWith("http")) {
                continue;
            }

            const img = item.selectFirst("img");

            const title =
                img?.attr("alt") ||
                a.attr("title") ||
                item.selectFirst("h3")?.text?.trim() ||
                item.selectFirst("h2")?.text?.trim() ||
                a.text.trim();

            let image =
                img?.attr("data-src") ||
                img?.attr("data-lazy-src") ||
                img?.attr("src") ||
                "";

            list.push({
                name: title || "Unknown",
                imageUrl: image,
                link
            });
        }

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

        const items = doc.select(
            "article, .page-item-detail, .c-tabs-item, .post"
        );

        for (const item of items) {

            const a = item.selectFirst("a[href]");

            if (!a) continue;

            const link = a.attr("href");

            if (!link || !link.startsWith("http")) {
                continue;
            }

            const img = item.selectFirst("img");

            const title =
                img?.attr("alt") ||
                a.attr("title") ||
                item.selectFirst("h3")?.text?.trim() ||
                item.selectFirst("h2")?.text?.trim() ||
                a.text.trim();

            let image =
                img?.attr("data-src") ||
                img?.attr("data-lazy-src") ||
                img?.attr("src") ||
                "";

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
            doc.selectFirst("h1")?.text?.trim() ||
            doc.selectFirst("title")?.text?.trim() ||
            "Unknown";

        const image =
            doc.selectFirst("meta[property='og:image']")
                ?.attr("content") ||
            doc.selectFirst(".summary_image img")
                ?.attr("src") ||
            doc.selectFirst("img")
                ?.attr("src") ||
            "";

        const description =
            doc.selectFirst("meta[name='description']")
                ?.attr("content") ||
            doc.selectFirst(".summary__content")
                ?.text?.trim() ||
            "";

        const episodes = [];

        const epLinks = doc.select(
            ".wp-manga-chapter a, .listing-chapters_wrap a"
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

        const client = new Client();

        // STEP 1: Load episode page
        const res = await client.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": this.source.baseUrl
            }
        });

        const html = res.body;

        // STEP 2: Find iframe
        const iframeMatch =
            html.match(/<iframe[^>]+src=["']([^"']+)["']/i);

        if (!iframeMatch) {
            return [];
        }

        let iframeUrl = iframeMatch[1];

        // Fix URLs
        if (iframeUrl.startsWith("//")) {
            iframeUrl = "https:" + iframeUrl;
        }

        if (iframeUrl.startsWith("/")) {
            iframeUrl = this.source.baseUrl + iframeUrl;
        }

        // STEP 3: Load iframe/player page
        const iframeRes = await client.get(iframeUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Referer": url
            }
        });

        const iframeHtml = iframeRes.body;

        // STEP 4: Extract MP4/M3U8
        const matches = [
            ...iframeHtml.matchAll(
                /https?:\/\/[^"' ]+\.(mp4|m3u8)[^"' ]*/gi
            )
        ];

        if (!matches.length) {
            return [];
        }

        const seen = new Set();

        const videos = [];

        for (const match of matches) {

            const videoUrl = match[0];

            if (seen.has(videoUrl)) continue;

            seen.add(videoUrl);

            let quality = "Default";

            const qualityMatch =
                videoUrl.match(/([0-9]{3,4}p)/i);

            if (qualityMatch) {

                quality = qualityMatch[1];

            } else if (
                videoUrl.includes(".m3u8")
            ) {

                quality = "HLS";
            }

            videos.push({

                url: videoUrl,

                originalUrl: videoUrl,

                quality: quality,

                headers: {

                    "Referer":
                        iframeUrl,

                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",

                    "Accept":
                        "*/*",

                    "Accept-Encoding":
                        "identity;q=1, *;q=0",

                    "Range":
                        "bytes=0-",

                    "Connection":
                        "keep-alive"
                }
            });
        }

        // Sort highest quality first
        videos.sort((a, b) => {

            const qa =
                parseInt(a.quality) || 0;

            const qb =
                parseInt(b.quality) || 0;

            return qb - qa;
        });

        return videos;
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
