class DefaultExtension extends MProvider {
    constructor() {
        super();
        this.client = new Client();

        this.baseUrl = "https://hentai.tv";
    }

    headers(referer = this.baseUrl + "/") {
        return {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "Referer": referer,
            "Origin": this.baseUrl,
            "Accept": "*/*",
            "Connection": "keep-alive"
        };
    }

    async request(url) {
        const res = await this.client.get(url, {
            headers: this.headers()
        });

        return new Document(res.body);
    }

    async getPopular(page) {

        const doc = await this.request(
            `${this.baseUrl}/page/${page}/`
        );

        const list = [];

        const items = doc.select(".grid article");

        for (const item of items) {

            const a = item.selectFirst("a");

            if (!a) continue;

            const url = a.attr("href");

            const title =
                a.attr("title") ||
                item.selectFirst("h2, h3")?.text() ||
                "Unknown";

            const image =
                item.selectFirst("img")?.attr("src") ||
                item.selectFirst("img")?.attr("data-src") ||
                "";

            list.push({
                name: title.trim(),
                imageUrl: image,
                link: url
            });
        }

        return {
            list,
            hasNextPage: true
        };
    }

    async getLatestUpdates(page) {
        return this.getPopular(page);
    }

    async search(query, page, filters) {

        const doc = await this.request(
            `${this.baseUrl}/page/${page}/?s=${encodeURIComponent(query)}`
        );

        const list = [];

        const items = doc.select(".grid article");

        for (const item of items) {

            const a = item.selectFirst("a");

            if (!a) continue;

            const url = a.attr("href");

            const title =
                a.attr("title") ||
                item.selectFirst("h2, h3")?.text() ||
                "Unknown";

            const image =
                item.selectFirst("img")?.attr("src") ||
                item.selectFirst("img")?.attr("data-src") ||
                "";

            list.push({
                name: title.trim(),
                imageUrl: image,
                link: url
            });
        }

        return {
            list,
            hasNextPage: true
        };
    }

    async getDetail(url) {

        const doc = await this.request(url);

        const title =
            doc.selectFirst("h1")?.text() ||
            "Unknown";

        const image =
            doc.selectFirst("video")?.attr("poster") ||
            doc.selectFirst("meta[property=og:image]")?.attr("content") ||
            "";

        const description =
            doc.selectFirst("meta[name=description]")?.attr("content") ||
            "";

        return {
            name: title,
            imageUrl: image,
            description: description,
            episodes: [
                {
                    name: "Episode 1",
                    url: url
                }
            ]
        };
    }

    async getVideoList(url) {

        const res = await this.client.get(url, {
            headers: this.headers(url)
        });

        const html = res.body;

        const videos = [];

        // mp4 direct links
        const mp4Regex =
            /https?:\/\/[^"'\\s]+\.mp4[^"'\\s]*/g;

        const mp4s = html.match(mp4Regex) || [];

        for (const video of mp4s) {

            let quality = "Default";

            if (video.includes("1080")) {
                quality = "1080p";
            } else if (video.includes("720")) {
                quality = "720p";
            } else if (video.includes("480")) {
                quality = "480p";
            }

            videos.push({
                url: video,
                originalUrl: video,
                quality: quality,
                headers: this.headers(url)
            });
        }

        // m3u8 fallback
        const m3u8Regex =
            /https?:\/\/[^"'\\s]+\.m3u8[^"'\\s]*/g;

        const m3u8s = html.match(m3u8Regex) || [];

        for (const stream of m3u8s) {

            videos.push({
                url: stream,
                originalUrl: stream,
                quality: "HLS",
                headers: this.headers(url)
            });
        }

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
