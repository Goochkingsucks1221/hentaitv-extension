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

    // STEP 1: Load episode page
    const res = await client.get(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
    });

    const html = res.body;

    console.log("EPISODE HTML:");
    console.log(html);

    // STEP 2: Extract data-id directly
    const dataMatch =
        html.match(/data-id=["']([^"']+)["']/i);

    if (!dataMatch) {

        console.log("DATA-ID NOT FOUND");

        return [];
    }

    let playerPath = dataMatch[1];

    console.log("PLAYER PATH:", playerPath);

    // STEP 3: Fix URL
    let playerUrl = playerPath;

    if (playerUrl.startsWith("/")) {
        playerUrl = this.source.baseUrl + playerUrl;
    }

    console.log("PLAYER URL:", playerUrl);

    // STEP 4: Extract vid parameter
    const vidMatch =
        playerUrl.match(/[?&]vid=([^&]+)/);

    if (!vidMatch) {

        console.log("VID PARAM NOT FOUND");

        return [];
    }

    let decodedUrl = "";

    try {

        decodedUrl = atob(
            decodeURIComponent(vidMatch[1])
        );

    } catch (e) {

        console.log("BASE64 ERROR:", e);

        return [];
    }

    console.log("DECODED URL:", decodedUrl);

    if (
        !decodedUrl.includes(".mp4") &&
        !decodedUrl.includes(".m3u8")
    ) {

        console.log("NOT A VIDEO URL");

        return [];
    }

    // STEP 5: Return video
    return [{
        url: decodedUrl,

        originalUrl: decodedUrl,

        quality:
            decodedUrl.includes(".m3u8")
                ? "HLS"
                : "MP4",

        headers: {

            "Referer": "https://nhplayer.com/",

            "Origin": new URL(decodedUrl).origin,

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
