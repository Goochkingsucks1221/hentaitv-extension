const kegaretaSauces = [{
    "name": "HentaiTV",
    "lang": "en",
    "baseUrl": "https://hentai.tv",
    "apiUrl": "",
    "iconUrl": "https://hentai.tv/favicon.ico",
    "typeSource": "single",
    "itemType": 1,
    "isNsfw": true,
    "version": "0.0.1.6",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "anime/src/all/hentaitv.js"
}];

class DefaultExtension extends MProvider {

    async getPopular(page) {

        const res = await new Client().get(
            this.source.baseUrl
        );

        const doc = new Document(res.body);

        const list = [];

        const items = doc.select("a");

        for (const item of items) {

            const href = item.attr("href");

            if (!href) continue;

            if (
                !href.includes("/hentai/") &&
                !href.includes("/videos/")
            ) continue;

            const title =
                item.attr("title") ||
                item.text.trim();

            if (!title) continue;

            const img =
                item.selectFirst("img")?.attr("src") ||
                item.selectFirst("img")?.attr("data-src") ||
                "";

            list.push({
                name: title,
                imageUrl: img,
                link: href
            });
        }

        return {
            list,
            hasNextPage: false
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

        const items = doc.select("a");

        for (const item of items) {

            const href = item.attr("href");

            if (!href) continue;

            const title =
                item.attr("title") ||
                item.text.trim();

            if (!title) continue;

            if (
                !title.toLowerCase()
                .includes(query.toLowerCase())
            ) continue;

            const img =
                item.selectFirst("img")?.attr("src") ||
                "";

            list.push({
                name: title,
                imageUrl: img,
                link: href
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

        const res = await new Client().get(url);

        const doc = new Document(res.body);

        const videos = [];

        const server = doc.selectFirst(".servers ul li");

        if (!server) {
            return [];
        }

        const dataId = server.attr("data-id");

        if (!dataId) {
            return [];
        }

        const match = dataId.match(/vid=([^&]+)/);

        if (!match) {
            return [];
        }

        const encoded = match[1];

        let decoded = "";

        try {

            decoded = atob(encoded);

        } catch (e) {

            return [];
        }

        videos.push({
            url: decoded,
            quality: "MP4"
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