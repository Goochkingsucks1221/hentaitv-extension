const kegaretaSauces = [{
    "name": "HentaiTV",
    "lang": "all",
    "baseUrl": "https://hentai.tv",
    "apiUrl": "",
    "iconUrl": "https://hentai.tv/favicon.ico",
    "typeSource": "single",
    "itemType": 1,
    "isNsfw": true,
    "version": "0.0.1.2",
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

        const items = doc.select("article");

        for (const item of items) {

            const a = item.selectFirst("a");

            if (!a) continue;

            list.push({
                name: a.attr("title"),
                imageUrl: a.selectFirst("img")?.attr("src"),
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
            `${this.source.baseUrl}/?s=${query}`
        );

        const doc = new Document(res.body);

        const list = [];

        const items = doc.select("article");

        for (const item of items) {

            const a = item.selectFirst("a");

            if (!a) continue;

            list.push({
                name: a.attr("title"),
                imageUrl: a.selectFirst("img")?.attr("src"),
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

        return {
            name: doc.selectFirst("h1")?.text ?? "Unknown",
            imageUrl: doc.selectFirst("img")?.attr("src"),
            description: doc.selectFirst("meta[name='description']")
                ?.attr("content"),
            episodes
        };
    }

    async getVideoList(url) {

        const res = await new Client().get(url);

        const doc = new Document(res.body);

        const videos = [];

        const iframe = doc.selectFirst("iframe");

        if (iframe) {

            videos.push({
                url: iframe.attr("src"),
                quality: "Default"
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