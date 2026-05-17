const watchhentaiExtension = [{
    "name": "WatchHentai",
    "lang": "en-Sub",
    "baseUrl": "https://watchhentai.net",
    "apiUrl": "",
    "iconUrl": "https://watchhentai.net/favicon.ico",
    "typeSource": "single",
    "itemType": 1,
    "isNsfw": true,
    "version": "0.0.1.0",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "anime/src/all/watchhentai.js"
}];

class DefaultExtension extends MProvider {

    async getPopular(page) {

        const res = await new Client().get(
            `${this.source.baseUrl}/tvshows/page/${page}/`
        );

        const doc = new Document(res.body);

        const list = [];

        const items = doc.select(".items .item");

        for (const item of items) {

            const a = item.selectFirst("a");

            if (!a) continue;

            const img = item.selectFirst("img");

            const title =
                item.selectFirst(".data h3")?.text?.trim() ||
                img?.attr("alt") ||
                a.attr("title") ||
                "Unknown";

            list.push({
                name: title,
                imageUrl:
                    img?.attr("data-src") ||
                    img?.attr("src"),
                link: a.attr("href")
            });
        }

        return {
            list,
            hasNextPage: true
        };
    }

    async getLatestUpdates(page) {

        const res = await new Client().get(
            `${this.source.baseUrl}/episodes/page/${page}/`
        );

        const doc = new Document(res.body);

        const list = [];

        const items = doc.select(".items .item");

        for (const item of items) {

            const a = item.selectFirst("a");

            if (!a) continue;

            const img = item.selectFirst("img");

            const title =
                item.selectFirst(".data h3")?.text?.trim() ||
                img?.attr("alt") ||
                a.attr("title") ||
                "Unknown";

            list.push({
                name: title,
                imageUrl:
                    img?.attr("data-src") ||
                    img?.attr("src"),
                link: a.attr("href")
            });
        }

        return {
            list,
            hasNextPage: true
        };
    }

    async search(query, page, filters) {

        const res = await new Client().get(
            `${this.source.baseUrl}/?s=${encodeURIComponent(query)}`
        );

        const doc = new Document(res.body);

        const list = [];

        const items = doc.select(".items .item, article");

        for (const item of items) {

            const a = item.selectFirst("a");

            if (!a) continue;

            const img = item.selectFirst("img");

            const title =
                item.selectFirst(".data h3")?.text?.trim() ||
                img?.attr("alt") ||
                a.attr("title") ||
                a.text.trim() ||
                "Unknown";

            list.push({
                name: title,
                imageUrl:
                    img?.attr("data-src") ||
                    img?.attr("src"),
                link: a.attr("href")
            });
        }

        return {
            list,
            hasNextPage: false
        };
    }

    async getDetail(url) {

        const res = await new Client().get(url);

        const doc = new Document(res.body);

        const title =
            doc.selectFirst("h1")?.text?.trim() ||
            doc.selectFirst("title")?.text?.trim() ||
            "Unknown";

        const image =
            doc.selectFirst("meta[property='og:image']")
                ?.attr("content") ||
            doc.selectFirst(".poster img")
                ?.attr("src") ||
            doc.selectFirst("img")
                ?.attr("src");

        const description =
            doc.selectFirst("meta[name='description']")
                ?.attr("content") ||
            doc.selectFirst(".wp-content p")
                ?.text?.trim() ||
            "";

        const episodes = [];

        const epItems = doc.select(
            "#seasons .episodios li, .episodes li, ul.episodios li"
        );

        if (epItems.length > 0) {

            for (const ep of epItems) {

                const a = ep.selectFirst("a");

                if (!a) continue;

                episodes.push({
                    name:
                        a.text.trim() ||
                        "Episode",
                    url: a.attr("href")
                });
            }

        } else {

            episodes.push({
                name: "Episode 1",
                url: url
            });
        }

        return {
            name: title,
            imageUrl: image,
            description: description,
            episodes
        };
    }

    async getVideoList(url) {

        const client = new Client();

        const res = await client.get(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        const html = res.body;

        // Try direct iframe first
        let iframeMatch = html.match(
            /<iframe[^>]+src=["']([^"']+)["']/i
        );

        let playerUrl = "";

        if (iframeMatch) {

            playerUrl = iframeMatch[1];

        } else {

            // Fallback to data-id
            const dataMatch =
                html.match(/data-id=["']([^"']+)["']/i);

            if (dataMatch) {
                playerUrl = dataMatch[1];
            }
        }

        if (!playerUrl) {
            return [];
        }

        if (playerUrl.startsWith("/")) {
            playerUrl =
                this.source.baseUrl + playerUrl;
        }

        // Load player page
        const playerRes = await client.get(playerUrl, {
            headers: {
                "Referer": url,
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            }
        });

        const playerHtml = playerRes.body;

        // Extract m3u8/mp4
        const videoMatch =
            playerHtml.match(/https?:\/\/[^"'\\ ]+\.(m3u8|mp4)[^"'\\ ]*/i);

        if (!videoMatch) {
            return [];
        }

        const videoUrl = videoMatch[0];

        return [{
            url: videoUrl,

            originalUrl: videoUrl,

            quality:
                videoUrl.includes(".m3u8")
                    ? "HLS"
                    : "MP4",

            headers: {

                "Referer": playerUrl,

                "Origin": new URL(videoUrl).origin,

                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",

                "Accept": "*/*"
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
