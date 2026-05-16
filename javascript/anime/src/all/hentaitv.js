const kegaretaSauces = [{
    "name": "HentaiTV",
    "lang": "all",
    "baseUrl": "https://hentai.tv",
    "apiUrl": "",
    "iconUrl": "https://hentai.tv/favicon.ico",
    "typeSource": "single",
    "itemType": 1,
    "isNsfw": true,
    "version": "0.0.1.3",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "anime/src/all/hentaitv.js"
}];

class DefaultExtension extends MProvider {

    async getPopular(page) {

        const res = await new Client().get(
            `${this.source.baseUrl}/page/${page}`
        );

        const doc = new Document(res.body);

        const list = [];

        const items = doc.select(".crsl-slde");

        for (const item of items) {

            const a = item.selectFirst("a");

            if (!a) continue;

            const img = item.selectFirst("img");

            list.push({
                name: a.text.trim(),
                imageUrl: img?.attr("src"),
                link: a.attr("href")
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

        const res = await new Client().get(
            `${this.source.baseUrl}/?s=${encodeURIComponent(query)}`
        );

        const doc = new Document(res.body);

        const list = [];

        const items = doc.select(".crsl-slde, article");

        for (const item of items) {

            const a = item.selectFirst("a");

            if (!a) continue;

            const img = item.selectFirst("img");

            list.push({
                name: a.text.trim(),
                imageUrl: img?.attr("src"),
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

        const episodes = [{
            name: "Episode 1",
            url: url
        }];

        const title =
            doc.selectFirst("h1")?.text ??
            doc.selectFirst("title")?.text ??
            "Unknown";

        const image =
            doc.selectFirst("meta[property='og:image']")
                ?.attr("content") ??
            doc.selectFirst("img")?.attr("src");

        const description =
            doc.selectFirst("meta[name='description']")
                ?.attr("content") ?? "";

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
            "User-Agent": "Mozilla/5.0"
        }
    });

    const body = res.body;

    // find iframe first
    const iframeMatch =
        body.match(/<iframe[^>]+src=["']([^"']+)["']/i);

    if (!iframeMatch) {
        return [];
    }

    let iframeUrl = iframeMatch[1];

    if (iframeUrl.startsWith("//")) {
        iframeUrl = "https:" + iframeUrl;
    }

    if (iframeUrl.startsWith("/")) {
        iframeUrl = this.source.baseUrl + iframeUrl;
    }

    // load player page
    const iframeRes = await client.get(iframeUrl, {
        headers: {
            "Referer": url,
            "Origin": this.source.baseUrl,
            "User-Agent": "Mozilla/5.0"
        }
    });

    const html = iframeRes.body;

    // look for downloadable mp4
    const mp4Match = html.match(
        /https?:\/\/[^"' ]+\.mp4\?[^"' ]+/i
    );

    if (!mp4Match) {
        console.log("NO DOWNLOAD LINK FOUND");
        return [];
    }

    const videoUrl = mp4Match[0];

    console.log("VIDEO URL:", videoUrl);

    return [{
        url: videoUrl,
        originalUrl: videoUrl,
        quality: "HD",
        headers: {
            "Referer": iframeUrl,
            "Origin": this.source.baseUrl,
            "User-Agent": "Mozilla/5.0"
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